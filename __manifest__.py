{
    "name": "Yagüven — POS Lupatini Display",
    "version": "19.0.1.2.0",
    "category": "Point of Sale",
    "summary": "Toggle tarjeta/lista compacto; precio y stock visibles en cada tarjeta.",
    "author": "Yagüven C.G.",
    "website": "https://yaguven.com",
    "license": "LGPL-3",
    "depends": ["point_of_sale"],
    "assets": {
        "point_of_sale._assets_pos": [
            "yaguven_pos_lupatini/static/src/css/pos_lupatini.css",
            "yaguven_pos_lupatini/static/src/js/product_view_toggle.js",
            "yaguven_pos_lupatini/static/src/js/product_card_list.js",
            "yaguven_pos_lupatini/static/src/xml/product_view_toggle.xml",
            "yaguven_pos_lupatini/static/src/xml/product_card_list.xml",
        ],
    },
    "installable": True,
    "application": False,
}
