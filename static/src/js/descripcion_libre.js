import { ControlButtons } from "@point_of_sale/app/screens/product_screen/control_buttons/control_buttons";
import { PosOrderline } from "@point_of_sale/app/models/pos_order_line";
import { constructFullProductName } from "@point_of_sale/utils";
import { TextInputPopup } from "@point_of_sale/app/components/popups/text_input_popup/text_input_popup";
import { makeAwaitable } from "@point_of_sale/app/utils/make_awaitable_dialog";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";

/**
 * «Descripción» del renglón, sólo en los productos con «Precio libre en caja» (pedido de Anael,
 * 20/11 y 24/11: envases vacíos y «zz VARIOS»; en el envase va el color que se preparó).
 *
 * En 20 la factura toma el nombre del renglón tal como lo manda la caja
 * (`pos.order._prepare_invoice_line`: `name = full_product_name`), y el ticket usa el mismo campo
 * (`getFullProductName`). Se cambia sólo ese texto; el producto sigue siendo el mismo. Vacío vuelve
 * al nombre original del producto.
 */
patch(ControlButtons.prototype, {
    get yg_puedeCambiarDescripcion() {
        const linea = this.currentOrder?.getSelectedOrderline();
        return Boolean(linea?.product_id?.product_tmpl_id?.yg_precio_libre_pos);
    },

    async onClickDescripcionLibre() {
        const linea = this.currentOrder?.getSelectedOrderline();
        if (!linea?.product_id?.product_tmpl_id?.yg_precio_libre_pos) {
            this.notification.add(
                _t("Sólo los productos de precio libre (envases, zz VARIOS) admiten otra descripción."),
                { type: "warning" }
            );
            return;
        }
        const texto = await makeAwaitable(this.dialog, TextInputPopup, {
            title: _t("Descripción del renglón"),
            startingValue: linea.getFullProductName(),
            placeholder: _t("Ej.: PRATA SIRIOS X600CC"),
            rows: 1,
            removeNewLines: true,
        });
        if (texto === undefined || texto === null) {
            return;
        }
        const limpio = String(texto).trim();
        if (limpio) {
            linea.full_product_name = limpio;
        } else {
            linea.setFullProductName();
        }
    },
});

/** En el renglón de la caja (y el ticket) se ve el texto cambiado; el core muestra `product_id.name`. */
patch(PosOrderline.prototype, {
    get orderDisplayProductName() {
        const res = super.orderDisplayProductName;
        if (
            this.product_id?.product_tmpl_id?.yg_precio_libre_pos &&
            this.full_product_name &&
            this.full_product_name !== constructFullProductName(this)
        ) {
            return { ...res, name: this.full_product_name, attributeString: "" };
        }
        return res;
    },
});
