import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, from, of, throwError } from 'rxjs';
import { catchError as catchRequestError, concatMap, map, tap, toArray } from 'rxjs/operators';
import { CartItem, CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { CommandeApiService, CommandeOrder, CommandeOrderLine } from '../../services/commande-api.service';
import { RecommendationService } from '../../services/recommendation.service';
import { ToastService } from '../../services/toast.service';
import { PaymentMethod, METHOD_LABELS } from '../../models/order.model';
import { RecommendationItem } from '../../models/recommendation.model';
import { productFromRecommendation } from '../../core/product-utils';
import { isEmail } from '../../core/validators';
import { errorMessage } from '../../core/http-error';

/**
 * The order and order lines are saved through Commande. Payment is still simulated:
 * no card number is sent to or stored by a service.
 */
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [FormsModule, DecimalPipe, RouterLink],
  template: `
    <div class="page-head">
      <h1>🛒 Mon panier</h1>
    </div>

    @if (cart.items().length === 0) {
      <div class="empty card">
        <p>Votre panier est vide.</p>
        <a routerLink="/shop" class="btn btn-primary">Parcourir les produits</a>
      </div>
    } @else {
      <div class="split">
        <section class="stack">
          <div class="card">
            @for (item of cart.items(); track item.product.id) {
              <div class="cart-line">
                <div class="grow">
                  <div class="product-name">{{ item.product.name }}</div>
                  <div class="muted small">{{ item.product.price | number: '1.2-2' }} TND / unité · stock {{ item.product.stock }}</div>
                </div>
                <div class="qty">
                  <button class="btn btn-ghost btn-sm" (click)="setQty(item.product.id ?? 0, item.quantity - 1)">−</button>
                  <span>{{ item.quantity }}</span>
                  <button class="btn btn-ghost btn-sm" (click)="setQty(item.product.id ?? 0, item.quantity + 1)">+</button>
                </div>
                <div class="line-total">{{ item.product.price * item.quantity | number: '1.2-2' }} TND</div>
                <button class="btn btn-danger btn-sm" (click)="cart.removeFromCart(item.product.id ?? 0)">✕</button>
              </div>
            }
            <div class="cart-total">
              <span>Total</span>
              <strong>{{ cart.totalPrice() | number: '1.2-2' }} TND</strong>
            </div>
          </div>

          @if (suggestions().length) {
            <div class="card">
              <h3>🤖 Complétez votre panier</h3>
              <div class="suggest-list">
                @for (s of suggestions(); track s.product_id) {
                  <div class="suggest">
                    <div>
                      <div class="product-name">{{ s.name ?? 'Produit #' + s.product_id }}</div>
                      <div class="muted small">{{ s.price | number: '1.2-2' }} TND · {{ s.reasons[0] || 'Souvent acheté ensemble' }}</div>
                    </div>
                    <button class="btn btn-sm btn-primary" [disabled]="s.stock <= 0" (click)="addSuggestion(s)">Ajouter</button>
                  </div>
                }
              </div>
            </div>
          }
        </section>

        <section class="card stack">
          <h3>Passer la commande</h3>

          <label>Nom complet
            <input name="name" [(ngModel)]="form.name" required>
          </label>
          <label>Email
            <input type="email" name="email" [(ngModel)]="form.email" required>
          </label>
          <label>Téléphone
            <input name="phone" [(ngModel)]="form.phone" placeholder="+216 00 000 000" required>
          </label>
          <label>Adresse de livraison
            <textarea name="address" rows="2" [(ngModel)]="form.address" required></textarea>
          </label>

          <fieldset class="methods">
            <legend>Mode de paiement</legend>
            @for (m of methods; track m) {
              <label class="check">
                <input type="radio" name="method" [value]="m" [(ngModel)]="form.method"> {{ methodLabels[m] }}
              </label>
            }
          </fieldset>

          @if (form.method === 'CARD') {
            <div class="card-fields stack">
              <label>Numéro de carte
                <input name="card" inputmode="numeric" maxlength="19" placeholder="1234 5678 9012 3456" [(ngModel)]="form.cardNumber">
              </label>
              <div class="row">
                <label class="grow">Expiration (MM/AA)
                  <input name="expiry" placeholder="08/29" maxlength="5" [(ngModel)]="form.expiry">
                </label>
                <label class="grow">CVC
                  <input name="cvc" inputmode="numeric" maxlength="4" [(ngModel)]="form.cvc">
                </label>
              </div>
              <p class="muted small">Paiement simulé : aucune donnée bancaire n'est enregistrée.</p>
            </div>
          }

          @if (error()) {
            <div class="alert error">{{ error() }}</div>
          }

          <div class="summary">
            <span>{{ cart.totalCount() }} article(s)</span>
            <strong>{{ cart.totalPrice() | number: '1.2-2' }} TND</strong>
          </div>

          <button class="btn btn-primary btn-block" [disabled]="submitting()" (click)="submit()">
            {{ submitting() ? 'Traitement…' : 'Confirmer et payer' }}
          </button>
        </section>
      </div>
    }
  `
})
export class CartComponent implements OnInit {
  readonly cart = inject(CartService);
  private auth = inject(AuthService);
  private commande = inject(CommandeApiService);
  private reco = inject(RecommendationService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly methods: PaymentMethod[] = ['CARD', 'CASH', 'TRANSFER'];
  readonly methodLabels = METHOD_LABELS;

  readonly suggestions = signal<RecommendationItem[]>([]);
  readonly error = signal('');
  readonly submitting = signal(false);

  form = {
    name: '',
    email: '',
    phone: '',
    address: '',
    method: 'CARD' as PaymentMethod,
    cardNumber: '',
    expiry: '',
    cvc: ''
  };

  ngOnInit(): void {
    const u = this.auth.currentUser();
    if (u) {
      this.form.name = `${u.firstname} ${u.lastname}`;
      this.form.email = u.email;
    }
    const ids = this.cart.items().map(i => i.product.id).filter((id): id is number => id !== undefined);
    if (ids.length) {
      this.reco.forCart(ids, { limit: 4 })
        .pipe(catchError(() => of(null)))
        .subscribe(r => this.suggestions.set(r?.items ?? []));
    }
  }

  setQty(productId: number, quantity: number): void {
    const item = this.cart.items().find(i => i.product.id === productId);
    if (!item) return;
    if (quantity > item.product.stock) {
      this.toast.show(`Stock limité à ${item.product.stock} unité(s).`, 'info');
      return;
    }
    this.cart.updateQuantity(productId, quantity);
  }

  addSuggestion(s: RecommendationItem): void {
    const product = productFromRecommendation(s, []);
    this.cart.addToCart(product, 1);
    this.toast.show(`« ${product.name} » ajouté au panier`);
  }

  submit(): void {
    this.error.set('');
    const f = this.form;
    const user = this.auth.currentUser();

    if (!user?.id) return this.fail('Votre session a expiré, reconnectez-vous.');
    if (this.cart.items().length === 0) return this.fail('Votre panier est vide.');
    if (!f.name.trim()) return this.fail('Le nom est obligatoire.');
    if (!isEmail(f.email)) return this.fail('Adresse email invalide.');
    if (!/^\+?[0-9 ]{8,}$/.test(f.phone.trim())) return this.fail('Numéro de téléphone invalide.');
    if (f.address.trim().length < 5) return this.fail('Adresse de livraison trop courte.');

    if (f.method === 'CARD') {
      const num = f.cardNumber.replace(/\s/g, '');
      if (!/^\d{16}$/.test(num)) return this.fail('Numéro de carte invalide (16 chiffres).');
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.expiry)) return this.fail('Date d’expiration invalide (format MM/AA).');
      if (isExpired(f.expiry)) return this.fail('Cette carte est expirée.');
      if (!/^\d{3,4}$/.test(f.cvc)) return this.fail('CVC invalide.');
    }

