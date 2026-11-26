from odoo import api, fields, models
from odoo.tools import SQL


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    # Pedido de Lucas (15/10): los colores de auto se venden con un envase de precio 0 y el
    # precio lo da el programa de color. Vacío por defecto (B.23): se marca producto por producto.
    yg_precio_libre_pos = fields.Boolean(
        string='Precio libre en caja',
        help='Si está marcado, en el punto de venta cualquier cajero puede cambiar el precio de '
             'este producto aunque la caja restrinja el control de precios. Para el resto de '
             'los productos, con la restricción prendida, sólo el gerente cambia el precio.')

    @api.model
    def _load_pos_data_fields(self, config):
        # El core define la lista (restrictiva): se suma.
        return super()._load_pos_data_fields(config) + ['yg_precio_libre_pos']

    # lup-050 (26/11): con 5.000 productos la caja tardaba ~3 min en abrir y Chrome ofrecía
    # cerrarla. Se precargan menos (parámetro nativo point_of_sale.limited_product_count) y,
    # a pedido del usuario, primero los MÁS VENDIDOS EN LA SUCURSAL de la caja: cantidad de
    # ventas (pedidos distintos, no unidades) de los últimos N meses, contando los pedidos de
    # Ventas de su unidad operativa y las órdenes de esa caja. El resto se busca con «Buscar más».
    @api.model
    def _load_pos_metadata(self, data, search_params={}):
        config = data['pos.config']['records'][0]
        return super(ProductTemplate, self.with_context(yg_pos_config_id=config.id))._load_pos_metadata(
            data, search_params)

    def _yg_sql_ranking_ventas(self, config):
        meses = self.env['ir.config_parameter'].sudo().get_int('yaguven_pos_lupatini.meses_ranking_ventas') or 12
        desde = fields.Datetime.subtract(fields.Datetime.now(), months=meses)
        partes = [SQL("""
            SELECT pp.product_tmpl_id AS tmpl_id, po.id AS venta
              FROM pos_order_line pol
              JOIN pos_order po ON po.id = pol.order_id
              JOIN pos_session ps ON ps.id = po.session_id
              JOIN product_product pp ON pp.id = pol.product_id
             WHERE ps.config_id = %s AND po.state IN ('paid', 'done') AND po.date_order >= %s
        """, config.id, desde)]
        unidad = config.operating_unit_id if 'operating_unit_id' in config._fields else False
        if unidad and 'operating_unit_id' in self.env['sale.order']._fields:
            partes.append(SQL("""
                SELECT pp.product_tmpl_id, -so.id
                  FROM sale_order_line sol
                  JOIN sale_order so ON so.id = sol.order_id
                  JOIN product_product pp ON pp.id = sol.product_id
                 WHERE so.state = 'sale' AND so.operating_unit_id = %s AND so.date_order >= %s
            """, unidad.id, desde))
        # Ventas con id negativo: un pedido de Ventas y una orden de caja no se pisan al contar.
        return SQL("SELECT tmpl_id, COUNT(DISTINCT venta) AS ventas FROM (%s) v GROUP BY tmpl_id",
                   SQL(" UNION ALL ").join(partes))

    def _get_load_product_template_sql(self, query, limit_count):
        config_id = self.env.context.get('yg_pos_config_id')
        if not config_id:
            return super()._get_load_product_template_sql(query, limit_count)
        config = self.env['pos.config'].browse(config_id)
        # Mismo orden que el core (favoritos y servicios primero), con las ventas de la
        # sucursal antes de la fecha de modificación.
        return SQL("""
            WITH yg_ranking AS (%s)
            SELECT product_template.id
                FROM %s
                LEFT JOIN yg_ranking ON yg_ranking.tmpl_id = product_template.id
                WHERE %s
            ORDER BY product_template.is_favorite DESC NULLS LAST,
                CASE WHEN product_template.type = 'service' THEN 1 ELSE 0 END DESC,
                COALESCE(yg_ranking.ventas, 0) DESC,
                product_template.write_date DESC
            LIMIT %s
            """,
            self._yg_sql_ranking_ventas(config),
            query.from_clause,
            query.where_clause or SQL("TRUE"),
            limit_count,
        )
