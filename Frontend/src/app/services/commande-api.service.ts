import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CommandeOrder {
  id: number;
  userId: number;
  orderDate: string;
  status: string;
}

export interface CommandeOrderLine {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number | null;
  customerOrder: Pick<CommandeOrder, 'id'>;
}

export interface CommandeOrderInput {
  userId: number;
  orderDate: string | null;
  status: string;
}

export interface CommandeOrderLineInput {
  productId: number;
  quantity: number;
  customerOrder: Pick<CommandeOrder, 'id'>;
}

const BASE = 'http://localhost:8083/api';

@Injectable({ providedIn: 'root' })
export class CommandeApiService {
  private readonly http = inject(HttpClient);

  getOrders(): Observable<CommandeOrder[]> {
    return this.http.get<CommandeOrder[]>(`${BASE}/orders`);
  }

  createOrder(order: CommandeOrderInput): Observable<CommandeOrder> {
    return this.http.post<CommandeOrder>(`${BASE}/orders`, order);
  }

  updateOrder(id: number, order: CommandeOrderInput): Observable<CommandeOrder> {
    return this.http.put<CommandeOrder>(`${BASE}/orders/${id}`, order);
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/orders/${id}`);
  }

  getOrderLines(): Observable<CommandeOrderLine[]> {
    return this.http.get<CommandeOrderLine[]>(`${BASE}/order-lines`);
  }

  createOrderLine(line: CommandeOrderLineInput): Observable<CommandeOrderLine> {
    return this.http.post<CommandeOrderLine>(`${BASE}/order-lines`, line);
  }

  updateOrderLine(id: number, line: CommandeOrderLineInput): Observable<CommandeOrderLine> {
    return this.http.put<CommandeOrderLine>(`${BASE}/order-lines/${id}`, line);
  }

  deleteOrderLine(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/order-lines/${id}`);
  }
}
