import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { Category } from '../../models/product.model';
import { errorMessage } from '../../core/http-error';

@Component({
  selector: 'app-categories-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <h1>🏷️ Catégories</h1>
      <button class="btn btn-primary" (click)="openNew()">+ Nouvelle catégorie</button>
    </div>

    @if (showForm()) {
      <form class="card stack narrow" (ngSubmit)="save()">
        <h3>{{ editId ? 'Modifier la catégorie #' + editId : 'Nouvelle catégorie' }}</h3>
        <label>Nom
          <input name="name" [(ngModel)]="form.name" required>
        </label>
        <label>Description
          <textarea name="description" rows="2" [(ngModel)]="form.description" required></textarea>
        </label>
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
        <thead><tr><th>#</th><th>Nom</th><th>Description</th><th></th></tr></thead>
        <tbody>
          @for (c of categories(); track c.id) {
            <tr>
              <td>{{ c.id }}</td>
              <td>{{ c.name }}</td>
              <td class="muted">{{ c.description }}</td>
              <td class="actions-cell">
                <button class="btn btn-ghost btn-sm" (click)="edit(c)">Modifier</button>
                <button class="btn btn-danger btn-sm" (click)="remove(c)">Supprimer</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="4" class="muted center">Aucune catégorie.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class CategoriesAdminComponent implements OnInit {
  private api = inject(ProductService);
  private toast = inject(ToastService);

  readonly categories = signal<Category[]>([]);
  readonly showForm = signal(false);
  readonly error = signal('');
  editId: number | null = null;
  form = { name: '', description: '' };

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.getAllCategories().subscribe({
      next: c => this.categories.set(c),
      error: e => this.toast.show(errorMessage(e, 'Chargement impossible.'), 'error')
    });
  }

  openNew(): void {
    this.editId = null;
    this.form = { name: '', description: '' };
    this.error.set('');
    this.showForm.set(true);
  }

  edit(c: Category): void {
    this.editId = c.id ?? null;
    this.form = { name: c.name, description: c.description };
    this.error.set('');
    this.showForm.set(true);
  }

  save(): void {
    const body: Category = { name: this.form.name.trim(), description: this.form.description.trim() };
    if (!body.name) return this.error.set('Le nom est obligatoire.');
    const request = this.editId
      ? this.api.updateCategory(this.editId, body)
      : this.api.createCategory(body);
    request.subscribe({
      next: () => {
        this.showForm.set(false);
        this.toast.show('Catégorie enregistrée.');
        this.reload();
      },
      error: e => this.error.set(errorMessage(e, 'Enregistrement impossible.'))
    });
  }

  remove(c: Category): void {
    if (!c.id || !confirm(`Supprimer la catégorie « ${c.name} » ?`)) return;
    this.api.deleteCategory(c.id).subscribe({
      next: () => {
        this.toast.show('Catégorie supprimée.');
        this.reload();
      },
      error: e => this.toast.show(errorMessage(e, 'Suppression impossible.'), 'error')
    });
  }
}
