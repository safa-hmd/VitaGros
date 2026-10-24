import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice, Payment } from '../models/payment.model';

const BASE = 'http://localhost:8084/api';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);

  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${BASE}/payments`);
  }

  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${BASE}/invoices`);
  }

  pay(body: { orderId: number; userId: number; amount: number; method: string }): Observable<Payment> {
    return this.http.post<Payment>(`${BASE}/payments/pay`, body);
  }

  paymentsByUser(userId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${BASE}/payments/by-user/${userId}`);
  }
}