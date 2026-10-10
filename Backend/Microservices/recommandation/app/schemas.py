from pydantic import BaseModel, Field


class RecommendationItem(BaseModel):
    product_id: int
    name: str | None = None
    price: float
    stock: int
    category_id: int | None = None
    category_name: str | None = None
    score: float = Field(description="Score final 0..1")
    criteria: dict[str, float] = Field(description="Score par critere (0..1)")
    reasons: list[str] = Field(default_factory=list, description="Explication lisible")


class RecommendationResponse(BaseModel):
    strategy: str
    source: str = Field(description="live = donnees des microservices, demo = jeu de demonstration")
    weights: dict[str, float] = Field(description="Poids effectivement utilises (renormalises)")
    count: int
    items: list[RecommendationItem]


class CartRequest(BaseModel):
    product_ids: list[int] = Field(min_length=1)
    user_id: int | None = None
    limit: int = Field(default=6, ge=1, le=50)
    category_id: int | None = None
    min_price: float | None = None
    max_price: float | None = None
    in_stock_only: bool = True
