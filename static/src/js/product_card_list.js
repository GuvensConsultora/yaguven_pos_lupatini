/**
 * Agrega precio y cantidad disponible a cada tarjeta de producto.
 *
 * - lupatiniPrice: precio según la lista de precios del PEDIDO en curso, que el POS
 *   ya fija a la lista del cliente cuando se lo selecciona
 *   (pos_order.updatePricelistAndFiscalPosition). Usa product.getPrice(pricelist, 1),
 *   el mismo método nativo que usa el POS al agregar la línea, así la tarjeta y el
 *   ticket muestran el mismo número.
 * - lupatiniQty: stock disponible formateado.
 *
 * Nota O19: la tarjeta recibe un product.template (campo list_price, NO lst_price) y
 * ProductCard no expone `this.pos` por sí solo → lo inyectamos con usePos(). El método
 * de precio nativo es getPrice(pricelist, qty, price_extra, recurring), definido en
 * product_template_accounting; getPrice sin pricelist devuelve list_price (no cero).
 */
import { ProductCard } from "@point_of_sale/app/components/product_card/product_card";
import { usePos } from "@point_of_sale/app/hooks/pos_hook";
import { patch } from "@web/core/utils/patch";

patch(ProductCard.prototype, {
    setup() {
        super.setup(...arguments);
        this.lupatiniPos = usePos();
    },

    get lupatiniPrice() {
        const product = this.props.product;
        if (!product) {
            return "";
        }
        try {
            const order = this.lupatiniPos?.getOrder?.() ?? this.lupatiniPos?.selectedOrder;
            const pricelist = order?.pricelist_id;
            const price =
                typeof product.getPrice === "function"
                    ? product.getPrice(pricelist, 1, 0, false)
                    : (product.list_price ?? product.lst_price ?? 0);
            return this.env.utils.formatCurrency(price);
        } catch {
            return this.env.utils.formatCurrency(product.list_price ?? 0);
        }
    },

    get lupatiniQty() {
        const qty = this.props.product?.qty_available;
        if (qty === undefined || qty === null) {
            return "—";
        }
        try {
            return this.env.utils.formatProductQty(qty, false);
        } catch {
            return String(qty);
        }
    },
});
