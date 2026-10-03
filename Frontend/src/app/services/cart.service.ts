import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly STORAGE_KEY = 'vitagros_cart';

  private _items = signal<CartItem[]>([]);
  items = computed(() => this._items());

  totalCount = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0)
  );

  totalPrice = computed(() =>
    this._items().reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0)
  );

  constructor() {
    this._loadCart();
  }

  addToCart(product: Product, quantity: number = 1): void {
    const current = [...this._items()];
    const index = current.findIndex(i => i.product.id === product.id);

    if (index > -1) {
      current[index] = {
        ...current[index],
        quantity: current[index].quantity + quantity
      };
    } else {
      current.push({ product, quantity });
    }

    this._items.set(current);
    this._saveCart();
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const current = this._items().map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    this._items.set(current);
    this._saveCart();
  }

  removeFromCart(productId: number): void {
    const current = this._items().filter(item => item.product.id !== productId);
    this._items.set(current);
    this._saveCart();
  }

  clearCart(): void {
    this._items.set([]);
    this._saveCart();
  }

  private _saveCart(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._items()));
    } catch {
      // ignore
    }
  }

  private _loadCart(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this._items.set(JSON.parse(stored));
      }
    } catch {
      this._items.set([]);
    }
  }
}
