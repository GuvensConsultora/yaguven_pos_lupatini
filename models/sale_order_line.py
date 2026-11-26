from odoo import _, api, models
from odoo.exceptions import ValidationError
from odoo.tools import float_compare

GRUPO_SUPERA_TOPE = 'yaguven_pos_lupatini.group_supera_tope_descuento'


class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    def _yg_descuento_de_la_lista(self):
        """El descuento que pone la propia lista (regla de «descuento» visible), no el vendedor.

        Mismo cálculo que `_compute_discount` de Ventas. Hoy pasa en Obra, con dos productos al
        41,5 %: sin esto, nadie sin el permiso podría venderlos con esa lista.
        """
        self.ensure_one()
        if not self.pricelist_item_id._show_discount():
            return 0.0
        linea = self.with_company(self.company_id)
        precio_lista = linea._get_pricelist_price()
        precio_base = linea._get_pricelist_price_before_discount()
        if precio_base <= 0:
            return 0.0
        return max((precio_base - precio_lista) / precio_base * 100, 0.0)

    @api.constrains('discount', 'order_id')
    def _yg_check_tope_descuento_ventas(self):
        """El tope de descuento de la lista, en Ventas (pedido de Anael, 25/11/2026).

        La caja ya lo tenía (`pos_order_line.py`). Acá sólo pasa quien tiene el permiso
        «Puede superar el tope de descuento en Ventas». Quedan afuera:
        - los procesos internos del sistema (superusuario);
        - las cargas por script que lo piden con el contexto `yg_sin_tope_descuento`
          (migración de ventas históricas, que ya traen sus descuentos).
        Sólo se revisa lo que se crea o se modifica: las ventas ya hechas no se tocan.
        """
        if self.env.su or self.env.context.get('yg_sin_tope_descuento'):
            return
        if self.env.user.has_group(GRUPO_SUPERA_TOPE):
            return
        for linea in self:
            if linea.display_type or not linea.discount:
                continue
            lista = linea.order_id.pricelist_id
            if not lista.yg_tope_descuento:
                continue
            permitido = max(lista.yg_descuento_max, linea._yg_descuento_de_la_lista())
            if float_compare(linea.discount, permitido, precision_digits=2) <= 0:
                continue
            raise ValidationError(_(
                'El descuento de %(prod)s (%(desc)s %%) supera el máximo de la lista %(lista)s '
                '(%(max)s %%). Para darlo hace falta el permiso «Puede superar el tope de '
                'descuento en Ventas».',
                prod=linea.product_id.display_name, desc=linea.discount,
                lista=lista.display_name, max=round(permitido, 2)))


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    @api.constrains('pricelist_id')
    def _yg_check_tope_descuento_al_cambiar_lista(self):
        """Cambiar la lista de una cotización también revisa el tope (p. ej. de Taller a Obra)."""
        self.order_line._yg_check_tope_descuento_ventas()
