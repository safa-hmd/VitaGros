import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { RecommendationService } from '../../services/recommendation.service';
import { Category, Product } from '../../models/product.model';
import {
  Criterion, RecommendationFilters, RecommendationItem, RecommendationResponse, Strategy
} from '../../models/recommendation.model';

interface StrategyOption { value: Strategy; label: string; hint: string; }

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, CurrencyPipe, DecimalPipe, KeyValuePipe],
  templateUrl: './recommendations.component.html'
})
export class RecommendationsComponent implements OnInit {
  readonly strategies: StrategyOption[] = [
    { value: 'hybrid',   label: '🎯 Multi-critères',   hint: 'Combine tous les critères disponibles' },
    { value: 'user',     label: '👤 Pour moi',         hint: "D'après votre historique d'achats" },
    { value: 'similar',  label: '🔗 Produits similaires', hint: 'Proches du produit choisi' },
    { value: 'popular',  label: '🔥 Best-sellers',     hint: 'Les plus vendus' },
    { value: 'category', label: '🏷️ Par catégorie',    hint: "Meilleurs produits d'une catégorie" },
    { value: 'budget',   label: '💶 Par budget',       hint: 'Dans votre fourchette de prix' },
    { value: 'cart',     label: '🛒 Pour mon panier',  hint: 'Complète les produits du panier' }
  ];

  readonly criteriaLabels: Record<Criterion, string> = {
    content: 'Contenu', collab: 'Acheté avec', popularity: 'Popularité',
    affinity: 'Catégorie', price: 'Prix', availability: 'Stock'
  };
  readonly criteriaKeys = Object.keys(this.criteriaLabels) as Criterion[];

  strategy: Strategy = 'hybrid';
  userId: number | null = null;
  productId: number | null = null;
  categoryId: number | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  inStockOnly = true;
  limit = 8;
  customWeights = false;
  weights: Record<Criterion, number> = {
    content: 25, collab: 25, popularity: 15, affinity: 15, price: 10, availability: 10
  };

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  result = signal<RecommendationResponse | null>(null);
  loading = signal(false);
  error = signal('');
  added = signal<number | null>(null);

  constructor(
    private reco: RecommendationService,
    private productService: ProductService,
    private cart: CartService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.userId = this.auth.currentUser()?.id ?? null;
    this.productService.getAllProducts().subscribe({ next: p => this.products.set(p) });
    this.productService.getAllCategories().subscribe({ next: c => this.categories.set(c) });
    this.run();
  }

  get hint(): string {
    return this.strategies.find(s => s.value === this.strategy)?.hint ?? '';
  }

  private weightsParam(): string | null {
    if (!this.customWeights) return null;
    return this.criteriaKeys.map(k => `${k}:${(this.weights[k] || 0) / 100}`).join(',');
  }

  run() {
    this.error.set('');
    const f: RecommendationFilters = {
      limit: this.limit,
      category_id: this.categoryId,
      min_price: this.minPrice,
      max_price: this.maxPrice,
      in_stock_only: this.inStockOnly,
      user_id: this.userId,
      weights: this.weightsParam()
    };

    let req;
    switch (this.strategy) {
      case 'popular':
        req = this.reco.popular(f); break;
      case 'similar':
        if (!this.productId) return this.error.set('Choisissez un produit de référence.');
        req = this.reco.similar(this.productId, f); break;
      case 'user':
        if (!this.userId) return this.error.set('Connectez-vous pour obtenir des recommandations personnalisées.');
        req = this.reco.forUser(this.userId, f); break;
      case 'category':
        if (!this.categoryId) return this.error.set('Choisissez une catégorie.');
        req = this.reco.byCategory(this.categoryId, f); break;
      case 'budget':
        if (this.minPrice == null && this.maxPrice == null) return this.error.set('Indiquez un prix minimum et/ou maximum.');
        req = this.reco.budget(f); break;
      case 'cart': {
        const ids = this.cart.items().map(i => i.product.id!).filter(id => id != null);
        if (!ids.length) return this.error.set('Votre panier est vide.');
        req = this.reco.forCart(ids, f); break;
      }
      default:
        req = this.reco.hybrid({ ...f, product_id: this.productId });
    }

    this.loading.set(true);
    req.subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: e => {
        this.loading.set(false);
        this.result.set(null);
        this.error.set(e.status === 0
          ? 'Microservice recommandation indisponible (port 5000)'
          : e.error?.detail?.toString() || 'Erreur');
      }
    });
  }

  addToCart(item: RecommendationItem) {
    const product = this.products().find(p => p.id === item.product_id);
    if (!product) return;
    this.cart.addToCart(product);
    this.added.set(item.product_id);
    setTimeout(() => this.added.set(null), 1500);
  }

  pct(v: number | undefined): number {
    return Math.round((v ?? 0) * 100);
  }

  label(k: string): string {
    return this.criteriaLabels[k as Criterion] ?? k;
  }

  resetFilters() {
    this.categoryId = this.minPrice = this.maxPrice = null;
    this.inStockOnly = true;
    this.customWeights = false;
  }
}
