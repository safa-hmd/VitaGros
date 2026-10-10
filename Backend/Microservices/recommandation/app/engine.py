"""Moteur de recommandation hybride multi-criteres.

Criteres (chacun note entre 0 et 1) :
  content      similarite de contenu (TF-IDF nom + categorie) avec les produits de reference
  collab       filtrage collaboratif item-item ("achete avec") a partir des lignes de commande
  popularity   popularite (quantites vendues, echelle log)
  affinity     affinite avec les categories de reference / favorites de l'utilisateur
  price        proximite de prix avec les produits de reference (ou le budget demande)
  availability disponibilite en stock

Les poids sont renormalises sur les criteres "actifs" : sans produit de reference ni
historique (cold start), seuls popularity et availability contribuent.
"""
from __future__ import annotations

import math
import unicodedata
from collections import defaultdict
from dataclasses import dataclass, field

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

CRITERIA = ("content", "collab", "popularity", "affinity", "price", "availability")

PRESETS: dict[str, dict[str, float]] = {
    "hybrid": {"content": 0.25, "collab": 0.25, "popularity": 0.15, "affinity": 0.15, "price": 0.10, "availability": 0.10},
    "similar": {"content": 0.55, "collab": 0.20, "price": 0.10, "affinity": 0.05, "popularity": 0.05, "availability": 0.05},
    "user": {"affinity": 0.25, "collab": 0.30, "content": 0.15, "popularity": 0.15, "price": 0.10, "availability": 0.05},
    "popular": {"popularity": 0.85, "availability": 0.15},
    "category": {"popularity": 0.70, "price": 0.10, "availability": 0.20},
    "budget": {"popularity": 0.50, "price": 0.30, "availability": 0.20},
    "cart": {"collab": 0.45, "content": 0.25, "affinity": 0.10, "price": 0.05, "popularity": 0.10, "availability": 0.05},
}

REASONS = {
    "content": "Produit proche de vos centres d'intérêt",
    "collab": "Souvent acheté avec des produits similaires",
    "popularity": "Best-seller",
    "affinity": "Dans une catégorie qui vous correspond",
    "price": "Prix cohérent avec vos achats",
    "availability": "Disponible en stock",
}


