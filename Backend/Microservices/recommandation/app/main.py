"""API FastAPI du microservice de recommandation (port 5000)."""
from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .data_client import DataProvider
from .engine import CRITERIA, PRESETS, Filters, Recommender
from .schemas import CartRequest, RecommendationResponse

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="VitaGros - Service de recommandation IA",
    description="Recommandation hybride multi-critères (contenu, filtrage collaboratif, popularité, "
    "catégorie, prix, stock).",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

provider = DataProvider()
_model: tuple[int, Recommender] | None = None


def get_model() -> tuple[Recommender, str]:
    """Retourne le modele (reconstruit quand les donnees sont rechargees)."""
    global _model
    try:
        data = provider.get()
    except Exception as exc:  # DATA_SOURCE=live et service indisponible
        raise HTTPException(503, f"Microservices produit/commande indisponibles : {exc}") from exc
    if _model is None or _model[0] != provider.version:
        _model = (provider.version, Recommender(data.products, data.order_lines, settings.ignored_order_statuses))
    return _model[1], data.source


def parse_weights(raw: str | None, base: dict[str, float]) -> dict[str, float]:
    """'content:0.4,collab:0.2' -> remplace les poids du preset."""
    if not raw:
        return base
    custom: dict[str, float] = {}
    try:
        for part in raw.split(","):
            key, value = part.split(":")
            key = key.strip()
            if key not in CRITERIA:
                raise ValueError(f"critère inconnu '{key}'")
            custom[key] = max(float(value), 0.0)
    except ValueError as exc:
        raise HTTPException(422, f"weights invalide ({exc}). Format : content:0.4,collab:0.2 ; critères : {', '.join(CRITERIA)}") from exc
    return custom or base


def respond(strategy, model, source, ctx, weights, filters, limit) -> RecommendationResponse:
    items, used = model.rank(ctx, weights, filters, limit)
    return RecommendationResponse(strategy=strategy, source=source, count=len(items), items=items, weights=used)


def need_product(model: Recommender, product_id: int) -> None:
    if not model.has_product(product_id):
        raise HTTPException(404, f"Produit {product_id} introuvable")


# --------------------------------------------------------------------- routes
@app.get("/health", tags=["Système"])
def health():
    try:
        data = provider.get()
        return {"status": "UP", "service": "recommandation", "port": settings.port,
                "source": data.source, "products": len(data.products), "order_lines": len(data.order_lines)}
    except Exception as exc:
        return {"status": "DEGRADED", "service": "recommandation", "error": str(exc)}


@app.get("/api/recommendations/criteria", tags=["Recommandations"])
def criteria():
    """Critères disponibles et poids par défaut de chaque stratégie."""
    return {"criteria": list(CRITERIA), "strategies": PRESETS}


@app.post("/api/recommendations/refresh", tags=["Système"])
def refresh():
    """Force le rechargement des données depuis les microservices."""
    data = provider.get(force=True)
    return {"source": data.source, "products": len(data.products), "order_lines": len(data.order_lines)}


@app.get("/api/recommendations/popular", response_model=RecommendationResponse, tags=["Recommandations"])
def popular(limit: int = Query(8, ge=1, le=50), category_id: int | None = None,
            min_price: float | None = None, max_price: float | None = None,
            in_stock_only: bool = True):
    """Best-sellers (critères : popularité + disponibilité)."""
    model, source = get_model()
    return respond("popular", model, source, model.context_for(None, None), PRESETS["popular"],
                   Filters(category_id, min_price, max_price, in_stock_only), limit)


@app.get("/api/recommendations/similar/{product_id}", response_model=RecommendationResponse, tags=["Recommandations"])
def similar(product_id: int, limit: int = Query(6, ge=1, le=50), category_id: int | None = None,
            min_price: float | None = None, max_price: float | None = None,
            in_stock_only: bool = True, weights: str | None = None):
    """Produits similaires (contenu + 'acheté avec' + prix + catégorie)."""
    model, source = get_model()
    need_product(model, product_id)
    w = parse_weights(weights, PRESETS["similar"])
    return respond("similar", model, source, model.context_for(None, [product_id]), w,
                   Filters(category_id, min_price, max_price, in_stock_only), limit)


