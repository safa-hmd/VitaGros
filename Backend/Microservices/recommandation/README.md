# 🤖 Microservice Recommandation (Python / FastAPI)

Service d'IA qui recommande des produits **selon plusieurs critères**. Port **5000**, pas de base de données : il lit les données des microservices `produit` et `commande`.

## Critères

Chaque produit reçoit une note de 0 à 1 par critère, puis un score final (somme pondérée) :

| Critère | Signification | Technique |
|---|---|---|
| `content` | Produit proche (nom, catégorie) des produits de référence | TF-IDF + similarité cosinus |
| `collab` | « Souvent acheté avec… » | Filtrage collaboratif item-item sur les lignes de commande |
| `popularity` | Best-seller | Quantités vendues (échelle log) |
| `affinity` | Catégorie favorite de l'utilisateur / du produit consulté | Part de chaque catégorie dans l'historique |
| `price` | Prix cohérent avec les achats ou le budget demandé | Proximité en échelle log |
| `availability` | Disponible en stock | stock = 0 → 0, stock < 10 → 0.6, sinon 1 |

Les poids sont renormalisés sur les critères utilisables : **sans historique ni produit de référence (cold start)**, seuls `popularity` et `availability` comptent. Chaque résultat renvoie son détail par critère (`criteria`) et des `reasons` lisibles.

## Installation et lancement

```bash
cd Backend/Microservices/recommandation
python -m venv .venv
.venv\Scripts\activate          # Linux/macOS : source .venv/bin/activate
pip install -r requirements.txt
python run.py                   # http://localhost:5000
```

- Swagger : <http://localhost:5000/docs>
- Santé : <http://localhost:5000/health>
- Tests : `pytest`

## Endpoints

| Méthode | URL | Stratégie |
|---|---|---|
| GET | `/api/recommendations/popular` | Best-sellers |
| GET | `/api/recommendations/similar/{productId}` | Produits similaires |
| GET | `/api/recommendations/user/{userId}` | Personnalisé (historique d'achats) |
| GET | `/api/recommendations/category/{categoryId}` | Meilleurs produits d'une catégorie |
| GET | `/api/recommendations/budget?min_price=&max_price=` | Par fourchette de prix |
| POST | `/api/recommendations/cart` | Suggestions pour un panier (`{"product_ids":[1,2]}`) |
| GET | `/api/recommendations/hybrid` | Combine tous les critères |
| GET | `/api/recommendations/criteria` | Critères et poids par défaut |
| POST | `/api/recommendations/refresh` | Recharge les données |

Paramètres communs : `limit`, `category_id`, `min_price`, `max_price`, `in_stock_only` (défaut `true`). `hybrid` accepte aussi `user_id`, `product_id` (répétable), `exclude_purchased` et `weights` pour surcharger les poids :

```
GET /api/recommendations/hybrid?user_id=3&category_id=2&max_price=20&weights=collab:0.5,price:0.2,popularity:0.3
```

Exemple d'item de réponse :

```json
{
  "product_id": 2, "name": "Whey Isolate Vanille 1kg", "price": 39.9, "stock": 25,
  "category_id": 1, "category_name": "Protéines", "score": 0.81,
  "criteria": {"content": 0.9, "collab": 0.7, "price": 0.95, "affinity": 1.0, "popularity": 0.6},
  "reasons": ["Produit proche de vos centres d'intérêt", "Dans une catégorie qui vous correspond"]
}
```

## Configuration (variables d'environnement)

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `5000` | Port d'écoute |
| `PRODUIT_SERVICE_URL` | `http://localhost:8082` | Service produit |
| `COMMANDE_SERVICE_URL` | `http://localhost:8083` | Service commande (⚠️ son `application.properties` indique 8086 : aligner l'un des deux) |
| `DATA_SOURCE` | `auto` | `auto` (services réels, sinon données de démo), `live`, `demo` |
| `CACHE_TTL_SECONDS` | `60` | Durée du cache avant rechargement |
| `CORS_ORIGINS` | `http://localhost:4200` | Origines autorisées |

> En mode `auto`, si `produit` est injoignable, le service répond avec un jeu de démonstration (`"source": "demo"`). Si seul `commande` est injoignable, le catalogue est utilisé sans historique d'achats.

## Structure

```
recommandation
├── app
│   ├── main.py          routes FastAPI, CORS
│   ├── engine.py        moteur de recommandation multi-critères
│   ├── data_client.py   lecture produit/commande + cache
│   ├── demo_data.py     données de démonstration
│   ├── schemas.py       modèles Pydantic
│   └── config.py        configuration
├── tests/               tests pytest
├── requirements.txt
└── run.py
```
