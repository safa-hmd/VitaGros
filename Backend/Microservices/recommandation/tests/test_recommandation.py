import os

os.environ["DATA_SOURCE"] = "demo"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)
BASE = "/api/recommendations"


def ids(resp):
    return [i["product_id"] for i in resp.json()["items"]]


def test_health():
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "UP" and r.json()["source"] == "demo"


def test_popular_in_stock_only():
    r = client.get(f"{BASE}/popular?limit=5")
    assert r.status_code == 200
    assert all(i["stock"] > 0 for i in r.json()["items"])
    assert r.json()["items"][0]["product_id"] in (1, 10)  # produits les plus vendus de la demo


def test_similar_prefers_same_category_and_excludes_self():
    r = client.get(f"{BASE}/similar/1?limit=3")
    got = ids(r)
    assert 1 not in got
    assert r.json()["items"][0]["category_id"] == 1  # une autre proteine en tete


def test_similar_unknown_product_404():
    assert client.get(f"{BASE}/similar/9999").status_code == 404


def test_user_excludes_purchased_and_cold_start():
    r = client.get(f"{BASE}/user/1?limit=20")
    assert not {1, 15, 2, 10, 9} & set(ids(r))  # deja achetes par l'utilisateur 1
    cold = client.get(f"{BASE}/user/424242?limit=3")
    assert cold.status_code == 200 and cold.json()["count"] == 3
    assert set(cold.json()["weights"]) == {"popularity", "availability"}


def test_category_filter():
    r = client.get(f"{BASE}/category/2?limit=10")
    assert r.json()["count"] > 0 and all(i["category_id"] == 2 for i in r.json()["items"])
    assert client.get(f"{BASE}/category/99").status_code == 404


def test_budget():
    r = client.get(f"{BASE}/budget?min_price=10&max_price=20")
    assert r.json()["count"] > 0 and all(10 <= i["price"] <= 20 for i in r.json()["items"])
    assert client.get(f"{BASE}/budget").status_code == 422


def test_cart_suggests_bought_together():
    r = client.post(f"{BASE}/cart", json={"product_ids": [1, 10]})
    assert r.status_code == 200
    assert 15 in ids(r)  # shaker : souvent achete avec whey + creatine
    assert not {1, 10} & set(ids(r))


def test_hybrid_combined_and_custom_weights():
    r = client.get(f"{BASE}/hybrid?user_id=3&category_id=2&max_price=17&weights=popularity:1")
    assert r.status_code == 200
    assert all(i["category_id"] == 2 and i["price"] <= 17 for i in r.json()["items"])
    assert r.json()["weights"] == {"popularity": 1.0}
    assert client.get(f"{BASE}/hybrid?weights=foo:1").status_code == 422


def test_criteria_endpoint():
    assert "content" in client.get(f"{BASE}/criteria").json()["criteria"]
