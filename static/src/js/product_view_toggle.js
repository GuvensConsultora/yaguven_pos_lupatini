/**
 * Toggle tarjeta/lista en el POS.
 * - Tarjeta: grid grande (default 200 px).
 * - Lista: grid compacto (default 160 px).
 * Cada modo recuerda su propio tamaño. Estado persistido en localStorage.
 */
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { patch } from "@web/core/utils/patch";
import { useState, useEffect } from "@odoo/owl";

const SIZES = [130, 160, 200, 260, 320];
const LS_KEY = "lupatini_pos_view";

patch(ProductScreen.prototype, {
    setup() {
        super.setup();
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
        this.lupatiniView = useState({
            mode:         saved.mode         || "card",
            cardSizeIdx:  saved.cardSizeIdx  ?? 2,   // 200 px
            listSizeIdx:  saved.listSizeIdx  ?? 1,   // 160 px
        });
        useEffect(
            () => {
                document.documentElement.style.setProperty(
                    "--lupatini-card-w",
                    SIZES[this._lupatiniActiveSizeIdx()] + "px"
                );
                document.documentElement.classList.toggle(
                    "lupatini-list-mode",
                    this.lupatiniView.mode === "list"
                );
                return () => document.documentElement.classList.remove("lupatini-list-mode");
            },
            () => [this.lupatiniView.mode, this.lupatiniView.cardSizeIdx, this.lupatiniView.listSizeIdx]
        );
    },

    _lupatiniActiveSizeIdx() {
        return this.lupatiniIsCard
            ? this.lupatiniView.cardSizeIdx
            : this.lupatiniView.listSizeIdx;
    },

    get lupatiniCardWidth() {
        return SIZES[this._lupatiniActiveSizeIdx()] + "px";
    },

    get lupatiniIsCard() {
        return this.lupatiniView.mode === "card";
    },

    get lupatiniIsMinSize() {
        return this._lupatiniActiveSizeIdx() === 0;
    },

    get lupatiniIsMaxSize() {
        return this._lupatiniActiveSizeIdx() === SIZES.length - 1;
    },

    lupatiniToggleMode() {
        this.lupatiniView.mode = this.lupatiniIsCard ? "list" : "card";
        this._lupatiniSave();
    },

    lupatiniSizeUp() {
        if (!this.lupatiniIsMaxSize) {
            if (this.lupatiniIsCard) this.lupatiniView.cardSizeIdx++;
            else this.lupatiniView.listSizeIdx++;
            this._lupatiniSave();
        }
    },

    lupatiniSizeDown() {
        if (!this.lupatiniIsMinSize) {
            if (this.lupatiniIsCard) this.lupatiniView.cardSizeIdx--;
            else this.lupatiniView.listSizeIdx--;
            this._lupatiniSave();
        }
    },

    _lupatiniSave() {
        localStorage.setItem(LS_KEY, JSON.stringify({
            mode:        this.lupatiniView.mode,
            cardSizeIdx: this.lupatiniView.cardSizeIdx,
            listSizeIdx: this.lupatiniView.listSizeIdx,
        }));
    },
});
