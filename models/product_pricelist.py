from odoo import api, fields, models


class ProductPricelist(models.Model):
    _inherit = 'product.pricelist'

    # Pedido de Anael (11/06 y 16/06): tope al descuento que se da en la caja, según la lista.
    # Vacío por defecto (B.23): los valores los define el cliente lista por lista.
    yg_tope_descuento = fields.Boolean(
        string='Tope de descuento en caja',
        help='Si está marcado, en el punto de venta el cajero no puede cargar en una línea un '
             'descuento mayor al máximo de abajo cuando la venta usa esta lista. Los gerentes '
             'del punto de venta no tienen tope.')
    yg_descuento_max = fields.Float(
        string='Descuento máximo en caja (%)', digits=(5, 2),
        help='Descuento máximo por línea en el punto de venta con esta lista (0 = sin descuento).')

    @api.model
    def _load_pos_data_fields(self, config):
        # El core define la lista (restrictiva): se suma.
        return super()._load_pos_data_fields(config) + ['yg_tope_descuento', 'yg_descuento_max']
