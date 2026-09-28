from odoo import _, api, models
from odoo.exceptions import ValidationError
from odoo.tools import float_compare


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    @api.constrains('discount')
    def _yg_check_tope_descuento(self):
        """El tope de descuento de la lista, también del lado del servidor.

        La caja ya lo frena al cargarlo; esto cubre una sincronización que saltee la pantalla.
        Los gerentes del punto de venta (el grupo de gerente de la caja) no tienen tope.
        """
        for linea in self:
            orden = linea.order_id
            lista = orden.pricelist_id
            if not lista.yg_tope_descuento or not linea.discount:
                continue
            if float_compare(linea.discount, lista.yg_descuento_max, precision_digits=2) <= 0:
                continue
            gerente = orden.config_id.group_pos_manager_id
            if gerente and gerente in orden.user_id.all_group_ids:
                continue
            raise ValidationError(_(
                'El descuento de %(prod)s (%(desc)s %%) supera el máximo de la lista %(lista)s '
                '(%(max)s %%). Sólo un gerente puede superarlo.',
                prod=linea.product_id.display_name, desc=linea.discount,
                lista=lista.display_name, max=lista.yg_descuento_max))
