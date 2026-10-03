import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Carrier, Delivery } from '../models/delivery.model';

const BASE = 'http://localhost:8085/api';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  constructor(private http: HttpClient) {}

  // Carriers
  getAllCarriers(): Observable<Carrier[]> {
    return this.http.get<Carrier[]>(`${BASE}/carriers`);
  }

  getCarrierById(id: number): Observable<Carrier> {
    return this.http.get<Carrier>(`${BASE}/carriers/${id}`);
  }

  createCarrier(carrier: Carrier): Observable<Carrier> {
    return this.http.post<Carrier>(`${BASE}/carriers`, carrier);
  }

  updateCarrier(id: number, carrier: Carrier): Observable<Carrier> {
    return this.http.put<Carrier>(`${BASE}/carriers/${id}`, carrier);
  }

  deleteCarrier(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/carriers/${id}`);
  }

  // Deliveries
  getAllDeliveries(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${BASE}/deliveries`);
  }

  getDeliveryById(id: number): Observable<Delivery> {
    return this.http.get<Delivery>(`${BASE}/deliveries/${id}`);
  }

  createDelivery(delivery: Delivery): Observable<Delivery> {
    return this.http.post<Delivery>(`${BASE}/deliveries`, delivery);
  }

  updateDelivery(id: number, delivery: Delivery): Observable<Delivery> {
    return this.http.put<Delivery>(`${BASE}/deliveries/${id}`, delivery);
  }

  deleteDelivery(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/deliveries/${id}`);
  }
}