@app.get("/api/recommendations/user/{user_id}", response_model=RecommendationResponse, tags=["Recommandations"])
def for_user(user_id: int, limit: int = Query(8, ge=1, le=50), category_id: int | None = None,
             min_price: float | None = None, max_price: float | None = None,
             in_stock_only: bool = True, exclude_purchased: bool = True, weights: str | None = None):
    """Recommandations personnalisées d'après l'historique d'achats (cold start → best-sellers)."""
    model, source = get_model()
    w = parse_weights(weights, PRESETS["user"])
    return respond("user", model, source, model.context_for(user_id, None, exclude_purchased), w,
                   Filters(category_id, min_price, max_price, in_stock_only), limit)


@app.get("/api/recommendations/category/{category_id}", response_model=RecommendationResponse, tags=["Recommandations"])
def by_category(category_id: int, limit: int = Query(8, ge=1, le=50), user_id: int | None = None,
                min_price: float | None = None, max_price: float | None = None, in_stock_only: bool = True):
    """Meilleurs produits d'une catégorie (personnalisés si user_id fourni)."""
    model, source = get_model()
    if category_id not in model.cat_id:
        raise HTTPException(404, f"Catégorie {category_id} introuvable")
    ctx = model.context_for(user_id, None, exclude_purchased=False) if user_id is not None else model.context_for(None, None)
    w = PRESETS["user"] if ctx.has_seeds else PRESETS["category"]
    return respond("category", model, source, ctx, w, Filters(category_id, min_price, max_price, in_stock_only), limit)


@app.get("/api/recommendations/budget", response_model=RecommendationResponse, tags=["Recommandations"])
def budget(min_price: float | None = Query(None, ge=0), max_price: float | None = Query(None, ge=0),
           limit: int = Query(8, ge=1, le=50), category_id: int | None = None, user_id: int | None = None,
           in_stock_only: bool = True):
    """Meilleurs produits dans une fourchette de prix."""
    if min_price is None and max_price is None:
        raise HTTPException(422, "Fournir min_price et/ou max_price")
    model, source = get_model()
    ctx = model.context_for(user_id, None) if user_id is not None else model.context_for(None, None)
    ctx.budget = (min_price, max_price)
    w = {**PRESETS["budget"], "collab": 0.15, "affinity": 0.10} if ctx.has_seeds else PRESETS["budget"]
    return respond("budget", model, source, ctx, w, Filters(category_id, min_price, max_price, in_stock_only), limit)


@app.post("/api/recommendations/cart", response_model=RecommendationResponse, tags=["Recommandations"])
def for_cart(body: CartRequest):
    """Suggestions complémentaires à un panier (produits fréquemment achetés ensemble)."""
    model, source = get_model()
    for pid in body.product_ids:
        need_product(model, pid)
    return respond("cart", model, source, model.context_for(body.user_id, body.product_ids), PRESETS["cart"],
                   Filters(body.category_id, body.min_price, body.max_price, body.in_stock_only), body.limit)


@app.get("/api/recommendations/hybrid", response_model=RecommendationResponse, tags=["Recommandations"])
def hybrid(user_id: int | None = None,
           product_id: list[int] | None = Query(None, description="Un ou plusieurs produits de référence"),
           category_id: int | None = None, min_price: float | None = None, max_price: float | None = None,
           in_stock_only: bool = True, exclude_purchased: bool = True,
           limit: int = Query(8, ge=1, le=50),
           weights: str | None = Query(None, description="ex: content:0.4,collab:0.3,popularity:0.1")):
    """Recommandation multi-critères combinant tous les signaux disponibles."""
    model, source = get_model()
    for pid in product_id or []:
        need_product(model, pid)
    ctx = model.context_for(user_id, product_id, exclude_purchased)
    if min_price is not None or max_price is not None:
        ctx.budget = (min_price, max_price)
    return respond("hybrid", model, source, ctx, parse_weights(weights, PRESETS["hybrid"]),
                   Filters(category_id, min_price, max_price, in_stock_only), limit)
