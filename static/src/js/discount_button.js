import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
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
