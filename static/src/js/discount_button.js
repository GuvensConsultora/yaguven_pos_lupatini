import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { PosStore } from "@point_of_sale/app/services/pos_store";

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
patch(PosStore.prototype, {
    async setDiscountFromUI(line, val) {
        const lista = line.order_id?.pricelist_id;
        const esGerente = this.getCashier()?._role === "manager";
        const pedido = parseFloat(val);
        if (lista?.yg_tope_descuento && !esGerente && !isNaN(pedido)) {
            const max = lista.yg_descuento_max || 0;
            if (pedido > max) {
                this.notification.add(
                    _t("La lista %s admite hasta %s %% de descuento.", lista.display_name, max),
                    { type: "warning" }
                );
                return await super.setDiscountFromUI(line, max);
            }
        }
        return await super.setDiscountFromUI(line, val);
    },
});
