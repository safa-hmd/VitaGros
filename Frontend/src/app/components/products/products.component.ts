import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Category, Product } from '../../models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, CurrencyPipe],
  templateUrl: './products.component.html'
})
export class ProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  error = signal('');
  showForm = signal(false);
  editId = signal<number | null>(null);
  form: Product = { name: '', price: 0, stock: 0 };
  categoryId: number | null = null;
  search = '';

  constructor(private productService: ProductService) {}

  ngOnInit() { this.load(); }

  load() {
    this.productService.getAllProducts().subscribe({
      next: p => this.products.set(p),
      error: () => this.error.set('Microservice produit indisponible (port 8082)')
    });
    this.productService.getAllCategories().subscribe({ next: c => this.categories.set(c) });
  }

  filtered(): Product[] {
    const s = this.search.toLowerCase();
    return this.products().filter(p => !s || p.name.toLowerCase().includes(s));
  }

  openForm() { this.reset(); this.showForm.set(true); }

  edit(p: Product) {
    this.form = { ...p };
    this.categoryId = p.category?.id ?? null;
    this.editId.set(p.id!);
    this.showForm.set(true);
  }

  save() {
    const body: Product = { ...this.form };
    if (this.categoryId) body.category = { id: this.categoryId, name: '', description: '' };

    const id = this.editId();
    const req = id
      ? this.productService.updateProduct(id, body)
      : this.productService.createProduct(body);

    req.subscribe({ next: () => { this.reset(); this.load(); }, error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  remove(id: number) {
    if (!confirm('Supprimer ce produit ?')) return;
    this.productService.deleteProduct(id).subscribe({ next: () => this.load(), error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  reset() { this.form = { name: '', price: 0, stock: 0 }; this.categoryId = null; this.editId.set(null); this.showForm.set(false); this.error.set(''); }
}
