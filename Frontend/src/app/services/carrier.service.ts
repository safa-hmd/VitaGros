import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Carrier } from '../models/carrier.model';

const BASE = 'http://localhost:8085/api/carriers';

@Injectable({ providedIn: 'root' })
export class CarrierService {
  private http = inject(HttpClient);

  getAll(): Observable<Carrier[]> {
    return this.http.get<Carrier[]>(BASE);
  }

  create(carrier: Carrier): Observable<Carrier> {
    return this.http.post<Carrier>(BASE, carrier);
  }

  update(id: number, carrier: Carrier): Observable<Carrier> {
    return this.http.put<Carrier>(`${BASE}/${id}`, carrier);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
