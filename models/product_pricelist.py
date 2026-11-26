from odoo import api, fields, models


class ProductPricelist(models.Model):
    _inherit = 'product.pricelist'

    # Pedido de Anael (11/06 y 16/06): tope al descuento que se da en la caja, según la lista.
    # Vacío por defecto (B.23): los valores los define el cliente lista por lista.
    yg_tope_descuento = fields.Boolean(
        string='Tope de descuento',
        help='Si está marcado, no se puede cargar en una línea un descuento mayor al máximo de '
             'abajo cuando la venta usa esta lista. En la caja no tienen tope los gerentes del '
             'punto de venta; en Ventas, sólo quien tiene el permiso «Puede superar el tope de '
             'descuento en Ventas».')
    yg_descuento_max = fields.Float(
        string='Descuento máximo (%)', digits=(5, 2),
        help='Descuento máximo por línea, en la caja y en Ventas, con esta lista (0 = sin descuento).')

    @api.model
    def _load_pos_data_fields(self, config):
        # El core define la lista (restrictiva): se suma.
        return super()._load_pos_data_fields(config) + ['yg_tope_descuento', 'yg_descuento_max']
