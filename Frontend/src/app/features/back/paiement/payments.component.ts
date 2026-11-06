import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PaymentService } from '../../../services/payment.service';
import { ToastService } from '../../../services/toast.service';
import { Invoice, Payment } from '../../../models/payment.model';
import { errorMessage } from '../../../core/http-error';

@Component({
  selector: 'app-payments-admin',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './payments.component.html'
})
export class PaymentsAdminComponent implements OnInit {
  private api = inject(PaymentService);
  private toast = inject(ToastService);

  readonly payments = signal<Payment[]>([]);
  readonly invoices = signal<Invoice[]>([]);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.getPayments().subscribe({
      next: list => this.payments.set(list),
      error: e => this.toast.show(errorMessage(e, 'Chargement des paiements impossible.'), 'error')
    });
    this.api.getInvoices().subscribe({
      next: list => this.invoices.set(list),
      error: e => this.toast.show(errorMessage(e, 'Chargement des factures impossible.'), 'error')
    });
  }
  markPaid(p: Payment): void {
  if (!confirm(`Confirmer l'encaissement du paiement #${p.id} ?`)) return;
  this.api.markPaid(p.id).subscribe({
    next: () => { this.toast.show('Paiement marqué comme payé.'); this.reload(); },
    error: e => this.toast.show(errorMessage(e, 'Encaissement impossible.'), 'error')
  });
}

  removePayment(p: Payment): void {
    if (!confirm(`Supprimer le paiement #${p.id} ?`)) return;
    this.api.deletePayment(p.id).subscribe({
      next: () => { this.toast.show('Paiement supprimé.'); this.reload(); },
      error: e => this.toast.show(errorMessage(e, 'Suppression impossible.'), 'error')
    });
  }

  removeInvoice(i: Invoice): void {
    if (!confirm(`Supprimer la facture #${i.id} ?`)) return;
    this.api.deleteInvoice(i.id).subscribe({
      next: () => { this.toast.show('Facture supprimée.'); this.reload(); },
      error: e => this.toast.show(errorMessage(e, 'Suppression impossible (supprimez d’abord son paiement).'), 'error')
    });
  }
  hasPayment(i: Invoice): boolean {
  return this.payments().some(p => p.invoice.id === i.id);
}
}