import { Component, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrderStoreService } from '../../services/order-store.service';
import { ToastService } from '../../services/toast.service';
import { METHOD_LABELS, ORDER_STEPS, Order, STATUS_LABELS } from '../../models/order.model';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  template: `
    <div class="page-head">
      <h1>📦 Mes commandes</h1>
      <p class="muted">Suivez l'avancement de vos livraisons en temps réel.</p>
    </div>

    @if (orders().length === 0) {
      <div class="empty card">
        <p>Vous n'avez pas encore de commande.</p>
        <a routerLink="/shop" class="btn btn-primary">Commencer mes achats</a>
      </div>
    }

    <div class="stack">
      @for (o of orders(); track o.id) {
        <article class="card order-card">
          <div class="order-head">
            <div>
              <strong>Commande #{{ o.id }}</strong>
              <div class="muted small">{{ o.createdAt | date: 'dd/MM/yyyy HH:mm' }} · Facture {{ o.invoice.number }}</div>
            </div>
            <span class="badge" [class]="'badge ' + o.status">{{ statusLabel(o) }}</span>
          </div>

          @if (o.status !== 'ANNULEE') {
            <div class="stepper">
              @for (step of steps; track step; let i = $index) {
                <div class="step" [class.done]="i < stepIndex(o)" [class.current]="i === stepIndex(o)">
                  <span class="dot">{{ i + 1 }}</span>
                  <span class="step-label">{{ stepLabel(step) }}</span>
                </div>
              }
            </div>
          }

          @if (o.carrierName) {
            <div class="delivery-box">
              🚚 Livreur : <strong>{{ o.carrierName }}</strong>
              @if (o.carrierPhone) {
                · <a [href]="'tel:' + o.carrierPhone">{{ o.carrierPhone }}</a>
              }
            </div>
          }

          <ul class="order-items">
            @for (it of o.items; track it.productId) {
              <li>{{ it.quantity }} × {{ it.name }} <span class="muted">({{ it.unitPrice | number: '1.2-2' }} TND)</span></li>
            }
          </ul>

          <div class="order-foot">
            <span class="muted small">
              {{ methodLabel(o) }} · {{ o.payment.status === 'PAID' ? 'Payé' : 'Paiement en attente' }}
              · Livraison : {{ o.address }}
            </span>
            <div class="order-total">
              <strong>{{ o.total | number: '1.2-2' }} TND</strong>
              @if (o.status === 'EN_ATTENTE') {
                <button class="btn btn-danger btn-sm" (click)="cancel(o)">Annuler</button>
              }
            </div>
          </div>
        </article>
      }
    </div>
  `
})
export class MyOrdersComponent {
  private auth = inject(AuthService);
  private store = inject(OrderStoreService);
  private toast = inject(ToastService);

  readonly steps = ORDER_STEPS;
  readonly orders = computed(() => {
    const uid = this.auth.currentUser()?.id;
    return uid ? this.store.forUser(uid) : [];
  });

  stepIndex(o: Order): number {
    return ORDER_STEPS.indexOf(o.status);
  }

  stepLabel(status: string): string {
    return STATUS_LABELS[status as Order['status']];
  }

  statusLabel(o: Order): string {
    return STATUS_LABELS[o.status];
  }

  methodLabel(o: Order): string {
    return METHOD_LABELS[o.payment.method];
  }

  cancel(o: Order): void {
    if (!confirm(`Annuler la commande #${o.id} ?`)) return;
    this.store.cancel(o.id);
    this.toast.show(`Commande #${o.id} annulée.`, 'info');
  }
}
