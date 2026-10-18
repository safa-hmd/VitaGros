import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CarrierService } from '../../services/carrier.service';
import { ToastService } from '../../services/toast.service';
import { Carrier } from '../../models/carrier.model';
import { errorMessage } from '../../core/http-error';

@Component({
  selector: 'app-carriers-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <h1>🚚 Livreurs</h1>
      <button class="btn btn-primary" (click)="openNew()">+ Nouveau livreur</button>
    </div>

    @if (showForm()) {
      <form class="card stack narrow" (ngSubmit)="save()">
        <h3>{{ editId ? 'Modifier le livreur #' + editId : 'Nouveau livreur' }}</h3>
        <div class="row">
          <label class="grow">Nom
            <input name="name" [(ngModel)]="form.name" required>
          </label>
          <label class="grow">Téléphone
            <input name="phone" [(ngModel)]="form.phone" required>
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
        <thead><tr><th>#</th><th>Nom</th><th>Téléphone</th><th></th></tr></thead>
        <tbody>
          @for (c of carriers(); track c.id) {
            <tr>
              <td>{{ c.id }}</td>
              <td>{{ c.name }}</td>
              <td>{{ c.phone }}</td>
              <td class="actions-cell">
                <button class="btn btn-ghost btn-sm" (click)="edit(c)">Modifier</button>
                <button class="btn btn-danger btn-sm" (click)="remove(c)">Supprimer</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="4" class="muted center">Aucun livreur.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class CarriersAdminComponent implements OnInit {
  private api = inject(CarrierService);
  private toast = inject(ToastService);

  readonly carriers = signal<Carrier[]>([]);
  readonly showForm = signal(false);
  readonly error = signal('');
  editId: number | null = null;
  form = { name: '', phone: '' };

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.getAll().subscribe({
      next: list => this.carriers.set(list),
      error: e => this.toast.show(errorMessage(e, 'Chargement impossible.'), 'error')
    });
  }

  openNew(): void {
    this.editId = null;
    this.form = { name: '', phone: '' };
    this.error.set('');
    this.showForm.set(true);
  }

  edit(c: Carrier): void {
    this.editId = c.id ?? null;
    this.form = { name: c.name, phone: c.phone };
    this.error.set('');
    this.showForm.set(true);
  }

  save(): void {
    const body: Carrier = { name: this.form.name.trim(), phone: this.form.phone.trim() };
    if (!body.name || !body.phone) return this.error.set('Nom et téléphone sont obligatoires.');
    const request = this.editId
      ? this.api.update(this.editId, body)
      : this.api.create(body);
    request.subscribe({
      next: () => {
        this.showForm.set(false);
        this.toast.show('Livreur enregistré.');
        this.reload();
      },
      error: e => this.error.set(errorMessage(e, 'Enregistrement impossible.'))
    });
  }

  remove(c: Carrier): void {
    if (!c.id || !confirm(`Supprimer le livreur « ${c.name} » ?`)) return;
    this.api.delete(c.id).subscribe({
      next: () => {
        this.toast.show('Livreur supprimé.');
        this.reload();
      },
      error: e => this.toast.show(errorMessage(e, 'Suppression impossible.'), 'error')
    });
  }
}