def _strip_accents(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn")


def _minmax(v: np.ndarray) -> np.ndarray:
    if v.size == 0:
        return v
    hi = float(v.max())
    return v / hi if hi > 0 else np.zeros_like(v, dtype=float)


@dataclass
class Filters:
    category_id: int | None = None
    min_price: float | None = None
    max_price: float | None = None
    in_stock_only: bool = False


@dataclass
class Context:
    """Ce sur quoi on s'appuie pour recommander."""
    seed_weights: dict[int, float] = field(default_factory=dict)  # product_id -> poids
    exclude: set[int] = field(default_factory=set)
    budget: tuple[float | None, float | None] | None = None

    @property
    def has_seeds(self) -> bool:
        return bool(self.seed_weights)


class Recommender:
    def __init__(self, products: list[dict], order_lines: list[dict], ignored_statuses: tuple[str, ...] = ()):
        self.products = [p for p in products if p.get("id") is not None]
        self.ids = [int(p["id"]) for p in self.products]
        self.idx = {pid: i for i, pid in enumerate(self.ids)}
        n = len(self.ids)

        self.price = np.array([float(p.get("price") or 0) for p in self.products])
        self.stock = np.array([int(p.get("stock") or 0) for p in self.products])
        self.cat_id = [((p.get("category") or {}).get("id")) for p in self.products]
        self.cat_name = [((p.get("category") or {}).get("name")) for p in self.products]

        self._build_content(n)
        self._build_interactions(order_lines, ignored_statuses, n)

    # ------------------------------------------------------------------ build
    def _build_content(self, n: int) -> None:
        docs = []
        for p in self.products:
            cat = p.get("category") or {}
            text = f"{p.get('name', '')} {cat.get('name', '')} {cat.get('name', '')} {cat.get('description', '')}"
            docs.append(_strip_accents(text.lower()))
        if n == 0 or not any(d.strip() for d in docs):
            self.content_sim = np.zeros((n, n))
            return
        tfidf = TfidfVectorizer(token_pattern=r"(?u)\b[a-z0-9]{2,}\b").fit_transform(docs)
        self.content_sim = cosine_similarity(tfidf)

    def _build_interactions(self, lines: list[dict], ignored: tuple[str, ...], n: int) -> None:
        ignored_up = {s.upper() for s in ignored}
        user_items: dict[int, dict[int, float]] = defaultdict(lambda: defaultdict(float))
        sold = np.zeros(n)
        for ln in lines:
            order = ln.get("customerOrder") or {}
            if str(order.get("status", "")).upper() in ignored_up:
                continue
            pid = ln.get("productId")
            if pid not in self.idx:
                continue
            qty = float(ln.get("quantity") or 1)
            sold[self.idx[pid]] += qty
            uid = order.get("userId")
            if uid is not None:
                user_items[int(uid)][int(pid)] += qty
        self.user_items = {u: dict(items) for u, items in user_items.items()}
        self.popularity = _minmax(np.log1p(sold))

        # matrice utilisateur x produit (log-quantite) -> similarite item-item
        users = list(self.user_items)
        if users and n:
            m = np.zeros((len(users), n))
            for r, u in enumerate(users):
                for pid, q in self.user_items[u].items():
                    m[r, self.idx[pid]] = math.log1p(q)
            sim = cosine_similarity(m.T) if m.any() else np.zeros((n, n))
            np.fill_diagonal(sim, 0.0)
            self.collab_sim = np.nan_to_num(sim)
        else:
            self.collab_sim = np.zeros((n, n))

    # ---------------------------------------------------------------- context
    def user_history(self, user_id: int) -> dict[int, float]:
        return self.user_items.get(int(user_id), {})

    def has_product(self, product_id: int) -> bool:
        return product_id in self.idx

    def context_for(self, user_id: int | None, product_ids: list[int] | None, exclude_purchased: bool = True) -> Context:
        ctx = Context()
        history = self.user_history(user_id) if user_id is not None else {}
        if history:
            top = max(history.values())
            for pid, q in history.items():
                ctx.seed_weights[pid] = q / top  # historique : poids relatif <= 1
            if exclude_purchased:
                ctx.exclude |= set(history)
        for pid in product_ids or []:
            if pid in self.idx:
                ctx.seed_weights[pid] = 2.0  # produit explicitement cible : poids fort
                ctx.exclude.add(pid)
        return ctx

    # ---------------------------------------------------------------- scoring
    def _criteria_scores(self, ctx: Context) -> dict[str, np.ndarray]:
        n = len(self.ids)
        zeros = np.zeros(n)
        scores = {
            "popularity": self.popularity,
            "availability": np.where(self.stock <= 0, 0.0, np.where(self.stock < 10, 0.6, 1.0)),
            "content": zeros, "collab": zeros, "affinity": zeros, "price": zeros,
        }
        if ctx.has_seeds:
            seeds = [(self.idx[p], w) for p, w in ctx.seed_weights.items()]
            total_w = sum(w for _, w in seeds)
            content = sum(w * self.content_sim[i] for i, w in seeds) / total_w
            collab = sum(w * self.collab_sim[i] for i, w in seeds) / total_w
            scores["content"], scores["collab"] = _minmax(content), _minmax(collab)

            share: dict = defaultdict(float)
            for i, w in seeds:
                share[self.cat_id[i]] += w / total_w
            scores["affinity"] = np.array([share.get(c, 0.0) for c in self.cat_id])
            if scores["affinity"].max() > 0:
                scores["affinity"] = scores["affinity"] / scores["affinity"].max()

            ref = sum(w * math.log1p(self.price[i]) for i, w in seeds) / total_w
            scores["price"] = np.exp(-((np.log1p(self.price) - ref) ** 2) / (2 * 0.5**2))
        if ctx.budget is not None:
            lo, hi = ctx.budget
            target = (lo or 0) if hi is None else (hi if lo is None else (lo + hi) / 2)
            scores["price"] = np.exp(-((np.log1p(self.price) - math.log1p(target)) ** 2) / (2 * 0.5**2))
        return scores

    def _mask(self, f: Filters, exclude: set[int]) -> np.ndarray:
        keep = np.ones(len(self.ids), dtype=bool)
        for i, pid in enumerate(self.ids):
            if pid in exclude:
                keep[i] = False
            elif f.category_id is not None and self.cat_id[i] != f.category_id:
                keep[i] = False
            elif f.min_price is not None and self.price[i] < f.min_price:
                keep[i] = False
            elif f.max_price is not None and self.price[i] > f.max_price:
                keep[i] = False
            elif f.in_stock_only and self.stock[i] <= 0:
                keep[i] = False
        return keep

    def rank(self, ctx: Context, weights: dict[str, float], filters: Filters, limit: int = 10) -> tuple[list[dict], dict[str, float]]:
        """Retourne (resultats, poids effectivement utilises apres renormalisation)."""
        if not self.ids:
            return [], {}
        scores = self._criteria_scores(ctx)
        active = {
            c: w for c, w in weights.items()
            if w > 0 and c in CRITERIA
            and (c in ("popularity", "availability") or ctx.has_seeds or (c == "price" and ctx.budget is not None))
        } or {"popularity": 1.0}
        total = sum(active.values())
        norm = {c: w / total for c, w in active.items()}

        final = sum(w * scores[c] for c, w in norm.items())
        keep = self._mask(filters, ctx.exclude)
        order = [i for i in np.argsort(-final, kind="stable") if keep[i]][: max(limit, 0)]

        results = []
        for i in order:
            breakdown = {c: round(float(scores[c][i]), 3) for c in norm}
            contrib = sorted(norm, key=lambda c: norm[c] * scores[c][i], reverse=True)
            reasons = [REASONS[c] for c in contrib if scores[c][i] >= 0.5][:3]
            if self.stock[i] <= 0:
                reasons = [r for r in reasons if r != REASONS["availability"]]
            results.append({
                "product_id": self.ids[i],
                "name": self.products[i].get("name"),
                "price": float(self.price[i]),
                "stock": int(self.stock[i]),
                "category_id": self.cat_id[i],
                "category_name": self.cat_name[i],
                "score": round(float(final[i]), 4),
                "criteria": breakdown,
                "reasons": reasons,
            })
        return results, {c: round(w, 3) for c, w in norm.items()}
