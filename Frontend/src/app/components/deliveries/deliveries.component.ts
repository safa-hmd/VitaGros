import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../services/delivery.service';
import { Delivery, Carrier } from '../../models/delivery.model';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './deliveries.component.html'
})
export class DeliveriesComponent implements OnInit {
  deliveries = signal<Delivery[]>([]);
  carriers = signal<Carrier[]>([]);
  error = signal('');
  showForm = signal(false);
  editId = signal<number | null>(null);
  form: Delivery = { orderId: 0, address: '', status: 'PENDING' };
  carrierId: number | null = null;

  constructor(private deliveryService: DeliveryService) {}
  ngOnInit() { this.load(); }

  load() {
    this.deliveryService.getAllDeliveries().subscribe({ next: d => this.deliveries.set(d), error: () => this.error.set('Microservice livraison indisponible') });
    this.deliveryService.getAllCarriers().subscribe({ next: c => this.carriers.set(c) });
  }

  openForm() { this.reset(); this.showForm.set(true); }
  edit(d: Delivery) { this.form = { ...d }; this.carrierId = d.carrier?.id ?? null; this.editId.set(d.id!); this.showForm.set(true); }

  save() {
    const body: Delivery = { ...this.form };
    if (this.carrierId) body.carrier = { id: this.carrierId, name: '', phone: '' };
    const id = this.editId();
    const req = id ? this.deliveryService.updateDelivery(id, body) : this.deliveryService.createDelivery(body);
    req.subscribe({ next: () => { this.reset(); this.load(); }, error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  remove(id: number) {
    if (!confirm('Supprimer ?')) return;
    this.deliveryService.deleteDelivery(id).subscribe({ next: () => this.load(), error: e => this.error.set(e.error?.message || 'Erreur') });
  }

  reset() { this.form = { orderId: 0, address: '', status: 'PENDING' }; this.carrierId = null; this.editId.set(null); this.showForm.set(false); this.error.set(''); }
}
