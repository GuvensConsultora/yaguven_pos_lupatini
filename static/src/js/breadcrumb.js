/** @odoo-module **/
import { Component } from "@odoo/owl";
import { usePos } from "@point_of_sale/app/hooks/pos_hook";

export class LupatiniBreadcrumb extends Component {
    static template = "yaguven_pos_lupatini.Breadcrumb";
    static props = {};

    setup() {
        this.pos = usePos();
    }

    _resolve(rel) {
        if (!rel) return null;
        if (rel.id !== undefined) return rel;
        return this.pos.models["pos.category"].get(rel) || null;
    }

    get trail() {
        let node = this.pos.selectedCategory;
        if (!node || !node.id) return [];
        const chain = [];
        const seen = new Set();
        while (node && node.id && !seen.has(node.id)) {
            seen.add(node.id);
            chain.unshift({ id: node.id, name: node.name });
            node = this._resolve(node.parent_id);
        }
        return chain;
    }

    selectCrumb(catId) {
        this.pos.setSelectedCategory(catId);
    }

    clearCategory() {
        this.pos.selectedCategory = null;
    }
}
