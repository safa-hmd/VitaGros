import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { OrderLine, CustomerOrder } from '../../models/order.model';

@Component({
  selector: 'app-order-lines',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, CurrencyPipe],
  templateUrl: './order-lines.component.html'
})
export class OrderLinesComponent implements OnInit {
  lines = signal<OrderLine[]>([]);
  orders = signal<CustomerOrder[]>([]);
  error = signal('');
  showForm = signal(false);
  editId = signal<number | null>(null);
  form: OrderLine = { productId: 0, quantity: 1, unitPrice: 0 };
  orderId: number | null = null;

  constructor(private orderService: OrderService) {}
  ngOnInit() { this.load(); }

  load() {
    this.orderService.getAllOrderLines().subscribe({ next: l => this.lines.set(l), error: () => this.error.set('Microservice commande indisponible') });
    this.orderService.getAllOrders().subscribe({ next: o => this.orders.set(o) });
  }

  openForm() { this.reset(); this.showForm.set(true); }
  edit(l: OrderLine) { this.form = { ...l }; this.orderId = l.customerOrder?.id ?? null; this.editId.set(l.id!); this.showForm.set(true); }

  save() {
    const body: OrderLine = { ...this.form };
    if (this.orderId) body.customerOrder = { id: this.orderId, userId: 0, orderDate: '', status: '' };
    const id = this.editId();
    const req = id ? this.orderService.updateOrderLine(id, body) : this.orderService.createOrderLine(body);
    req.subscribe({ next: () => { this.reset(); this.load(); }, error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  remove(id: number) {
    if (!confirm('Supprimer ?')) return;
    this.orderService.deleteOrderLine(id).subscribe({ next: () => this.load(), error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  reset() { this.form = { productId: 0, quantity: 1, unitPrice: 0 }; this.orderId = null; this.editId.set(null); this.showForm.set(false); this.error.set(''); }
}
