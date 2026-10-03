import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../services/delivery.service';
import { Carrier } from '../../models/delivery.model';

@Component({
  selector: 'app-carriers',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './carriers.component.html'
})
export class CarriersComponent implements OnInit {
  carriers = signal<Carrier[]>([]);
  error = signal('');
  showForm = signal(false);
  editId = signal<number | null>(null);
  form: Carrier = { name: '', phone: '' };

  constructor(private deliveryService: DeliveryService) {}
  ngOnInit() { this.load(); }
  load() { this.deliveryService.getAllCarriers().subscribe({ next: c => this.carriers.set(c), error: () => this.error.set('Microservice livraison indisponible (port 8085)') }); }
  openForm() { this.reset(); this.showForm.set(true); }
  edit(c: Carrier) { this.form = { ...c }; this.editId.set(c.id!); this.showForm.set(true); }
  save() {
    const id = this.editId();
    const req = id ? this.deliveryService.updateCarrier(id, this.form) : this.deliveryService.createCarrier(this.form);
    req.subscribe({ next: () => { this.reset(); this.load(); }, error: e => this.error.set(e.error?.message || 'Erreur') });
  }
  remove(id: number) {
    if (!confirm('Supprimer ?')) return;
    this.deliveryService.deleteCarrier(id).subscribe({ next: () => this.load(), error: e => this.error.set(e.error?.message || 'Erreur') });
  }
  reset() { this.form = { name: '', phone: '' }; this.editId.set(null); this.showForm.set(false); this.error.set(''); }
}
