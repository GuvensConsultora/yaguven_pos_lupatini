import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { PosStore } from "@point_of_sale/app/services/pos_store";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";

/**
 * El botón de descuento del teclado dice «Descuento» en vez de «%».
 *
 * Pedido de Lucas (16/09/2026). El texto sale de `getNumpadButtons()` del core
 * (`text: _t("%")`); no se cambia por traducción porque «%» se usa en otras
 * partes. Se toca sólo el texto: la habilitación del botón (descuento manual
 * permitido en la caja, rol del cajero) sigue siendo la del core.
 */
patch(ProductScreen.prototype, {
    getNumpadButtons() {
        return super.getNumpadButtons(...arguments).map((boton) =>
            boton.value === "discount" ? { ...boton, text: _t("Descuento") } : boton
        );
    },
});

/**
 * Tope de descuento según la lista de la venta (pedido de Anael, 11/06 y 16/06).
 *
 * El teclado aplica el descuento en cada tecla (`setDiscountFromUI`): si el valor
 * supera el máximo de la lista, se deja en el máximo y se avisa. Los gerentes no
 * tienen tope (mismo criterio que el cambio de precio). El servidor lo controla
 * también (`pos.order.line._yg_check_tope_descuento`).
 */
/** Máximo de descuento que rige para el cajero en esta venta, o null si no hay tope. */
function topeDescuento(pos, order) {
    const lista = order?.pricelist_id;
    if (!lista?.yg_tope_descuento) {
        return null;
    }
    if (pos.accessRight?.loggedCashier?._role === "manager") {
        return null;
    }
    return lista.yg_descuento_max || 0;
}

/**
 * Al cambiar de cliente o de lista, el core recalcula los precios (`setPricelist`) pero deja
 * el descuento de cada línea como estaba (pedido de Anael, 20/11: Consumidor Final con 20 %
 * y después se cambia a un cliente de otra lista). Se baja al tope de la lista nueva y se
 * avisa; si no, el servidor lo rechaza recién al cobrar.
 */
function ajustarAlTope(pos, order) {
    const max = topeDescuento(pos, order);
    if (max === null) {
        return;
    }
    const lineas = (order.lines || []).filter((l) => (l.discount || 0) > max);
    if (!lineas.length) {
        return;
    }
    for (const linea of lineas) {
        linea.setDiscount(max);
    }
    pos.notification.add(
        _t(
            "La lista %s admite hasta %s %% de descuento: se ajustó el descuento de %s línea(s).",
            order.pricelist_id.display_name,
            max,
            lineas.length
        ),
        { type: "warning" }
    );
}

patch(PosStore.prototype, {
    async setDiscountFromUI(line, val) {
        const max = topeDescuento(this, line.order_id);
        const pedido = parseFloat(val);
        if (max !== null && !isNaN(pedido) && pedido > max) {
            this.notification.add(
                _t(
                    "La lista %s admite hasta %s %% de descuento.",
                    line.order_id.pricelist_id.display_name,
                    max
                ),
                { type: "warning" }
            );
            return await super.setDiscountFromUI(line, max);
        }
        return await super.setDiscountFromUI(line, val);
    },

    setPartnerToCurrentOrder(partner) {
        const res = super.setPartnerToCurrentOrder(...arguments);
        ajustarAlTope(this, this.getOrder());
        return res;
    },

    async selectPricelist(pricelist) {
        const res = await super.selectPricelist(...arguments);
        ajustarAlTope(this, this.getOrder());
        return res;
    },
});
