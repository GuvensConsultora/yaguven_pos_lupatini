from odoo import _, api, models
from odoo.exceptions import UserError


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    @api.model
    def yg_crear_presupuesto_desde_caja(self, config_id, datos):
        """Guarda el carrito de la caja como presupuesto de Ventas (pedido de Anael, 04/11/2026).

        La caja de O20 no trae «guardar carrito como cotización»: sólo trae una cotización
        existente (`load_sale_order_from_pos`). Si el cajero deja el carrito guardado en la caja,
        queda como pos.order en borrador, no aparece en «Cotización/orden» y además impide cerrar
        la sesión (`close_session_from_ui` rechaza cualquier orden en borrador).

        `datos` (lo arma la caja):
            partner_id, pricelist_id, fiscal_position_id,
            lines: [{product_id, qty, price_unit, discount, tax_ids}]

        Criterios:
        - El precio y el descuento se copian TAL CUAL están en el carrito (precio libre, descuento
          del cajero). Con `price_unit` explícito y `technical_price_unit` en 0, la línea queda
          marcada como precio manual y `_compute_price_unit` no la vuelve a la lista.
        - Responsable = usuario que está en la caja; almacén = el de la caja. La unidad operativa
          se completa sola desde el almacén (`yaguven_operating_unit`). Sin esto el presupuesto
          quedaría sin sucursal (regla B.27 del estudio).
        - Cliente obligatorio: un presupuesto anónimo no se puede encontrar cuando el cliente vuelve.

        Devuelve {'id', 'name'} del presupuesto creado.
        """
        config = self.env['pos.config'].browse(config_id).exists()
        if not config:
            raise UserError(_('No se encontró la caja.'))

        partner = self.env['res.partner'].browse(datos.get('partner_id') or 0).exists()
        anonimos = config.default_partner_id | (
            self.env.ref('l10n_ar.par_cfa', raise_if_not_found=False) or self.env['res.partner'])
        if not partner:
            raise UserError(_('Elegí el cliente antes de guardar el presupuesto.'))
        if partner in anonimos:
            raise UserError(_('Un presupuesto a «%s» no se puede buscar después, cuando el cliente '
                              'vuelve: cargá a la persona con su nombre y guardalo de nuevo.',
                              partner.display_name))

        lineas = [l for l in datos.get('lines') or [] if l.get('product_id')]
        if not lineas:
            raise UserError(_('El carrito está vacío: no hay nada para guardar como presupuesto.'))
        if any((l.get('qty') or 0) <= 0 for l in lineas):
            raise UserError(_('El carrito tiene líneas en cero o en negativo (devoluciones). '
                              'Un presupuesto sólo lleva cantidades positivas.'))

        vals = {
            'partner_id': partner.id,
            'company_id': config.company_id.id,
            'user_id': self.env.user.id,
            'warehouse_id': config.warehouse_id.id,
            'origin': config.name,
            'order_line': [(0, 0, {
                'product_id': l['product_id'],
                'product_uom_qty': l['qty'],
                'price_unit': l.get('price_unit') or 0.0,
                'technical_price_unit': 0.0,
                'discount': l.get('discount') or 0.0,
                'tax_ids': [(6, 0, l.get('tax_ids') or [])],
            }) for l in lineas],
        }
        if datos.get('pricelist_id'):
            vals['pricelist_id'] = datos['pricelist_id']
        if datos.get('fiscal_position_id'):
            vals['fiscal_position_id'] = datos['fiscal_position_id']
        if config.crm_team_id:
            vals['team_id'] = config.crm_team_id.id

        presupuesto = self.with_company(config.company_id).create(vals)
        presupuesto.message_post(body=_(
            'Presupuesto guardado desde la caja %(caja)s por %(usuario)s.',
            caja=config.name, usuario=self.env.user.name))
        return {'id': presupuesto.id, 'name': presupuesto.name}
