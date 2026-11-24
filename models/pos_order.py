from odoo import models


class PosOrder(models.Model):
    _inherit = 'pos.order'

    def _prepare_account_move_line_data_from_base_line(self, base_lines):
        """Factura desde la caja: en los productos con «Precio libre en caja» (envases, zz VARIOS),
        la descripción del renglón es la que escribió el cajero (`full_product_name`), no la
        descripción de venta del producto. Pedido de Anael, 20/11 y 24/11.

        El core arma el renglón con `name = product.description_sale`; el texto que el cajero cambió
        en la caja sólo queda en `pos.order.line.full_product_name`.
        """
        res = super()._prepare_account_move_line_data_from_base_line(base_lines)
        for item in res:
            vals = item.get('account.move.line') or {}
            linea = (item.get('metadata') or {}).get('line')
            if (
                vals.get('display_type') == 'product'
                and linea
                and linea.product_id.product_tmpl_id.yg_precio_libre_pos
                and linea.full_product_name
                and linea.full_product_name != linea.product_id.display_name
            ):
                vals['name'] = linea.full_product_name
        return res
