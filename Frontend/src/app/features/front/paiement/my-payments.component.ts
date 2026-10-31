import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { PaymentService } from '../../../services/payment.service';
import { CommandeApiService } from '../../../services/commande-api.service';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../../services/toast.service';
import { Payment } from '../../../models/payment.model';
import { METHOD_LABELS, PaymentMethod } from '../../../models/order.model';
import { errorMessage } from '../../../core/http-error';

interface UnpaidOrder { id: number; amount: number; lines: string; }

@Component({
  selector: 'app-my-payments',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink],
  templateUrl: './my-payments.component.html'
})
export class MyPaymentsComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(PaymentService);
  private commande = inject(CommandeApiService);
  private products = inject(ProductService);
  private toast = inject(ToastService);

  readonly payments = signal<Payment[]>([]);
  readonly toPay = signal<UnpaidOrder[]>([]);
  readonly selected = signal<UnpaidOrder | null>(null);
  readonly error = signal('');
  readonly submitting = signal(false);
  card = { number: '', expiry: '', cvc: '' };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const uid = this.auth.currentUser()?.id;
    if (!uid) return;
    this.api.paymentsByUser(uid).subscribe({
      next: list => {
        this.payments.set(list);
        this.loadToPay(uid);
      },
      error: e => this.toast.show(errorMessage(e, 'Chargement des paiements impossible.'), 'error')
    });
  }

  private loadToPay(uid: number): void {
    forkJoin({
      orders: this.commande.getOrders(),
      lines: this.commande.getOrderLines(),
      products: this.products.getAllProducts()
    }).subscribe({
      next: ({ orders, lines, products }) => {
        const paid = new Set(this.payments().map(p => p.invoice.orderId));
        const nameOf = (id: number) => products.find(p => p.id === id)?.name ?? 'Produit #' + id;
        const priceOf = (id: number) => products.find(p => p.id === id)?.price ?? 0;
        this.toPay.set(
          orders
            .filter(o => o.userId === uid && o.status === 'EN_ATTENTE' && !paid.has(o.id))
            .sort((a, b) => b.id - a.id)
            .map(o => {
              const ol = lines.filter(l => l.customerOrder.id === o.id);
              return {
                id: o.id,
                amount: ol.reduce((s, l) => s + l.quantity * (l.unitPrice ?? priceOf(l.productId)), 0),
                lines: ol.map(l => `${l.quantity} × ${nameOf(l.productId)}`).join(', ')
              };
            })
        );
      },
      error: e => this.toast.show(errorMessage(e, 'Chargement des commandes impossible.'), 'error')
    });
  }

  choose(o: UnpaidOrder): void {
    this.selected.set(o);
    this.card = { number: '', expiry: '', cvc: '' };
    this.error.set('');
  }

  pay(): void {
    const o = this.selected();
    const uid = this.auth.currentUser()?.id;
    if (!o || !uid) return;

    const num = this.card.number.replace(/\s/g, '');
    if (!/^\d{16}$/.test(num)) return this.error.set('Numéro de carte invalide (16 chiffres).');
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.card.expiry)) return this.error.set('Date d’expiration invalide (MM/AA).');
    const [mm, yy] = this.card.expiry.split('/').map(Number);
    if (new Date(2000 + yy, mm, 1).getTime() <= Date.now()) return this.error.set('Cette carte est expirée.');
    if (!/^\d{3,4}$/.test(this.card.cvc)) return this.error.set('CVC invalide.');
    if (o.amount <= 0) return this.error.set('Montant introuvable pour cette commande.');

    this.submitting.set(true);
    this.api.pay({ orderId: o.id, userId: uid, amount: o.amount, method: 'CARD' }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.selected.set(null);
        this.toast.show(`Commande #${o.id} payée.`);
        this.load();
      },
      error: e => {
        this.submitting.set(false);
        this.error.set(errorMessage(e, 'Paiement impossible.'));
      }
    });
  }

  methodLabel(p: Payment): string {
    return METHOD_LABELS[p.method as PaymentMethod] ?? p.method;
  }
}