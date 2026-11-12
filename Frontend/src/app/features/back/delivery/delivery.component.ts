import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../../services/delivery.service';
import { CarrierService } from '../../../services/carrier.service';
import { ToastService } from '../../../services/toast.service';
import { Delivery, DELIVERY_STATUS_LABELS, DeliveryStatus } from '../../../models/delivery.model';
import { Carrier } from '../../../models/carrier.model';
import { errorMessage } from '../../../core/http-error';

@Component({
  selector: 'app-deliveries-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <h1>📦 Livraisons</h1>
      <button class="btn btn-primary" (click)="openNew()">+ Nouvelle livraison</button>
    </div>

    @if (showForm()) {
      <form class="card stack narrow" (ngSubmit)="save()">
        <h3>{{ editId ? 'Modifier la livraison #' + editId : 'Nouvelle livraison' }}</h3>

        <div class="row">
          <label class="grow">ID de la commande
            <input type="number" name="orderId" [(ngModel)]="form.orderId" required>
          </label>
          <label class="grow">Adresse de livraison
            <input name="address" [(ngModel)]="form.address" required>
          </label>
        </div>

        <div class="row">
          <label class="grow">Statut
            <select name="status" [(ngModel)]="form.status" required>
              @for (status of statuses; track status) {
                <option [value]="status">{{ statusLabels[status] }}</option>
              }
            </select>
          </label>
          <label class="grow">Livreur affecté
            <select name="carrierId" [(ngModel)]="form.carrierId">
              <option [ngValue]="null">— Aucun —</option>
              @for (c of carriers(); track c.id) {
                <option [ngValue]="c.id">{{ c.name }} ({{ c.phone }})</option>
              }
            </select>
          </label>
        </div>

        @if (error()) {
          <div class="alert error">{{ error() }}</div>
        }
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="showForm.set(false)">Annuler</button>
          <button type="submit" class="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    }

    <div class="card table-wrap">
      <table class="table">
        <thead>
        <tr><th>#</th><th>Commande</th><th>Adresse</th><th>Livreur</th><th>Statut</th><th></th></tr>
        </thead>
        <tbody>
          @for (d of deliveries(); track d.id) {
            <tr>
              <td>{{ d.id }}</td>
              <td>#{{ d.orderId }}</td>
              <td>{{ d.address }}</td>
              <td>{{ d.carrier?.name ?? 'Non affecté' }}</td>
              <td>
                <span class="badge">{{ statusLabels[d.status] }}</span>
              </td>
              <td class="actions-cell">
                <button class="btn btn-ghost btn-sm" (click)="edit(d)">Modifier</button>
                <button class="btn btn-danger btn-sm" (click)="remove(d)">Supprimer</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="muted center">Aucune livraison.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class DeliveriesAdminComponent implements OnInit {
  private api = inject(DeliveryService);
  private carrierApi = inject(CarrierService);
  private toast = inject(ToastService);

  readonly deliveries = signal<Delivery[]>([]);
  readonly carriers = signal<Carrier[]>([]);
  readonly showForm = signal(false);
  readonly error = signal('');

  // ⚠️ On utilise les bons statuts
  readonly statuses: DeliveryStatus[] = ['PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'];
  readonly statusLabels = DELIVERY_STATUS_LABELS;

  editId: number | null = null;

  form = {
    orderId: 0,
    address: '',
    status: 'PENDING' as DeliveryStatus,
    carrierId: null as number | null
  };

  ngOnInit(): void {
    this.reload();
    this.loadCarriers();
  }

  reload(): void {
    this.api.getAll().subscribe({
      next: list => this.deliveries.set(list),
      error: e => this.toast.show(errorMessage(e, 'Chargement impossible.'), 'error')
    });
  }

  loadCarriers(): void {
    this.carrierApi.getAll().subscribe({
      next: list => this.carriers.set(list),
      error: () => this.toast.show('Impossible de charger les livreurs.', 'error')
    });
  }

  openNew(): void {
    this.editId = null;
    this.form = { orderId: 0, address: '', status: 'PENDING', carrierId: null };
    this.error.set('');
    this.showForm.set(true);
  }

  edit(d: Delivery): void {
    this.editId = d.id ?? null;
    this.form = {
      orderId: d.orderId,
      address: d.address,
      status: d.status,
      carrierId: d.carrier?.id ?? null
    };
    this.error.set('');
    this.showForm.set(true);
  }

  save(): void {
    if (!this.form.orderId || !this.form.address.trim()) {
      return this.error.set('L\'ID de commande et l\'adresse sont obligatoires.');
    }

    // ⚠️ CONSTRUCTION DU JSON EXACT ATTENDU PAR SPRING BOOT
    const body: Delivery = {
      orderId: this.form.orderId,
      address: this.form.address.trim(),
      status: this.form.status,
      // On crée un objet Carrier avec juste l'ID, comme le backend l'attend
      carrier: this.form.carrierId ? { id: this.form.carrierId } as Carrier : null
    };

    const request = this.editId
      ? this.api.update(this.editId, body)
      : this.api.create(body);

    request.subscribe({
      next: () => {
        this.showForm.set(false);
        this.toast.show('Livraison enregistrée.');
        this.reload();
      },
      error: e => {
        // Affiche l'erreur exacte du backend
        const msg = e.error?.message || 'Enregistrement impossible.';
        this.error.set(msg);
      }
    });
  }

  remove(d: Delivery): void {
    if (!d.id || !confirm(`Supprimer la livraison #${d.id} ?`)) return;
    this.api.delete(d.id).subscribe({
      next: () => {
        this.toast.show('Livraison supprimée.');
        this.reload();
      },
      error: e => this.toast.show(errorMessage(e, 'Suppression impossible.'), 'error')
    });
  }
}
