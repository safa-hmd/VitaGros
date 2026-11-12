"""Configuration du microservice recommandation.

Ordre de priorite (du plus fort au plus faible) :
  1. variables d'environnement
  2. Config Server (config/recommandation.properties)
  3. valeurs par defaut ci-dessous
"""
import json
import os
import urllib.request
from dataclasses import dataclass, field

CONFIG_SERVER_URL = os.getenv("CONFIG_SERVER_URL", "http://localhost:8888")
APP_NAME = "recommandation"


def _load_remote_config() -> dict:
    """Recupere la config depuis le Config Server. Renvoie {} si indisponible."""
    url = f"{CONFIG_SERVER_URL}/{APP_NAME}/default"
    try:
        with urllib.request.urlopen(url, timeout=3) as response:
            data = json.load(response)
    except Exception as exc:  # serveur eteint, reseau, JSON invalide...
        print(f"[config] Config Server indisponible ({exc}); valeurs par defaut utilisees.")
        return {}

    merged: dict = {}
    # Spring renvoie les sources du plus prioritaire au moins prioritaire :
    # on parcourt a l'envers pour que les plus prioritaires ecrasent les autres.
    for source in reversed(data.get("propertySources", [])):
        merged.update(source.get("source", {}))
    return merged


_remote = _load_remote_config()


def _get(key: str, env_name: str, default: str) -> str:
    value = os.getenv(env_name)
    if value not in (None, ""):
        return value
    value = _remote.get(key)
    if value not in (None, ""):
        return str(value)
    return default


def _split(value: str) -> list[str]:
    return [v.strip() for v in value.split(",") if v.strip()]


@dataclass(frozen=True)
class Settings:
    port: int = int(_get("recommandation.port", "PORT", "5000"))
    host: str = _get("recommandation.host", "HOST", "0.0.0.0")

    # URL des microservices Spring Boot
    produit_url: str = _get("recommandation.produit.url", "PRODUIT_SERVICE_URL", "http://localhost:8082")
    commande_url: str = _get("recommandation.commande.url", "COMMANDE_SERVICE_URL", "http://localhost:8083")

    data_source: str = _get("recommandation.data-source", "DATA_SOURCE", "auto").lower()
    cache_ttl_seconds: int = int(_get("recommandation.cache-ttl-seconds", "CACHE_TTL_SECONDS", "60"))
    http_timeout: float = float(_get("recommandation.http-timeout", "HTTP_TIMEOUT", "3"))
    cors_origins: list[str] = field(
        default_factory=lambda: _split(
            _get(
                "recommandation.cors-origins",
                "CORS_ORIGINS",
                "http://localhost:4200,http://127.0.0.1:4200",
            )
        )
    )

    # statuts de commande ignores pour les statistiques d'achat
    ignored_order_statuses: tuple[str, ...] = ("CANCELLED", "CANCELED", "ANNULEE", "ANNULÉE")

    # Eureka
    eureka_url: str = _get("recommandation.eureka-url", "EUREKA_URL", "http://localhost:8761/eureka/")
    instance_host: str = _get("recommandation.instance-host", "INSTANCE_HOST", "localhost")


settings = Settings()