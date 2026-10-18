import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { RecommendationService } from '../../services/recommendation.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Category, Product } from '../../models/product.model';
import { RecommendationItem } from '../../models/recommendation.model';
import { productFromRecommendation } from '../../core/product-utils';
import { errorMessage } from '../../core/http-error';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, DecimalPipe, NgClass, RouterLink],
  template: `
    <section class="hero card">
      <div>
        <h1>Bienvenue{{ firstname ? ', ' + firstname : '' }} 👋</h1>
        <p class="muted">Des produits frais livrés chez vous. Ajoutez vos favoris au panier et commandez en quelques clics.</p>
      </div>
    </section>

    @if (picks().length) {
      <section class="section">
        <div class="section-head">
          <h2>🤖 {{ picksLabel }}</h2>
          <a routerLink="/shop/recommandations" class="small">Voir toutes les recommandations →</a>
        </div>
        <div class="grid">
          @for (item of picks(); track item.product_id) {
            <div class="card product-card">
              <div class="product-emoji">🛍️</div>
              <div class="product-name">{{ item.name ?? 'Produit #' + item.product_id }}</div>
              <div class="muted small">{{ item.reasons[0] || 'Recommandé pour vous' }}</div>
              <div class="price">{{ item.price | number: '1.2-2' }} TND</div>
              <button class="btn btn-primary btn-block" [disabled]="item.stock <= 0" (click)="addPick(item)">
                {{ item.stock <= 0 ? 'Rupture' : 'Ajouter au panier' }}
              </button>
            </div>
          }
        </div>
      </section>
    }

    <section class="section">
      <div class="toolbar">
        <h2 class="grow">Catalogue</h2>
        <input placeholder="Rechercher un produit…" [(ngModel)]="search">
        <select [(ngModel)]="categoryId">
          <option [ngValue]="null">Toutes les catégories</option>
          @for (c of categories(); track c.id) {
            <option [ngValue]="c.id">{{ c.name }}</option>
          }
        </select>
      </div>

      @if (loading()) {
        <p class="muted">Chargement du catalogue…</p>
      } @else if (error()) {
        <div class="alert error">{{ error() }}</div>
      } @else if (filtered.length === 0) {
        <div class="empty card">Aucun produit ne correspond à votre recherche.</div>
      } @else {
        <div class="grid">
          @for (p of filtered; track p.id) {
            <div class="card product-card">
              <div class="product-emoji">📦</div>
              <div class="product-name">{{ p.name }}</div>
              <div class="muted small">{{ p.category?.name || 'Sans catégorie' }}</div>
              <div class="price">{{ p.price | number: '1.2-2' }} TND</div>
              <div class="small" [ngClass]="p.stock > 5 ? 'ok' : p.stock > 0 ? 'warn' : 'bad'">
                {{ p.stock > 0 ? 'En stock : ' + p.stock : 'Rupture de stock' }}
              </div>
              <button class="btn btn-primary btn-block" [disabled]="!canAdd(p)" (click)="add(p)">
                {{ p.stock <= 0 ? 'Indisponible' : !canAdd(p) ? 'Max. dans le panier' : 'Ajouter au panier' }}
              </button>
            </div>
          }
        </div>
      }
    </section>
  `
})
export class HomeComponent implements OnInit {
  private products = inject(ProductService);
  private reco = inject(RecommendationService);
  private cart = inject(CartService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly firstname = this.auth.currentUser()?.firstname ?? '';
  readonly picks = signal<RecommendationItem[]>([]);
  readonly catalog = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  picksLabel = 'Recommandé pour vous';

  search = '';
  categoryId: number | null = null;

  get filtered(): Product[] {
    const q = this.search.trim().toLowerCase();
    return this.catalog().filter(p =>
      (this.categoryId === null || p.category?.id === this.categoryId) &&
      (!q || p.name.toLowerCase().includes(q))
    );
  }

  ngOnInit(): void {
    forkJoin({
      products: this.products.getAllProducts(),
      categories: this.products.getAllCategories()
    }).subscribe({
      next: r => {
        this.catalog.set(r.products);
        this.categories.set(r.categories);
        this.loading.set(false);
      },
      error: e => {
        this.loading.set(false);
        this.error.set(errorMessage(e, 'Impossible de charger le catalogue.'));
      }
    });

    // Recommandations IA : personnalisées si historique, sinon best-sellers (cold start côté serveur)
    const userId = this.auth.currentUser()?.id;
    const request = userId
      ? this.reco.forUser(userId, { limit: 4 })
      : this.reco.popular({ limit: 4 });
    this.picksLabel = userId ? 'Recommandé pour vous' : 'Best-sellers';
    request.pipe(catchError(() => of(null))).subscribe(r => this.picks.set(r?.items ?? []));
  }

  qtyInCart(p: Product): number {
    return this.cart.items().find(i => i.product.id === p.id)?.quantity ?? 0;
  }

  canAdd(p: Product): boolean {
    return p.stock > this.qtyInCart(p);
  }

  add(p: Product): void {
    if (!this.canAdd(p)) return;
    this.cart.addToCart(p, 1);
    this.toast.show(`« ${p.name} » ajouté au panier`);
  }

  addPick(item: RecommendationItem): void {
    this.add(productFromRecommendation(item, this.catalog()));
  }
}
