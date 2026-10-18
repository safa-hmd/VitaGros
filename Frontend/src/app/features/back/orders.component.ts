import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { OrderStoreService } from '../../services/order-store.service';
import { CarrierService } from '../../services/carrier.service';
import { ToastService } from '../../services/toast.service';
import { Carrier } from '../../models/carrier.model';
import { METHOD_LABELS, ORDER_STEPS, Order, OrderStatus, STATUS_LABELS } from '../../models/order.model';

@Component({
  selector: 'app-orders-admin',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="page-head">
      <h1>🧾 Commandes</h1>
      <span class="muted small">{{ store.orders().length }} commande(s)</span>
    </div>

    <div class="toolbar">
      <input class="grow" placeholder="Rechercher (n°, client, email)…" [(ngModel)]="search">
      <select [(ngModel)]="statusFilter">
        <option value="ALL">Tous les statuts</option>
        @for (s of statuses; track s) {
          <option [value]="s">{{ label(s) }}</option>
        }
      </select>
    </div>

    <div class="split wide-left">
      <section class="card table-wrap">
        <table class="table">
          <thead><tr><th>#</th><th>Client</th><th>Date</th><th class="num">Total</th><th>Paiement</th><th>Statut</th></tr></thead>
          <tbody>
            @for (o of filtered; track o.id) {
              <tr class="clickable" [class.selected]="selectedId() === o.id" (click)="selectedId.set(o.id)">
                <td>#{{ o.id }}</td>
                <td>{{ o.customerName }}</td>
                <td>{{ o.createdAt | date: 'dd/MM/yy HH:mm' }}</td>
                <td class="num">{{ o.total | number: '1.2-2' }}</td>
                <td><span class="badge" [class.ok]="o.payment.status === 'PAID'" [class.warn]="o.payment.status !== 'PAID'">{{ o.payment.status === 'PAID' ? 'Payé' : 'En attente' }}</span></td>
                <td><span class="badge" [class]="'badge ' + o.status">{{ label(o.status) }}</span></td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="muted center">Aucune commande ne correspond.</td></tr>
            }
          </tbody>
        </table>
      </section>

      <aside class="card stack">
        @if (selected(); as o) {
          <div class="order-head">
            <h3>Commande #{{ o.id }}</h3>
            <span class="badge" [class]="'badge ' + o.status">{{ label(o.status) }}</span>
          </div>

          <div class="stepper compact">
            @for (step of steps; track step; let i = $index) {
              <div class="step" [class.done]="i < stepIndex(o)" [class.current]="i === stepIndex(o)">
                <span class="dot">{{ i + 1 }}</span>
                <span class="step-label">{{ label(step) }}</span>
              </div>
            }
          </div>

          <div class="section-block">
            <h4>Client</h4>
            <div class="kv"><span>Nom</span><span>{{ o.customerName }}</span></div>
            <div class="kv"><span>Email</span><span>{{ o.customerEmail }}</span></div>
            <div class="kv"><span>Téléphone</span><span>{{ o.phone }}</span></div>
            <div class="kv"><span>Adresse</span><span>{{ o.address }}</span></div>
          </div>

          <div class="section-block">
            <h4>Articles</h4>
            <table class="table small">
              <tbody>
                @for (it of o.items; track it.productId) {
                  <tr>
                    <td>{{ it.quantity }} × {{ it.name }}</td>
                    <td class="num">{{ it.unitPrice * it.quantity | number: '1.2-2' }}</td>
                  </tr>
                }
                <tr class="total-row"><td>Total</td><td class="num">{{ o.total | number: '1.2-2' }} TND</td></tr>
              </tbody>
            </table>
          </div>

          <div class="section-block">
            <h4>Paiement & facture</h4>
            <div class="kv"><span>Mode</span><span>{{ methodLabel(o) }}</span></div>
            <div class="kv"><span>Statut</span><span [class.ok]="o.payment.status === 'PAID'" [class.warn]="o.payment.status !== 'PAID'">{{ o.payment.status === 'PAID' ? 'Payé' : 'En attente' }}</span></div>
            <div class="kv"><span>Référence</span><span>{{ o.payment.reference }}</span></div>
            <div class="kv"><span>Facture</span><span>{{ o.invoice.number }} · {{ o.invoice.issueDate | date: 'dd/MM/yyyy' }}</span></div>
            <button class="btn btn-ghost btn-sm" (click)="print()">🖨️ Imprimer la facture</button>
          </div>

          <div class="section-block actions-block">
            <h4>Actions</h4>
            @if (o.status === 'EN_ATTENTE') {
              <div class="actions">
                <button class="btn btn-primary btn-sm" (click)="confirm(o)">✔ Confirmer</button>
                <button class="btn btn-danger btn-sm" (click)="cancel(o)">Annuler</button>
              </div>
            }
            @if (o.status === 'CONFIRMEE') {
              <div class="stack">
                <label>Affecter un livreur
                  <select name="carrier" [(ngModel)]="carrierChoice">
                    <option [ngValue]="null">— Choisir —</option>
                    @for (c of carriers(); track c.id) {
                      <option [ngValue]="c.id">{{ c.name }} ({{ c.phone }})</option>
                    }
                  </select>
                </label>
                <button class="btn btn-primary btn-sm" (click)="assign(o)">🚚 Affecter et lancer la livraison</button>
              </div>
            }
            @if (o.status === 'EN_LIVRAISON') {
              <p class="small">Livreur : <strong>{{ o.carrierName }}</strong> · {{ o.carrierPhone }}</p>
              <button class="btn btn-primary btn-sm" (click)="deliver(o)">✅ Marquer comme livrée</button>
            }
            @if (o.payment.status === 'PENDING' && o.status !== 'ANNULEE') {
              <button class="btn btn-ghost btn-sm" (click)="markPaid(o)">💰 Marquer comme payée</button>
            }
            @if (o.status === 'LIVREE' || o.status === 'ANNULEE') {
              <p class="muted small">Aucune action disponible.</p>
            }
          </div>
        } @else {
          <p class="muted">Sélectionnez une commande pour voir son détail, sa facture et gérer sa livraison.</p>
        }
      </aside>
    </div>
  `
})
export class OrdersAdminComponent implements OnInit {
  readonly store = inject(OrderStoreService);
  private carrierApi = inject(CarrierService);
  private toast = inject(ToastService);

  readonly steps = ORDER_STEPS;
  readonly statuses: OrderStatus[] = [...ORDER_STEPS, 'ANNULEE'];
  readonly carriers = signal<Carrier[]>([]);
  readonly selectedId = signal<number | null>(null);
  readonly selected = computed<Order | undefined>(() => {
    const id = this.selectedId();
    return id === null ? undefined : this.store.get(id);
  });

  search = '';
  statusFilter: 'ALL' | OrderStatus = 'ALL';
  carrierChoice: number | null = null;

  get filtered(): Order[] {
    const q = this.search.trim().toLowerCase();
    return this.store.orders().filter(o =>
      (this.statusFilter === 'ALL' || o.status === this.statusFilter) &&
      (!q || `${o.id} ${o.customerName} ${o.customerEmail}`.toLowerCase().includes(q))
    );
  }

  ngOnInit(): void {
    this.carrierApi.getAll().pipe(catchError(() => of([] as Carrier[]))).subscribe(list => this.carriers.set(list));
  }

  label(status: OrderStatus): string {
    return STATUS_LABELS[status];
  }

  methodLabel(o: Order): string {
    return METHOD_LABELS[o.payment.method];
  }

  stepIndex(o: Order): number {
    return ORDER_STEPS.indexOf(o.status);
  }

  confirm(o: Order): void {
    this.store.confirm(o.id);
    this.toast.show(`Commande #${o.id} confirmée.`);
  }

  cancel(o: Order): void {
    if (!confirm(`Annuler la commande #${o.id} ?`)) return;
    this.store.cancel(o.id);
    this.toast.show(`Commande #${o.id} annulée.`, 'info');
  }

  assign(o: Order): void {
    const carrier = this.carriers().find(c => c.id === this.carrierChoice);
    if (!carrier) {
      this.toast.show('Choisissez un livreur.', 'error');
      return;
    }
    this.store.assignCarrier(o.id, carrier);
    this.carrierChoice = null;
    this.toast.show(`Livraison lancée avec ${carrier.name}.`);
  }

  deliver(o: Order): void {
    this.store.markDelivered(o.id);
    this.toast.show(`Commande #${o.id} livrée.`);
  }

  markPaid(o: Order): void {
    this.store.markPaid(o.id);
    this.toast.show(`Paiement de la commande #${o.id} enregistré.`);
  }

  print(): void {
    window.print();
  }
}
