import { ControlButtons } from "@point_of_sale/app/screens/product_screen/control_buttons/control_buttons";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";

/**
 * «Guardar como presupuesto» en el menú ⋮ de la caja (pedido de Anael, 04/11/2026).
 *
 * La caja de O20 sólo trae una cotización existente («Cotización/orden»); no guarda el carrito
 * como cotización. Si el cajero deja el carrito guardado en la caja, queda como venta en curso:
 * no aparece en «Cotización/orden» y además impide cerrar la sesión (pasó con la 3008, 03/11).
 *
 * El botón manda el carrito al servidor (`sale.order.yg_crear_presupuesto_desde_caja`), que crea
 * el presupuesto en Ventas, y después saca el carrito de la caja con el mismo camino que usa el
 * botón de borrar orden (`deleteOrders`: si la orden ya estaba sincronizada, la cancela en el
 * servidor), así no queda nada pendiente. Las validaciones de fondo (cliente, cantidades) están en
 * el servidor; acá sólo se frena lo que se ve sin consultarlo.
 */
patch(ControlButtons.prototype, {
    async onClickGuardarPresupuesto() {
        const orden = this.pos.getOrder();
        if (!orden || !orden.lines.length) {
            this.notification.add(_t("El carrito está vacío."), { type: "warning" });
            return;
        }
        if (orden.lines.some((l) => l.sale_order_origin_id)) {
            this.notification.add(
                _t("Este carrito viene de un presupuesto que ya existe: no se vuelve a guardar."),
                { type: "warning" }
            );
            return;
        }
        if (!orden.partner_id) {
            this.notification.add(_t("Elegí el cliente antes de guardar el presupuesto."), {
                type: "warning",
            });
            return;
        }

        const datos = {
            partner_id: orden.partner_id.id,
            pricelist_id: orden.pricelist_id?.id || false,
            fiscal_position_id: orden.fiscal_position_id?.id || false,
            lines: orden.lines.map((l) => ({
                product_id: l.product_id.id,
                qty: l.qty,
                price_unit: l.price_unit,
                discount: l.discount || 0,
                tax_ids: (l.tax_ids || []).map((t) => t.id),
            })),
        };

        // Si el servidor rechaza (cliente anónimo, cantidades), el error se muestra solo y el
        // carrito queda intacto en la caja: no se borra nada antes de tener el presupuesto.
        const presupuesto = await this.pos.data.call(
            "sale.order",
            "yg_crear_presupuesto_desde_caja",
            [this.pos.config.id, datos]
        );

        await this.pos.deleteOrders([orden]);
        await this.pos.afterOrderDeletion();
        this.notification.add(_t("Presupuesto %s guardado.", presupuesto.name), {
            type: "success",
        });
    },
});
