/** @odoo-module **/
import { Component, useState } from "@odoo/owl";
import { usePos } from "@point_of_sale/app/hooks/pos_hook";

export class LupatiniCategoryTree extends Component {
    static template = "yaguven_pos_lupatini.CategoryTree";
    static props = { onClose: Function };

    setup() {
        this.pos = usePos();
        this.state = useState({ expanded: {} });
    }

    _rel(val) {
        return val && val.id !== undefined ? val.id : val;
    }

    get roots() {
        const cats = this.pos.models["pos.category"].getAll();
        const childrenOf = {};
        for (const c of cats) {
            const pid = c.parent_id ? this._rel(c.parent_id) : null;
            (childrenOf[pid] = childrenOf[pid] || []).push(c);
        }
        const sortFn = (a, b) => (a.sequence - b.sequence) || (a.id - b.id);
        const build = (cat, depth) => {
            const children = (childrenOf[cat.id] || [])
                .sort(sortFn)
                .map((c) => build(c, depth + 1));
            return { id: cat.id, name: cat.name, depth, children };
        };
        return (childrenOf[null] || []).sort(sortFn).map((c) => build(c, 0));
    }

    get selectedCategoryId() {
        return this.pos.selectedCategory?.id ?? null;
    }

    isExpanded(node) {
        return this.state.expanded[node.depth] === node.id;
    }

    toggleExpand(node) {
        const cur = { ...this.state.expanded };
        if (cur[node.depth] === node.id) {
            for (const d of Object.keys(cur)) {
                if (Number(d) >= node.depth) delete cur[d];
            }
        } else {
            for (const d of Object.keys(cur)) {
                if (Number(d) > node.depth) delete cur[d];
            }
            cur[node.depth] = node.id;
        }
        this.state.expanded = cur;
    }

    selectCategory(node) {
        this.pos.setSelectedCategory(node.id);
        this.props.onClose();
    }

    clearCategory() {
        this.pos.selectedCategory = null;
        this.props.onClose();
    }
}
