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
    this.api.getPayments().subscribe({
      next: list => this.payments.set(list),
      error: e => this.toast.show(errorMessage(e, 'Chargement des paiements impossible.'), 'error')
    });
    this.api.getInvoices().subscribe({
      next: list => this.invoices.set(list),
      error: e => this.toast.show(errorMessage(e, 'Chargement des factures impossible.'), 'error')
    });
  }
}