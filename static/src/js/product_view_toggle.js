/**
 * Toggle vista tarjeta/lista en el POS + tamaño ajustable de tarjetas.
 * Parcheado sobre ProductScreen (en O19 la grilla está directamente ahí,
 * no en un ProductList separado como en versiones anteriores).
 * Estado persistido en localStorage.
 */
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { patch } from "@web/core/utils/patch";
import { useState, useEffect } from "@odoo/owl";

const SIZES = [130, 160, 200, 260, 320];
const LS_KEY = "lupatini_pos_view";

patch(ProductScreen.prototype, {
    setup() {
        super.setup();
        console.log("[lupatini] ProductScreen patch activo");
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
        this.lupatiniView = useState({
            mode: saved.mode || "card",
            sizeIdx: saved.sizeIdx ?? 2,
        });
        useEffect(
            () => {
                document.documentElement.style.setProperty(
                    "--lupatini-card-w",
                    SIZES[this.lupatiniView.sizeIdx] + "px"
                );
                document.documentElement.classList.toggle(
                    "lupatini-list-mode",
                    this.lupatiniView.mode === "list"
                );
                return () => {
                    document.documentElement.classList.remove("lupatini-list-mode");
                };
            },
            () => [this.lupatiniView.mode, this.lupatiniView.sizeIdx]
        );
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
