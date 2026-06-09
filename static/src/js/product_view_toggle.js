/**
 * Toggle vista tarjeta/lista en el POS + tamaño ajustable de tarjetas.
 * Estado persistido en localStorage → sobrevive cierre de sesión POS.
 *
 * Componente parcheado: ProductList
 * Path asumido por convención Odoo 19 — verificar en browser si el patch
 * no surte efecto (podría haber cambiado el nombre entre subversiones).
 */
import { ProductList } from "@point_of_sale/app/screens/product_screen/product_list/product_list";
import { patch } from "@web/core/utils/patch";
import { useState } from "@odoo/owl";

const SIZES = [130, 160, 200, 260, 320];
const LS_KEY = "lupatini_pos_view";

patch(ProductList.prototype, {
    setup() {
        super.setup();
        console.log("[lupatini] ProductList patch activo");
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
        this.lupatiniView = useState({
            mode: saved.mode || "card",
            sizeIdx: saved.sizeIdx ?? 2,   // default: 200px (índice 2)
        });
    },

    get lupatiniCardWidth() {
        return SIZES[this.lupatiniView.sizeIdx] + "px";
    },

    get lupatiniIsCard() {
        return this.lupatiniView.mode === "card";
    },

    get lupatiniIsMinSize() {
        return this.lupatiniView.sizeIdx === 0;
    },

    get lupatiniIsMaxSize() {
        return this.lupatiniView.sizeIdx === SIZES.length - 1;
    },

    lupatiniToggleMode() {
        this.lupatiniView.mode = this.lupatiniIsCard ? "list" : "card";
        this._lupatiniSave();
    },

    lupatiniSizeUp() {
        if (!this.lupatiniIsMaxSize) {
            this.lupatiniView.sizeIdx++;
            this._lupatiniSave();
        }
    },

    lupatiniSizeDown() {
        if (!this.lupatiniIsMinSize) {
            this.lupatiniView.sizeIdx--;
            this._lupatiniSave();
        }
    },

    _lupatiniSave() {
        localStorage.setItem(LS_KEY, JSON.stringify({
            mode: this.lupatiniView.mode,
            sizeIdx: this.lupatiniView.sizeIdx,
        }));
    },
});
