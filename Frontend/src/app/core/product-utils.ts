import { Product } from '../models/product.model';
import { RecommendationItem } from '../models/recommendation.model';

/** Convertit une recommandation IA en produit (utilisable par le panier). */
export function productFromRecommendation(item: RecommendationItem, catalog: Product[]): Product {
  const found = catalog.find(p => p.id === item.product_id);
  if (found) return found;
  return {
    id: item.product_id,
    name: item.name ?? `Produit #${item.product_id}`,
    price: item.price,
    stock: item.stock,
    category: { id: item.category_id ?? undefined, name: item.category_name ?? '', description: '' }
  };
}
