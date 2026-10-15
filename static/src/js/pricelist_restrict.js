import { PosAccessRightPlugin } from "@point_of_sale/app/plugins/access_right_plugin";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { OrderSummary } from "@point_of_sale/app/screens/product_screen/order_summary/order_summary";
import { patch } from "@web/core/utils/patch";

/**
 * ¿Se puede cambiar el precio de esta línea? Con la caja restringida, sólo el gerente,
 * salvo que el producto tenga «Precio libre en caja» (pedido de Lucas, 15/10: los colores
 * de auto se venden con un envase de precio 0 y el precio lo da el programa de color).
 */
function puedeCambiarPrecio(pos, linea) {
    // Ojo: `disablePriceButton` devuelve «PUEDE cambiar el precio» (ver el patch de abajo).
    if (pos.accessRight.disablePriceButton) {
        return true;
    }
    return Boolean(linea?.product_id?.product_tmpl_id?.yg_precio_libre_pos);
}

patch(ProductScreen.prototype, {
    /** El botón «Precio» se habilita también si la línea elegida es de un producto libre. */
    getNumpadButtons() {
        const linea = this.currentOrder?.getSelectedOrderline();
        return super.getNumpadButtons(...arguments).map((boton) =>
            boton.value === "price" && boton.disabled && puedeCambiarPrecio(this.pos, linea)
                ? { ...boton, disabled: false }
                : boton
        );
    },
});

patch(OrderSummary.prototype, {
    /**
     * Traba final: el teclado quedó en modo precio sobre un producto bloqueado. Al elegir
     * otra línea el core ya vuelve a «Cantidad» (`selectOrderLine`); esto cubre cualquier
     * otro camino. No se aplica la tecla y se vuelve a «Cantidad».
     */
    async updateSelectedOrderline({ buffer, key }) {
        const linea = this.pos.getOrder()?.getSelectedOrderline();
        if (this.pos.numpadMode === "price" && linea && !puedeCambiarPrecio(this.pos, linea)) {
            this.numberBuffer.reset();
            this.pos.numpadMode = "quantity";
            return;
        }
        return super.updateSelectedOrderline(...arguments);
    },
});

/**
 * Precio y lista de precios sólo para quien puede tocar precios (Lupatini: sólo gerentes).
 *
 * En 19 se parcheaba ControlButtons con pos.cashierHasPriceControlRights(), que en
 * 20 no existe: el botón ahora se muestra según pos.accessRight.canAccessPricelist
 * (el core devuelve siempre true). Misma regla que en 19: si la caja restringe el
 * control de precios, sólo el gerente ve el botón.
 */
patch(PosAccessRightPlugin.prototype, {
    /**
     * Botón «Precio» del teclado: misma regla (con restricción, sólo el gerente).
     *
     * OJO, EL NOMBRE ENGAÑA: el teclado usa `disabled: !disablePriceButton`, o sea que
     * este getter devuelve «PUEDE cambiar el precio». El core de 20 lo calcula como
     * `restrict_price_control || rol !== "manager"`, que es la condición al revés:
     * medido en staging 28/09 — con la restricción prendida el gerente cambió el precio
     * a $123, y sin restricción el gerente no podía y el cajero sí.
     */
    get disablePriceButton() {
        return !this.config.restrict_price_control || this.loggedCashier?._role === "manager";
    },

    get canAccessPricelist() {
        const puede = !this.config.restrict_price_control || this.loggedCashier?._role === "manager";
        return puede && super.canAccessPricelist;
    },
});
