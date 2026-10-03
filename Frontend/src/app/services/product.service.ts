import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, Category } from '../models/product.model';

const BASE = 'http://localhost:8082/api';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}

  // Products
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${BASE}/products`);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${BASE}/products/${id}`);
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${BASE}/products`, product);
  }

  updateProduct(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${BASE}/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/products/${id}`);
  }

  // Categories
  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${BASE}/categories`);
  }

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${BASE}/categories/${id}`);
  }

  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(`${BASE}/categories`, category);
  }

  updateCategory(id: number, category: Category): Observable<Category> {
    return this.http.put<Category>(`${BASE}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/categories/${id}`);
  }
}
