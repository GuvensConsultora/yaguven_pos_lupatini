{
    "name": "Yagüven — POS Lupatini Display",
    "version": "19.0.1.1.0",
    "category": "Point of Sale",
    "summary": "Toggle tarjeta/lista + tamaño ajustable; nombre completo visible en tarjeta.",
    "author": "Yagüven C.G.",
    "website": "https://yaguven.com",
    "license": "LGPL-3",
    "depends": ["point_of_sale"],
    "assets": {
        "point_of_sale._assets_pos": [
            "yaguven_pos_lupatini/static/src/css/pos_lupatini.css",
            "yaguven_pos_lupatini/static/src/js/product_view_toggle.js",
            "yaguven_pos_lupatini/static/src/xml/product_view_toggle.xml",
        ],
    },
    "installable": True,
    "application": False,
}
