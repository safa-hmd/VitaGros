"""Configuration du microservice (surchargeable par variables d'environnement)."""
import os
from dataclasses import dataclass, field


def _split(value: str) -> list[str]:
    return [v.strip() for v in value.split(",") if v.strip()]


@dataclass(frozen=True)
class Settings:
    port: int = int(os.getenv("PORT", "5000"))
    host: str = os.getenv("HOST", "0.0.0.0")
    # URL des microservices Spring Boot
    produit_url: str = os.getenv("PRODUIT_SERVICE_URL", "http://localhost:8082")
    commande_url: str = os.getenv("COMMANDE_SERVICE_URL", "http://localhost:8083")
    # auto = services reels puis donnees de demo si indisponibles ; live ; demo
    data_source: str = os.getenv("DATA_SOURCE", "auto").lower()
    cache_ttl_seconds: int = int(os.getenv("CACHE_TTL_SECONDS", "60"))
    http_timeout: float = float(os.getenv("HTTP_TIMEOUT", "3"))
    cors_origins: list[str] = field(
        default_factory=lambda: _split(
            os.getenv("CORS_ORIGINS", "http://localhost:4200,http://127.0.0.1:4200")
        )
    )
    # statuts de commande ignores pour les statistiques d'achat
    ignored_order_statuses: tuple[str, ...] = ("CANCELLED", "CANCELED", "ANNULEE", "ANNULÉE")


settings = Settings()
