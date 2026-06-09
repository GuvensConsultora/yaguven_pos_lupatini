/**
 * Agrega precio y cantidad disponible a cada tarjeta de producto.
 * Se muestran en ambos modos (tarjeta y lista compacta).
 * Usa env.utils (ya disponible en ProductCard para formatProductQty).
 */
import { ProductCard } from "@point_of_sale/app/components/product_card/product_card";
import { patch } from "@web/core/utils/patch";

patch(ProductCard.prototype, {
    get lupatiniPrice() {
        const price = this.props.product?.lst_price ?? 0;
        try {
            return this.env.utils.formatCurrency(price);
        } catch {
            return String(price);
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
