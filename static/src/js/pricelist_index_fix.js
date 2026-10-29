/**
 * Rearma el índice de reglas de las listas de precios después de traer un presupuesto a la caja.
 *
 * Error de Odoo 20 (pos_sale): `load_sale_order_from_pos` vuelve a mandar la lista de precios junto
 * con los productos del presupuesto. Al llegar, la lista se rearma y su `setup()` vacía el índice
 * `rulesByTmplId` / `rulesByProductId`; sólo se vuelven a indexar las reglas que vinieron en esa
 * respuesta (las de los productos del presupuesto y la regla general). Desde ahí, para todos los
 * demás productos la caja no encuentra su regla y aplica la general — en Lupatini, «costo sin
 * recargo» — hasta que se recarga la caja.
 *
 * Medido el 29/10 en lupa7 testing (POS Parque, S00005): índice de 4.859 plantillas → 1, con las
 * 19.410 reglas todavía cargadas; ALBA LUX BLANCO x 1 LT entraba a $10.293,93 en vez de $22.038,29.
 *
 * El arreglo no toca datos: vacía el índice de cada lista y vuelve a indexar sus reglas, que siguen
 * en memoria, con el mismo `addRuleIndex` que usa el core.
 */
import { PosStore } from "@point_of_sale/app/services/pos_store";
import { patch } from "@web/core/utils/patch";

function reindexarListas(pos) {
    for (const lista of pos.models["product.pricelist"].getAll()) {
        lista.rulesByProductId = {};
        lista.rulesByTmplId = {};
        lista.uiState.generalRulesIdsByCateg = {};
        lista.uiState.generalRulesIds = {};
        lista.item_ids.forEach((regla, indice) => lista.addRuleIndex(regla, indice));
    }
}

patch(PosStore.prototype, {
    async _getSaleOrder() {
        const presupuesto = await super._getSaleOrder(...arguments);
        reindexarListas(this);
        return presupuesto;
    },
});