    const overStock = this.cart.items().find(i => i.quantity > i.product.stock);
    if (overStock) {
      return this.fail(`Stock insuffisant pour « ${overStock.product.name} » (${overStock.product.stock} disponible).`);
    }
    const missingProductId = this.cart.items().find(i => !i.product.id);
    if (missingProductId) {
      return this.fail(`Le produit « ${missingProductId.product.name} » n'a pas d'identifiant valide.`);
    }

    this.submitting.set(true);
    const items = this.cart.items();
    this.commande.createOrder({
      userId: user.id,
      orderDate: null,
      status: 'EN_ATTENTE'
    }).pipe(
      concatMap(order => this.createOrderLines(order, items))
    ).subscribe({
      next: order => {
        this.cart.clearCart();
        this.submitting.set(false);
        this.toast.show(`Commande #${order.id} enregistrée dans le backend.`);
        this.router.navigate(['/shop/commandes']);
      },
      error: error => {
        this.submitting.set(false);
        this.fail(error instanceof Error && error.name === 'Error'
          ? error.message
          : errorMessage(error, 'La commande n’a pas pu être enregistrée.'));
      }
    });
  }

  private fail(message: string): void {
    this.error.set(message);
  }

  private createOrderLines(
    order: CommandeOrder,
    items: CartItem[]
  ) {
    const createdLines: CommandeOrderLine[] = [];
    return from(items).pipe(
      concatMap(item => this.commande.createOrderLine({
        productId: item.product.id!,
        quantity: item.quantity,
        customerOrder: { id: order.id }
      }).pipe(tap(line => createdLines.push(line)))),
      toArray(),
      map(() => order),
      catchRequestError(requestError => {
        const rollback = from([...createdLines].reverse()).pipe(
          concatMap(line => this.commande.deleteOrderLine(line.id)),
          toArray(),
          concatMap(() => this.commande.deleteOrder(order.id))
        );
        return rollback.pipe(
          catchRequestError(rollbackError => throwError(() => new Error(
            `Order #${order.id} was created but checkout failed (${errorMessage(requestError, 'order line failed')}); cleanup also failed (${errorMessage(rollbackError, 'rollback failed')}). Refresh My Orders and inspect the backend before retrying.`
          ))),
          concatMap(() => throwError(() => requestError))
        );
      })
    );
  }
}

/** Vrai si la date MM/AA est dépassée (validité jusqu'à la fin du mois) */
function isExpired(mmYY: string): boolean {
  const [mm, yy] = mmYY.split('/').map(Number);
  const endOfMonth = new Date(2000 + yy, mm, 1);
  return endOfMonth.getTime() <= Date.now();
}
