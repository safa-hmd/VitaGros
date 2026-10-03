import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';
import { Payment, Invoice } from '../../models/payment.model';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, CurrencyPipe, SlicePipe],
  templateUrl: './payments.component.html'
})
export class PaymentsComponent implements OnInit {
  payments = signal<Payment[]>([]);
  invoices = signal<Invoice[]>([]);
  error = signal('');
  showForm = signal(false);
  editId = signal<number | null>(null);
  form: Payment = { method: 'CARD', amount: 0, paidAt: '' };
  invoiceId: number | null = null;

  constructor(private paymentService: PaymentService) {}
  ngOnInit() { this.load(); }

  load() {
    this.paymentService.getAllPayments().subscribe({ next: p => this.payments.set(p), error: () => this.error.set('Microservice paiement indisponible') });
    this.paymentService.getAllInvoices().subscribe({ next: i => this.invoices.set(i) });
  }

  openForm() { this.reset(); this.showForm.set(true); }
  edit(p: Payment) { this.form = { ...p }; this.invoiceId = p.invoice?.id ?? null; this.editId.set(p.id!); this.showForm.set(true); }

  save() {
    const body: Payment = { ...this.form };
    if (this.invoiceId) body.invoice = { id: this.invoiceId, orderId: 0, amount: 0, issueDate: '' };
    const id = this.editId();
    const req = id ? this.paymentService.updatePayment(id, body) : this.paymentService.createPayment(body);
    req.subscribe({ next: () => { this.reset(); this.load(); }, error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  remove(id: number) {
    if (!confirm('Supprimer ?')) return;
    this.paymentService.deletePayment(id).subscribe({ next: () => this.load(), error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  reset() { this.form = { method: 'CARD', amount: 0, paidAt: '' }; this.invoiceId = null; this.editId.set(null); this.showForm.set(false); this.error.set(''); }
}
