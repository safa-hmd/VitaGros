import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice, Payment } from '../models/payment.model';

const BASE = 'http://localhost:8084/api';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  // Invoices
  getAllInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${BASE}/invoices`);
  }

  getInvoiceById(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${BASE}/invoices/${id}`);
  }

  createInvoice(invoice: Invoice): Observable<Invoice> {
    return this.http.post<Invoice>(`${BASE}/invoices`, invoice);
  }

  updateInvoice(id: number, invoice: Invoice): Observable<Invoice> {
    return this.http.put<Invoice>(`${BASE}/invoices/${id}`, invoice);
  }

  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/invoices/${id}`);
  }

  // Payments
  getAllPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${BASE}/payments`);
  }

  getPaymentById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${BASE}/payments/${id}`);
  }

  createPayment(payment: Payment): Observable<Payment> {
    return this.http.post<Payment>(`${BASE}/payments`, payment);
  }

  updatePayment(id: number, payment: Payment): Observable<Payment> {
    return this.http.put<Payment>(`${BASE}/payments/${id}`, payment);
  }

  deletePayment(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/payments/${id}`);
  }
}
