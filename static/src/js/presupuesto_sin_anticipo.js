import { patch } from "@web/core/utils/patch";
import { PosStore } from "@point_of_sale/app/services/pos_store";
import { SelectionPopup } from "@point_of_sale/app/components/popups/selection_popup/selection_popup";

/**
 * Traer un presupuesto a la caja sin el cartel de anticipo (pedido de Anael, 19/11/2026).
 *
 * Al elegir un presupuesto en «Cotización/orden», `pos_sale` pregunta «¿Qué quieres hacer?»:
 * Cerrar la orden / anticipo (porcentaje) / anticipo (importe fijo). En las sucursales no se cobran
 * anticipos, y las dos opciones de anticipo se leían como si el sistema pidiera facturar un
 * porcentaje. Acá ese cartel no se muestra: se contesta solo «Cerrar la orden» (`settle`), que es
 * el camino que ya usaban.
 *
 * No se reescribe `_processSaleOrder` (es largo y nativo): mientras corre, el servicio de diálogos
 * se envuelve para interceptar sólo ESE cartel, reconocido por traer la opción `dpPercentage`.
 * Cualquier otro diálogo (lotes, avisos) pasa igual que siempre.
 */
patch(PosStore.prototype, {
    async _processSaleOrder(sale_order) {
        const original = this.dialog;
        this.dialog = new Proxy(original, {
            get(target, prop) {
                if (prop === "add") {
                    return (comp, props, options) => {
                        const esCartelAnticipo =
                            comp === SelectionPopup &&
                            (props?.list || []).some((i) => i.item === "dpPercentage");
                        if (esCartelAnticipo) {
                            props.getPayload("settle");
                            return () => {};
                        }
                        return target.add(comp, props, options);
                    };
                }
                return Reflect.get(target, prop);
            },
        });
        try {
            return await super._processSaleOrder(...arguments);
        } finally {
            this.dialog = original;
        }
    },
});
