"""Recuperation des donnees depuis les microservices produit et commande."""
from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass

import httpx

from . import demo_data
from .config import Settings, settings
from .discovery import resolve_service_url

log = logging.getLogger("recommandation.data")


@dataclass
class Dataset:
    products: list[dict]
    order_lines: list[dict]
    source: str  # "live" ou "demo"


class DataProvider:
    """Charge et met en cache (TTL) les produits et lignes de commande."""

    def __init__(self, cfg: Settings = settings):
        self.cfg = cfg
        self._lock = threading.Lock()
        self._cached: Dataset | None = None
        self._loaded_at = 0.0
        self.version = 0  # incremente a chaque rechargement (invalide le modele)

    def _fetch_live(self) -> Dataset:
        # Adresses résolues via Eureka (URL de config = plan B si Eureka est éteint)
        produit_base = resolve_service_url("produit", self.cfg.produit_url)
        commande_base = resolve_service_url("commande", self.cfg.commande_url)

        with httpx.Client(timeout=self.cfg.http_timeout) as client:
            products = client.get(f"{produit_base}/api/products")
            products.raise_for_status()
            try:
                lines = client.get(f"{commande_base}/api/order-lines")
                lines.raise_for_status()
                order_lines = lines.json()
            except httpx.HTTPError as exc:  # catalogue seul : mode "cold start"
                log.warning("Service commande indisponible (%s) : recommandations sans historique", exc)
                order_lines = []
        return Dataset(products.json(), order_lines, "live")

    def _load(self) -> Dataset:
        mode = self.cfg.data_source
        if mode == "demo":
            return Dataset(demo_data.PRODUCTS, demo_data.ORDER_LINES, "demo")
        try:
            return self._fetch_live()
        except (httpx.HTTPError, ValueError) as exc:
            if mode == "live":
                raise
            log.warning("Microservice produit indisponible (%s) : utilisation des donnees de demo", exc)
            return Dataset(demo_data.PRODUCTS, demo_data.ORDER_LINES, "demo")

    def get(self, force: bool = False) -> Dataset:
        with self._lock:
            expired = time.time() - self._loaded_at > self.cfg.cache_ttl_seconds
            if force or self._cached is None or expired:
                self._cached = self._load()
                self._loaded_at = time.time()
                self.version += 1
            return self._cached