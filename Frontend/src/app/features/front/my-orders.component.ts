import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommandeApiService, CommandeOrder, CommandeOrderLine } from '../../services/commande-api.service';
import { ToastService } from '../../services/toast.service';
import { errorMessage } from '../../core/http-error';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  template: `
    <div class="page-head">
      <h1>📦 Mes commandes</h1>
      <p class="muted">Commandes enregistrées par le service Commande.</p>
      <button class="btn btn-ghost" type="button" (click)="reload()" [disabled]="loading()">
        {{ loading() ? 'Chargement…' : '↻ Actualiser' }}
      </button>
    </div>

    @if (error()) {
      <div class="alert error" role="alert">
        {{ error() }}
        <button class="btn btn-ghost btn-sm" type="button" (click)="reload()">Réessayer</button>
      </div>
    }

    @if (loading() && orders().length === 0) {
      <div class="empty card">Chargement de vos commandes…</div>
    } @else if (orders().length === 0 && !error()) {
      <div class="empty card">
        <p>Vous n'avez pas encore de commande enregistrée dans le backend.</p>
        <a routerLink="/shop" class="btn btn-primary">Commencer mes achats</a>
      </div>
    } @else {
      <div class="stack">
        @for (order of orders(); track order.id) {
          <article class="card order-card">
            <div class="order-head">
              <div>
                <strong>Commande #{{ order.id }}</strong>
                <div class="muted small">Créée le {{ order.orderDate | date: 'dd/MM/yyyy' }} · Client #{{ order.userId }}</div>
              </div>
              <span class="badge" [class]="'badge ' + order.status">{{ order.status }}</span>
            </div>

            <ul class="order-items">
              @for (line of linesFor(order.id); track line.id) {
                <li>
                  {{ line.quantity }} × Produit #{{ line.productId }}
                  @if (line.unitPrice !== null) {
                    <span class="muted">({{ line.unitPrice | number: '1.2-2' }} TND / unité)</span>
                  }
                </li>
              } @empty {
                <li class="muted">Aucun article associé à cette commande.</li>
              }
            </ul>

            <div class="order-foot">
              <span class="muted small">{{ linesFor(order.id).length }} article(s)</span>
              @if (order.status === 'EN_ATTENTE') {
                <button class="btn btn-danger btn-sm" type="button" (click)="cancel(order)" [disabled]="savingId() === order.id">
                  {{ savingId() === order.id ? 'Annulation…' : 'Annuler' }}
                </button>
              }
            </div>
          </article>
        }
      </div>
    }
  `
})
export class MyOrdersComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(CommandeApiService);
  private readonly toast = inject(ToastService);

  readonly orders = signal<CommandeOrder[]>([]);
  readonly orderLines = signal<CommandeOrderLine[]>([]);
  readonly loading = signal(false);
  readonly savingId = signal<number | null>(null);
  readonly error = signal('');

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const userId = this.auth.currentUser()?.id;
    if (userId === undefined) {
      this.error.set('Votre session a expiré, reconnectez-vous.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.api.getOrders().subscribe({
      next: allOrders => {
        const userOrders = allOrders.filter(order => order.userId === userId);
        this.orders.set(userOrders.sort((a, b) => b.id - a.id));
        this.loadLines();
      },
      error: error => {
        this.loading.set(false);
        this.error.set(errorMessage(error, 'Impossible de charger vos commandes.'));
      }
    });
  }

  linesFor(orderId: number): CommandeOrderLine[] {
    return this.orderLines().filter(line => line.customerOrder.id === orderId);
  }

  cancel(order: CommandeOrder): void {
    if (!window.confirm(`Annuler la commande #${order.id} ?`)) return;
    this.savingId.set(order.id);
    this.error.set('');
    this.api.updateOrder(order.id, {
      userId: order.userId,
      orderDate: order.orderDate,
      status: 'ANNULEE'
    }).subscribe({
      next: () => {
        this.savingId.set(null);
        this.toast.show(`Commande #${order.id} annulée.`, 'info');
        this.reload();
      },
      error: error => {
        this.savingId.set(null);
        this.error.set(errorMessage(error, 'Impossible d’annuler cette commande.'));
      }
    });
  }

  private loadLines(): void {
    if (this.orders().length === 0) {
      this.orderLines.set([]);
      this.loading.set(false);
      return;
    }
    this.api.getOrderLines().subscribe({
      next: lines => this.orderLines.set(lines),
      error: error => {
        this.loading.set(false);
        this.error.set(errorMessage(error, 'Impossible de charger les articles des commandes.'));
      },
      complete: () => this.loading.set(false)
    });
  }
}
