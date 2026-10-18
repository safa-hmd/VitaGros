import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { Category, Product } from '../../models/product.model';
import { errorMessage } from '../../core/http-error';

interface ProductForm {
  id: number | null;
  name: string;
  price: number;
  stock: number;
  categoryId: number | null;
}

const EMPTY: ProductForm = { id: null, name: '', price: 0, stock: 0, categoryId: null };

@Component({
  selector: 'app-products-admin',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="page-head">
      <h1>📦 Produits</h1>
      <button class="btn btn-primary" (click)="openNew()">+ Nouveau produit</button>
    </div>

    @if (showForm()) {
      <form class="card stack narrow" (ngSubmit)="save()">
        <h3>{{ form.id ? 'Modifier le produit #' + form.id : 'Nouveau produit' }}</h3>
        <div class="row">
          <label class="grow">Nom
            <input name="name" [(ngModel)]="form.name" required>
          </label>
          <label class="grow">Catégorie
            <select name="category" [(ngModel)]="form.categoryId" required>
              <option [ngValue]="null">— Choisir —</option>
              @for (c of categories(); track c.id) {
                <option [ngValue]="c.id">{{ c.name }}</option>
              }
            </select>
          </label>
        </div>
        <div class="row">
          <label class="grow">Prix (TND)
            <input type="number" min="0" step="0.01" name="price" [(ngModel)]="form.price" required>
          </label>
          <label class="grow">Stock
            <input type="number" min="0" step="1" name="stock" [(ngModel)]="form.stock" required>
          </label>
        </div>
        @if (error()) {
          <div class="alert error">{{ error() }}</div>
        }
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="cancel()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ saving() ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    }

    <div class="toolbar">
      <input class="grow" placeholder="Rechercher un produit…" [(ngModel)]="search">
    </div>

    @if (loading()) {
      <p class="muted">Chargement…</p>
    } @else {
      <div class="card table-wrap">
        <table class="table">
          <thead>
            <tr><th>#</th><th>Nom</th><th>Catégorie</th><th class="num">Prix</th><th class="num">Stock</th><th></th></tr>
          </thead>
          <tbody>
            @for (p of filtered; track p.id) {
              <tr>
                <td>{{ p.id }}</td>
                <td>{{ p.name }}</td>
                <td>{{ p.category?.name ?? '—' }}</td>
                <td class="num">{{ p.price | number: '1.2-2' }}</td>
                <td class="num" [class.bad]="p.stock < 5">{{ p.stock }}</td>
                <td class="actions-cell">
                  <button class="btn btn-ghost btn-sm" (click)="edit(p)">Modifier</button>
                  <button class="btn btn-danger btn-sm" (click)="remove(p)">Supprimer</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="muted center">Aucun produit.</td></tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class ProductsAdminComponent implements OnInit {
  private api = inject(ProductService);
  private toast = inject(ToastService);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  search = '';
  form: ProductForm = { ...EMPTY };

  get filtered(): Product[] {
    const q = this.search.trim().toLowerCase();
    return this.products().filter(p => !q || p.name.toLowerCase().includes(q));
  }

  ngOnInit(): void {
    this.api.getAllCategories().subscribe({ next: c => this.categories.set(c), error: () => undefined });
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.api.getAllProducts().subscribe({
      next: p => {
        this.products.set(p);
        this.loading.set(false);
      },
      error: e => {
        this.loading.set(false);
        this.toast.show(errorMessage(e, 'Chargement impossible.'), 'error');
      }
    });
  }

  openNew(): void {
    this.form = { ...EMPTY };
    this.error.set('');
    this.showForm.set(true);
  }

  edit(p: Product): void {
    this.form = { id: p.id ?? null, name: p.name, price: p.price, stock: p.stock, categoryId: p.category?.id ?? null };
    this.error.set('');
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
  }

  save(): void {
    const f = this.form;
    if (!f.name.trim()) return this.error.set('Le nom est obligatoire.');
    if (f.categoryId === null) return this.error.set('Choisissez une catégorie.');
    if (f.price < 0 || f.stock < 0) return this.error.set('Le prix et le stock doivent être positifs.');

    const body: Product = {
      name: f.name.trim(),
      price: f.price,
      stock: Math.floor(f.stock),
      category: { id: f.categoryId, name: '', description: '' }
    };
    this.saving.set(true);
    const request = f.id
      ? this.api.updateProduct(f.id, body)
      : this.api.createProduct(body);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toast.show(f.id ? 'Produit modifié.' : 'Produit créé.');
        this.reload();
      },
      error: e => {
        this.saving.set(false);
        this.error.set(errorMessage(e, 'Enregistrement impossible.'));
      }
    });
  }

  remove(p: Product): void {
    if (!p.id || !confirm(`Supprimer le produit « ${p.name} » ?`)) return;
    this.api.deleteProduct(p.id).subscribe({
      next: () => {
        this.toast.show('Produit supprimé.');
        this.reload();
      },
      error: e => this.toast.show(errorMessage(e, 'Suppression impossible.'), 'error')
    });
  }
}
