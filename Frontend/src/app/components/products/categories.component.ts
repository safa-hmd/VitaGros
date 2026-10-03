import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Category } from '../../models/product.model';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './categories.component.html'
})
export class CategoriesComponent implements OnInit {
  categories = signal<Category[]>([]);
  error = signal('');
  showForm = signal(false);
  editId = signal<number | null>(null);
  form: Category = { name: '', description: '' };

  constructor(private productService: ProductService) {}
  ngOnInit() { this.load(); }

  load() {
    this.productService.getAllCategories().subscribe({
      next: c => this.categories.set(c),
      error: () => this.error.set('Microservice produit indisponible (port 8082)')
    });
  }

  openForm() { this.reset(); this.showForm.set(true); }
  edit(c: Category) { this.form = { ...c }; this.editId.set(c.id!); this.showForm.set(true); }

  save() {
    const id = this.editId();
    const req = id
      ? this.productService.updateCategory(id, this.form)
      : this.productService.createCategory(this.form);
    req.subscribe({ next: () => { this.reset(); this.load(); }, error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  remove(id: number) {
    if (!confirm('Supprimer cette catégorie ?')) return;
    this.productService.deleteCategory(id).subscribe({ next: () => this.load(), error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  reset() { this.form = { name: '', description: '' }; this.editId.set(null); this.showForm.set(false); this.error.set(''); }
}
