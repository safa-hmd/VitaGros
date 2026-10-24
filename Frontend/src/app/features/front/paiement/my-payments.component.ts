import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { PaymentService } from '../../../services/payment.service';
import { ToastService } from '../../../services/toast.service';
import { Payment } from '../../../models/payment.model';
import { METHOD_LABELS, PaymentMethod } from '../../../models/order.model';
import { errorMessage } from '../../../core/http-error';

@Component({
  selector: 'app-my-payments',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './my-payments.component.html'
})
export class MyPaymentsComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(PaymentService);
  private toast = inject(ToastService);

  readonly payments = signal<Payment[]>([]);

  ngOnInit(): void {
    const uid = this.auth.currentUser()?.id;
    if (!uid) return;
    this.api.paymentsByUser(uid).subscribe({
      next: list => this.payments.set(list),
      error: e => this.toast.show(errorMessage(e, 'Chargement des paiements impossible.'), 'error')
    });
  }

  methodLabel(p: Payment): string {
    return METHOD_LABELS[p.method as PaymentMethod] ?? p.method;
  }
}