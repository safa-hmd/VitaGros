import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { UserService } from '../../services/user.service';
import { CarrierService } from '../../services/carrier.service';
import { OrderStoreService } from '../../services/order-store.service';
import { Product } from '../../models/product.model';
import { ORDER_STEPS, OrderStatus, STATUS_LABELS } from '../../models/order.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, DatePipe, RouterLink],
  template: `
    <div class="page-head">
      <h1>📊 Tableau de bord</h1>
      @if (loading()) { <span class="muted small">Chargement…</span> }
    </div>

    <div class="kpis">
      <div class="card kpi"><span class="kpi-label">Chiffre d'affaires</span><span class="kpi-value">{{ revenue() | number: '1.2-2' }} TND</span></div>
      <div class="card kpi"><span class="kpi-label">Commandes</span><span class="kpi-value">{{ store.orders().length }}</span></div>
      <div class="card kpi"><span class="kpi-label">À confirmer</span><span class="kpi-value warn-text">{{ countBy('EN_ATTENTE') }}</span></div>
      <div class="card kpi"><span class="kpi-label">Produits</span><span class="kpi-value">{{ productCount() }}</span></div>
      <div class="card kpi"><span class="kpi-label">Catégories</span><span class="kpi-value">{{ categoryCount() }}</span></div>
      <div class="card kpi"><span class="kpi-label">Utilisateurs</span><span class="kpi-value">{{ userCount() }}</span></div>
      <div class="card kpi"><span class="kpi-label">Livreurs</span><span class="kpi-value">{{ carrierCount() }}</span></div>
    </div>

    <div class="split">
      <section class="card">
        <h3>Commandes par statut</h3>
        @for (s of statuses; track s) {
          <div class="bar-row">
            <span class="bar-label">{{ label(s) }}</span>
            <div class="bar"><span [style.width.%]="percent(s)"></span></div>
            <span class="bar-count">{{ countBy(s) }}</span>
          </div>
        }
      </section>

      <section class="card">
        <h3>⚠️ Stock faible (&lt; 5)</h3>
        @if (lowStock().length === 0) {
          <p class="muted">Aucun produit en stock faible.</p>
        }
        <ul class="plain-list">
          @for (p of lowStock(); track p.id) {
            <li><span>{{ p.name }}</span> <span class="bad">{{ p.stock }} restant(s)</span></li>
          }
        </ul>
        <a routerLink="/admin/produits" class="small">Gérer les produits →</a>
      </section>
    </div>

    <section class="card">
      <div class="section-head">
        <h3>Dernières commandes</h3>
        <a routerLink="/admin/commandes" class="small">Toutes les commandes →</a>
      </div>
      @if (recent().length === 0) {
        <p class="muted">Aucune commande pour le moment.</p>
      } @else {
        <table class="table">
          <thead><tr><th>#</th><th>Client</th><th>Date</th><th>Total</th><th>Statut</th></tr></thead>
          <tbody>
            @for (o of recent(); track o.id) {
              <tr>
                <td>#{{ o.id }}</td>
                <td>{{ o.customerName }}</td>
                <td>{{ o.createdAt | date: 'dd/MM/yy HH:mm' }}</td>
                <td>{{ o.total | number: '1.2-2' }} TND</td>
                <td><span class="badge" [class]="'badge ' + o.status">{{ label(o.status) }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `
})
export class DashboardComponent implements OnInit {
  readonly store = inject(OrderStoreService);
  private products = inject(ProductService);
  private users = inject(UserService);
  private carriers = inject(CarrierService);

  readonly statuses: OrderStatus[] = [...ORDER_STEPS, 'ANNULEE'];
  readonly loading = signal(true);
  readonly productCount = signal(0);
  readonly categoryCount = signal(0);
  readonly userCount = signal(0);
  readonly carrierCount = signal(0);
  readonly lowStock = signal<Product[]>([]);

  /** Chiffre d'affaires : commandes non annulées et payées */
  readonly revenue = computed(() =>
    this.store.orders()
      .filter(o => o.status !== 'ANNULEE' && o.payment.status === 'PAID')
      .reduce((sum, o) => sum + o.total, 0)
  );

  readonly recent = computed(() => this.store.orders().slice(0, 5));

  ngOnInit(): void {
    forkJoin({
      products: this.products.getAllProducts().pipe(catchError(() => of([] as Product[]))),
      categories: this.products.getAllCategories().pipe(catchError(() => of([]))),
      users: this.users.getAll().pipe(catchError(() => of([]))),
      carriers: this.carriers.getAll().pipe(catchError(() => of([])))
    }).subscribe(r => {
      this.productCount.set(r.products.length);
      this.categoryCount.set(r.categories.length);
      this.userCount.set(r.users.length);
      this.carrierCount.set(r.carriers.length);
      this.lowStock.set(r.products.filter(p => p.stock < 5).sort((a, b) => a.stock - b.stock));
      this.loading.set(false);
    });
  }

  countBy(status: OrderStatus): number {
    return this.store.orders().filter(o => o.status === status).length;
  }

  percent(status: OrderStatus): number {
    const total = this.store.orders().length;
    return total ? (this.countBy(status) / total) * 100 : 0;
  }

  label(status: OrderStatus): string {
    return STATUS_LABELS[status];
  }
}
