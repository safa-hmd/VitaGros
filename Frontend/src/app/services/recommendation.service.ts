import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecommendationFilters, RecommendationResponse } from '../models/recommendation.model';

// Microservice IA de recommandation (Python / FastAPI)
const BASE = 'http://localhost:5000/api/recommendations';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  constructor(private http: HttpClient) {}

  /** Best-sellers */
  popular(f: RecommendationFilters = {}): Observable<RecommendationResponse> {
    return this.get('popular', f, ['limit', 'category_id', 'min_price', 'max_price', 'in_stock_only']);
  }

  /** Produits similaires à un produit */
  similar(productId: number, f: RecommendationFilters = {}): Observable<RecommendationResponse> {
    return this.get(`similar/${productId}`, f, ['limit', 'category_id', 'min_price', 'max_price', 'in_stock_only', 'weights']);
  }

  /** Recommandations personnalisées (historique d'achats) */
  forUser(userId: number, f: RecommendationFilters = {}): Observable<RecommendationResponse> {
    return this.get(`user/${userId}`, f, ['limit', 'category_id', 'min_price', 'max_price', 'in_stock_only', 'weights']);
  }

  /** Meilleurs produits d'une catégorie */
  byCategory(categoryId: number, f: RecommendationFilters = {}): Observable<RecommendationResponse> {
    return this.get(`category/${categoryId}`, f, ['limit', 'user_id', 'min_price', 'max_price', 'in_stock_only']);
  }

  /** Meilleurs produits dans une fourchette de prix */
  budget(f: RecommendationFilters): Observable<RecommendationResponse> {
    return this.get('budget', f, ['limit', 'category_id', 'user_id', 'min_price', 'max_price', 'in_stock_only']);
  }

  /** Suggestions complémentaires à un panier */
  forCart(productIds: number[], f: RecommendationFilters = {}): Observable<RecommendationResponse> {
    return this.http.post<RecommendationResponse>(`${BASE}/cart`, {
      product_ids: productIds,
      user_id: f.user_id ?? null,
      limit: f.limit ?? 6,
      category_id: f.category_id ?? null,
      min_price: f.min_price ?? null,
      max_price: f.max_price ?? null,
      in_stock_only: f.in_stock_only ?? true
    });
  }

  /** Multi-critères : combine tous les signaux */
  hybrid(f: RecommendationFilters = {}): Observable<RecommendationResponse> {
    return this.get('hybrid', f, ['limit', 'user_id', 'product_id', 'category_id', 'min_price', 'max_price', 'in_stock_only', 'weights']);
  }

  private get(path: string, f: RecommendationFilters, keys: (keyof RecommendationFilters)[]): Observable<RecommendationResponse> {
    let params = new HttpParams();
    for (const k of keys) {
      const v = f[k];
      if (v !== null && v !== undefined && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<RecommendationResponse>(`${BASE}/${path}`, { params });
  }
}
