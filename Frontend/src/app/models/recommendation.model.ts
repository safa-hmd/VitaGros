export type Criterion = 'content' | 'collab' | 'popularity' | 'affinity' | 'price' | 'availability';

export type Strategy = 'hybrid' | 'user' | 'similar' | 'popular' | 'category' | 'budget' | 'cart';

export interface RecommendationItem {
  product_id: number;
  name: string | null;
  price: number;
  stock: number;
  category_id: number | null;
  category_name: string | null;
  score: number;
  criteria: Partial<Record<Criterion, number>>;
  reasons: string[];
}

export interface RecommendationResponse {
  strategy: Strategy;
  source: 'live' | 'demo';
  weights: Partial<Record<Criterion, number>>;
  count: number;
  items: RecommendationItem[];
}

export interface RecommendationFilters {
  limit?: number;
  category_id?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  in_stock_only?: boolean;
  user_id?: number | null;
  product_id?: number | null;
  weights?: string | null;
}
