import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';
import { Invoice } from '../../models/payment.model';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, CurrencyPipe],
  templateUrl: './invoices.component.html'
})
export class InvoicesComponent implements OnInit {
  invoices = signal<Invoice[]>([]);
  error = signal('');
  showForm = signal(false);
  editId = signal<number | null>(null);
  form: Invoice = { orderId: 0, amount: 0, issueDate: '' };

  constructor(private paymentService: PaymentService) {}
  ngOnInit() { this.load(); }

  load() {
    this.paymentService.getAllInvoices().subscribe({
      next: i => this.invoices.set(i),
      error: () => this.error.set('Microservice paiement indisponible (port 8084)')
    });
  }

  openForm() { this.reset(); this.showForm.set(true); }
  edit(inv: Invoice) { this.form = { ...inv }; this.editId.set(inv.id!); this.showForm.set(true); }

  save() {
    const id = this.editId();
    const req = id ? this.paymentService.updateInvoice(id, this.form) : this.paymentService.createInvoice(this.form);
    req.subscribe({ next: () => { this.reset(); this.load(); }, error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  remove(id: number) {
    if (!confirm('Supprimer cette facture ?')) return;
    this.paymentService.deleteInvoice(id).subscribe({ next: () => this.load(), error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  reset() { this.form = { orderId: 0, amount: 0, issueDate: '' }; this.editId.set(null); this.showForm.set(false); this.error.set(''); }
}
