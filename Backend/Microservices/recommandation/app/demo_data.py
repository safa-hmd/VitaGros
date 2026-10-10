"""Jeu de donnees de demonstration (utilise si les microservices sont indisponibles)."""

CATEGORIES = {
    1: {"id": 1, "name": "Protéines", "description": "Whey, caséine, isolat et protéines végétales"},
    2: {"id": 2, "name": "Vitamines", "description": "Multivitamines, vitamine D, C et minéraux"},
    3: {"id": 3, "name": "Acides aminés", "description": "BCAA, glutamine, créatine et EAA"},
    4: {"id": 4, "name": "Boissons énergétiques", "description": "Boosters, pré-workout et boissons isotoniques"},
    5: {"id": 5, "name": "Accessoires", "description": "Shakers, bandes élastiques et gourdes de sport"},
}

_P = [
    (1, "Whey Protein Chocolat 2kg", 54.9, 40, 1),
    (2, "Whey Isolate Vanille 1kg", 39.9, 25, 1),
    (3, "Caséine Micellaire Chocolat", 44.5, 12, 1),
    (4, "Protéine Végétale Pois-Riz", 36.0, 30, 1),
    (5, "Multivitamines Complete Daily", 18.9, 80, 2),
    (6, "Vitamine D3 2000 UI", 12.5, 100, 2),
    (7, "Vitamine C 1000mg", 14.0, 0, 2),
    (8, "Magnésium Bisglycinate", 16.5, 60, 2),
    (9, "BCAA 2:1:1 Poudre", 24.9, 35, 3),
    (10, "Créatine Monohydrate 500g", 22.0, 70, 3),
    (11, "Glutamine Pure 300g", 27.5, 8, 3),
    (12, "Pré-workout Explosive", 29.9, 20, 4),
    (13, "Boisson Isotonique Citron x12", 19.5, 55, 4),
    (14, "Energy Drink Zéro Sucre x24", 31.0, 45, 4),
    (15, "Shaker Pro 700ml", 7.5, 120, 5),
    (16, "Gourde Sport 1L", 11.0, 90, 5),
    (17, "Bandes Élastiques Set x5", 15.0, 50, 5),
]

PRODUCTS = [
    {"id": i, "name": n, "price": p, "stock": s, "category": CATEGORIES[c]}
    for (i, n, p, s, c) in _P
]

# (user_id, [(product_id, quantite), ...]) -> une commande par entree
_ORDERS = [
    (1, [(1, 1), (10, 1), (15, 1)]),
    (1, [(2, 1), (9, 2)]),
    (2, [(1, 1), (10, 2), (12, 1)]),
    (2, [(15, 1), (13, 3)]),
    (3, [(5, 1), (6, 1), (8, 1)]),
    (3, [(5, 2), (7, 1)]),
    (4, [(4, 1), (5, 1), (6, 1)]),
    (4, [(16, 1), (17, 1)]),
    (5, [(1, 1), (9, 1), (10, 1), (15, 1)]),
    (5, [(14, 2), (12, 1)]),
    (6, [(2, 1), (3, 1), (11, 1)]),
    (6, [(10, 1), (11, 1)]),
    (7, [(13, 2), (14, 1), (16, 1)]),
    (8, [(1, 1), (2, 1), (10, 1)]),
]


def _build_lines():
    lines, line_id = [], 1
    by_id = {p["id"]: p for p in PRODUCTS}
    for order_id, (user_id, items) in enumerate(_ORDERS, start=1):
        order = {"id": order_id, "userId": user_id, "orderDate": "2026-09-01", "status": "DELIVERED"}
        for product_id, qty in items:
            lines.append(
                {
                    "id": line_id,
                    "productId": product_id,
                    "quantity": qty,
                    "unitPrice": by_id[product_id]["price"],
                    "customerOrder": order,
                }
            )
            line_id += 1
    return lines


ORDER_LINES = _build_lines()
