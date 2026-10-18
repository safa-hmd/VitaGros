import { Injectable, computed, signal } from '@angular/core';
import { Carrier } from '../models/carrier.model';
import { Order, OrderItem, PaymentMethod } from '../models/order.model';

export interface PlaceOrderInput {
  userId: number;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  address: string;
  phone: string;
  method: PaymentMethod;
}

const KEY = 'vitagros_orders';

/**
 * Stockage local des commandes, factures, paiements et livraisons.
 * Fonctionne sans API (localStorage) : partagé entre l'espace client et l'espace admin
 * puisque les deux vivent dans la même application. Pour brancher le backend plus tard,
 * il suffit de remplacer les méthodes de ce service par des appels HTTP.
 */
@Injectable({ providedIn: 'root' })
export class OrderStoreService {
  private readonly _orders = signal<Order[]>(this.load());

  /** Toutes les commandes, les plus récentes d'abord */
  readonly orders = computed(() => [...this._orders()].sort((a, b) => b.id - a.id));

  forUser(userId: number): Order[] {
    return this.orders().filter(o => o.userId === userId);
  }

  get(id: number): Order | undefined {
    return this._orders().find(o => o.id === id);
  }

  placeOrder(input: PlaceOrderInput): Order {
    const now = new Date();
    const id = this._orders().reduce((max, o) => Math.max(max, o.id), 0) + 1;
    const total = round2(input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));
    const paidOnline = input.method === 'CARD';

    const order: Order = {
      id,
      userId: input.userId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      createdAt: now.toISOString(),
      items: input.items,
      total,
      address: input.address,
      phone: input.phone,
      status: 'EN_ATTENTE',
      payment: {
        method: input.method,
        status: paidOnline ? 'PAID' : 'PENDING',
        reference: 'TX-' + randomRef(),
        paidAt: paidOnline ? now.toISOString() : null
      },
      invoice: {
        number: `FAC-${now.getFullYear()}-${String(id).padStart(5, '0')}`,
        issueDate: now.toISOString(),
        amount: total
      },
      carrierId: null,
      carrierName: null,
      carrierPhone: null
    };

    this.save([...this._orders(), order]);
    return order;
  }

  confirm(id: number): void {
    this.patch(id, o => ({ ...o, status: 'CONFIRMEE' }));
  }

  cancel(id: number): void {
    this.patch(id, o => ({ ...o, status: 'ANNULEE' }));
  }

  assignCarrier(id: number, carrier: Carrier): void {
    this.patch(id, o => ({
      ...o,
      status: 'EN_LIVRAISON',
      carrierId: carrier.id ?? null,
      carrierName: carrier.name,
      carrierPhone: carrier.phone
    }));
  }

  markDelivered(id: number): void {
    this.patch(id, o => ({
      ...o,
      status: 'LIVREE',
      payment: o.payment.status === 'PENDING'
        ? { ...o.payment, status: 'PAID', paidAt: new Date().toISOString() }
        : o.payment
    }));
  }

  markPaid(id: number): void {
    this.patch(id, o => ({
      ...o,
      payment: { ...o.payment, status: 'PAID', paidAt: o.payment.paidAt ?? new Date().toISOString() }
    }));
  }

  private patch(id: number, change: (o: Order) => Order): void {
    this.save(this._orders().map(o => (o.id === id ? change(o) : o)));
  }

  private save(list: Order[]): void {
    this._orders.set(list);
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  private load(): Order[] {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Order[]) : [];
    } catch {
      return [];
    }
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function randomRef(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}
