from odoo import api, fields, models


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
