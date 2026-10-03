import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { CustomerOrder } from '../../models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {
  orders = signal<CustomerOrder[]>([]);
  error = signal('');
  showForm = signal(false);
  editId = signal<number | null>(null);
  form: CustomerOrder = { userId: 0, orderDate: '', status: 'PENDING' };
  search = '';

  constructor(private orderService: OrderService) {}
  ngOnInit() { this.load(); }

  load() {
    this.orderService.getAllOrders().subscribe({
      next: o => this.orders.set(o),
      error: () => this.error.set('Microservice commande indisponible (port 8083)')
    });
  }

  filtered() {
    const s = this.search.toLowerCase();
    return this.orders().filter(o => !s || o.status?.toLowerCase().includes(s));
  }

  openForm() { this.reset(); this.showForm.set(true); }
  edit(o: CustomerOrder) { this.form = { ...o }; this.editId.set(o.id!); this.showForm.set(true); }

  save() {
    const id = this.editId();
    const req = id ? this.orderService.updateOrder(id, this.form) : this.orderService.createOrder(this.form);
    req.subscribe({ next: () => { this.reset(); this.load(); }, error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  remove(id: number) {
    if (!confirm('Supprimer cette commande ?')) return;
    this.orderService.deleteOrder(id).subscribe({ next: () => this.load(), error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  reset() { this.form = { userId: 0, orderDate: '', status: 'PENDING' }; this.editId.set(null); this.showForm.set(false); this.error.set(''); }
}
