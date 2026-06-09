/**
 * Agrega precio (de la lista activa) y cantidad disponible a cada tarjeta.
 * - lupatiniPrice: usa product.getDisplayPrice(pricelist, 1) si hay lista activa;
 *   cae a lst_price si no hay lista o el método no existe en esta versión.
 * - lupatiniQty: stock disponible formateado.
 */
import { ProductCard } from "@point_of_sale/app/components/product_card/product_card";
import { patch } from "@web/core/utils/patch";

patch(ProductCard.prototype, {
    get lupatiniPrice() {
        const product = this.props.product;
        if (!product) return "";
        try {
            const pricelist = this.pos?.selectedOrder?.pricelist_id;
            const price =
                pricelist && typeof product.getDisplayPrice === "function"
                    ? product.getDisplayPrice(pricelist, 1)
                    : (product.lst_price ?? 0);
            return this.env.utils.formatCurrency(price);
        } catch {
            return String(product.lst_price ?? 0);
        }
    },

    get lupatiniQty() {
        const qty = this.props.product?.qty_available;
        if (qty === undefined || qty === null) return "—";
        try {
            return this.env.utils.formatProductQty(qty, false);
        } catch {
            return String(qty);
        }
    },
});
