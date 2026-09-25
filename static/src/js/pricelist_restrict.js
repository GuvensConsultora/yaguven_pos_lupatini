import { PosAccessRightPlugin } from "@point_of_sale/app/plugins/access_right_plugin";
import { patch } from "@web/core/utils/patch";

/**
 * Lista de precios sólo para quien puede tocar precios.
 *
 * En 19 se parcheaba ControlButtons con pos.cashierHasPriceControlRights(), que en
 * 20 no existe: el botón ahora se muestra según pos.accessRight.canAccessPricelist
 * (el core devuelve siempre true). Misma regla que en 19: si la caja restringe el
 * control de precios, sólo el gerente ve el botón.
 */
patch(PosAccessRightPlugin.prototype, {
    get canAccessPricelist() {
        const puede = !this.config.restrict_price_control || this.loggedCashier?._role === "manager";
        return puede && super.canAccessPricelist;
    },
});
