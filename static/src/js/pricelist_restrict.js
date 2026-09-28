import { PosAccessRightPlugin } from "@point_of_sale/app/plugins/access_right_plugin";
import { patch } from "@web/core/utils/patch";

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
