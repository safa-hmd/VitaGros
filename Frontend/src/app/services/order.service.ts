import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerOrder, OrderLine } from '../models/order.model';

const BASE = 'http://localhost:8083/api';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  // Orders
  getAllOrders(): Observable<CustomerOrder[]> {
    return this.http.get<CustomerOrder[]>(`${BASE}/orders`);
  }

  getOrderById(id: number): Observable<CustomerOrder> {
    return this.http.get<CustomerOrder>(`${BASE}/orders/${id}`);
  }

  createOrder(order: CustomerOrder): Observable<CustomerOrder> {
    return this.http.post<CustomerOrder>(`${BASE}/orders`, order);
  }

  updateOrder(id: number, order: CustomerOrder): Observable<CustomerOrder> {
    return this.http.put<CustomerOrder>(`${BASE}/orders/${id}`, order);
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/orders/${id}`);
  }

  // Order Lines
  getAllOrderLines(): Observable<OrderLine[]> {
    return this.http.get<OrderLine[]>(`${BASE}/order-lines`);
  }

  getOrderLineById(id: number): Observable<OrderLine> {
    return this.http.get<OrderLine>(`${BASE}/order-lines/${id}`);
  }

  createOrderLine(line: OrderLine): Observable<OrderLine> {
    return this.http.post<OrderLine>(`${BASE}/order-lines`, line);
  }

  updateOrderLine(id: number, line: OrderLine): Observable<OrderLine> {
    return this.http.put<OrderLine>(`${BASE}/order-lines/${id}`, line);
  }

  deleteOrderLine(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/order-lines/${id}`);
  }
}
