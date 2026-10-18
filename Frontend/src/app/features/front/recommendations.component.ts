import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { RecommendationService } from '../../services/recommendation.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Category, Product } from '../../models/product.model';
import {
  Criterion, RecommendationFilters, RecommendationItem, RecommendationResponse, Strategy
} from '../../models/recommendation.model';
import { productFromRecommendation } from '../../core/product-utils';
import { errorMessage } from '../../core/http-error';

interface StrategyOption { value: Strategy; label: string; hint: string; }

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="page-head">
      <div>
        <h1>🤖 Recommandations IA</h1>
        <p class="muted">Choisissez une stratégie, affinez vos critères, puis ajoutez les suggestions au panier.</p>
      </div>
    </div>

    <div class="split">
      <aside class="card stack">
        <label>Stratégie
          <select name="strategy" [(ngModel)]="strategy" (ngModelChange)="onStrategyChange()">
            @for (s of strategies; track s.value) {
              <option [ngValue]="s.value">{{ s.label }}</option>
            }
          </select>
        </label>
        <p class="muted small">{{ hint }}</p>

        @if (strategy === 'similar') {
          <label>Produit de référence
            <select name="product" [(ngModel)]="productId">
              <option [ngValue]="null">— Choisir —</option>
              @for (p of catalog(); track p.id) {
                <option [ngValue]="p.id">{{ p.name }}</option>
              }
            </select>
          </label>
        }
        @if (strategy === 'category' || strategy === 'hybrid' || strategy === 'popular' || strategy === 'user') {
          <label>Catégorie
            <select name="category" [(ngModel)]="categoryId">
              <option [ngValue]="null">Toutes</option>
              @for (c of categories(); track c.id) {
                <option [ngValue]="c.id">{{ c.name }}</option>
              }
            </select>
          </label>
        }
        <div class="row">
          <label class="grow">Prix min
            <input type="number" min="0" name="min" [(ngModel)]="minPrice">
          </label>
          <label class="grow">Prix max
            <input type="number" min="0" name="max" [(ngModel)]="maxPrice">
          </label>
        </div>
        <label>Nombre de résultats
          <input type="number" min="1" max="50" name="limit" [(ngModel)]="limit">
        </label>
        <label class="check">
          <input type="checkbox" name="stock" [(ngModel)]="inStockOnly"> Uniquement en stock
        </label>
        <button class="btn btn-primary btn-block" (click)="run()" [disabled]="loading()">
          {{ loading() ? 'Calcul…' : 'Obtenir des recommandations' }}
        </button>
      </aside>

      <section>
        @if (error()) {
          <div class="alert error">{{ error() }}</div>
        }
        @if (loading()) {
          <p class="muted">Analyse en cours…</p>
        }
        @if (result(); as r) {
          <div class="result-head">
            <span class="badge info">{{ r.items.length }} résultat(s)</span>
            <span class="badge" [class.ok]="r.source === 'live'" [class.warn]="r.source !== 'live'">
              {{ r.source === 'live' ? 'Données en direct' : 'Données de démonstration' }}
            </span>
          </div>
          @if (r.items.length === 0) {
            <div class="empty card">Aucune suggestion avec ces critères. Élargissez la recherche.</div>
          }
          <div class="reco-list">
            @for (item of r.items; track item.product_id) {
              <div class="card reco-item">
                <div class="reco-main">
                  <div class="product-name">{{ item.name ?? 'Produit #' + item.product_id }}</div>
                  <div class="muted small">{{ item.category_name ?? '—' }} · {{ item.price | number: '1.2-2' }} TND · stock {{ item.stock }}</div>
                  <ul class="reasons">
                    @for (reason of item.reasons; track reason) {
                      <li>✔ {{ reason }}</li>
                    }
                  </ul>
                  <div class="chips">
                    @for (k of criteriaKeys; track k) {
                      @if (item.criteria[k] !== undefined) {
                        <span class="chip">{{ criteriaLabels[k] }} {{ (item.criteria[k] || 0) * 100 | number: '1.0-0' }}%</span>
                      }
                    }
                  </div>
                </div>
                <div class="reco-side">
                  <div class="score">{{ item.score * 100 | number: '1.0-0' }}<small>/100</small></div>
                  <div class="bar"><span [style.width.%]="item.score * 100"></span></div>
                  <button class="btn btn-primary btn-sm" [disabled]="item.stock <= 0" (click)="addItem(item)">
                    {{ item.stock <= 0 ? 'Rupture' : 'Ajouter' }}
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `
})
export class RecommendationsComponent implements OnInit {
  private reco = inject(RecommendationService);
  private productApi = inject(ProductService);
  private cart = inject(CartService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly strategies: StrategyOption[] = [
    { value: 'hybrid', label: '🎯 Multi-critères', hint: 'Combine tous les signaux disponibles.' },
    { value: 'user', label: '👤 Pour moi', hint: "D'après votre historique d'achats (cold start : best-sellers)." },
    { value: 'similar', label: '🔗 Produits similaires', hint: 'Proches d’un produit de référence.' },
    { value: 'popular', label: '🔥 Best-sellers', hint: 'Les produits les plus vendus.' },
    { value: 'category', label: '🏷️ Par catégorie', hint: "Les meilleurs produits d'une catégorie." },
    { value: 'budget', label: '💶 Par budget', hint: 'Dans votre fourchette de prix.' },
    { value: 'cart', label: '🛒 Pour mon panier', hint: 'Compléments aux produits de votre panier.' }
  ];

  readonly criteriaLabels: Record<Criterion, string> = {
    content: 'Contenu', collab: 'Acheté avec', popularity: 'Popularité',
    affinity: 'Catégorie', price: 'Prix', availability: 'Stock'
  };
  readonly criteriaKeys = Object.keys(this.criteriaLabels) as Criterion[];

  strategy: Strategy = 'hybrid';
  productId: number | null = null;
  categoryId: number | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  limit = 8;
  inStockOnly = true;

  readonly catalog = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly result = signal<RecommendationResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  private userId = this.auth.currentUser()?.id ?? null;

  get hint(): string {
    return this.strategies.find(s => s.value === this.strategy)?.hint ?? '';
  }

  ngOnInit(): void {
    this.productApi.getAllProducts().subscribe({ next: p => this.catalog.set(p), error: () => undefined });
    this.productApi.getAllCategories().subscribe({ next: c => this.categories.set(c), error: () => undefined });
    this.run();
  }

  onStrategyChange(): void {
    this.result.set(null);
    this.error.set('');
  }

  run(): void {
    const f: RecommendationFilters = {
      limit: this.limit,
      category_id: this.categoryId,
      min_price: this.minPrice,
      max_price: this.maxPrice,
      in_stock_only: this.inStockOnly,
      user_id: this.userId
    };

    let request: Observable<RecommendationResponse>;
    switch (this.strategy) {
      case 'user':
        request = this.userId ? this.reco.forUser(this.userId, f) : this.reco.popular(f);
        break;
      case 'similar':
        if (!this.productId) return this.fail('Choisissez un produit de référence.');
        request = this.reco.similar(this.productId, f);
        break;
      case 'popular':
        request = this.reco.popular(f);
        break;
      case 'category':
        if (!this.categoryId) return this.fail('Choisissez une catégorie.');
        request = this.reco.byCategory(this.categoryId, f);
        break;
      case 'budget':
        if (this.minPrice === null && this.maxPrice === null) return this.fail('Renseignez un prix minimum et/ou maximum.');
        request = this.reco.budget(f);
        break;
      case 'cart': {
        const ids = this.cart.items().map(i => i.product.id).filter((id): id is number => id !== undefined);
        if (ids.length === 0) return this.fail('Votre panier est vide : ajoutez des produits pour obtenir des compléments.');
        request = this.reco.forCart(ids, f);
        break;
      }
      default:
        request = this.reco.hybrid({ ...f, product_id: this.productId });
    }

    this.loading.set(true);
    this.error.set('');
    request.subscribe({
      next: r => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: e => {
        this.loading.set(false);
        this.result.set(null);
        this.error.set(errorMessage(e, 'Service de recommandation indisponible (port 5000).'));
      }
    });
  }

  addItem(item: RecommendationItem): void {
    const product = productFromRecommendation(item, this.catalog());
    const inCart = this.cart.items().find(i => i.product.id === product.id)?.quantity ?? 0;
    if (inCart >= product.stock) {
      this.toast.show('Stock maximal déjà atteint dans le panier.', 'info');
      return;
    }
    this.cart.addToCart(product, 1);
    this.toast.show(`« ${product.name} » ajouté au panier`);
  }

  private fail(message: string): void {
    this.error.set(message);
    this.result.set(null);
  }
}
