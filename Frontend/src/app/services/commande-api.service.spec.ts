import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { CommandeApiService } from './commande-api.service';

describe('CommandeApiService', () => {
  let service: CommandeApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CommandeApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads orders and order lines from Commande', () => {
    const order = { id: 12, userId: 3, orderDate: '2025-03-01', status: 'PENDING' };
    const line = {
      id: 21,
      productId: 5,
      quantity: 2,
      unitPrice: 14.5,
      customerOrder: { id: 12 }
    };

    service.getOrders().subscribe(result => expect(result).toEqual([order]));
    service.getOrderLines().subscribe(result => expect(result).toEqual([line]));

    http.expectOne('http://localhost:8083/api/orders').flush([order]);
    http.expectOne('http://localhost:8083/api/order-lines').flush([line]);
  });

  it('creates orders and order lines with the supplied payloads', () => {
    const orderInput = { userId: 3, orderDate: null, status: 'PENDING' };
    const lineInput = { productId: 5, quantity: 2, customerOrder: { id: 12 } };

    service.createOrder(orderInput).subscribe();
    const orderRequest = http.expectOne('http://localhost:8083/api/orders');
    expect(orderRequest.request.method).toBe('POST');
    expect(orderRequest.request.body).toEqual(orderInput);
    orderRequest.flush({ id: 12, ...orderInput, orderDate: '2025-03-01' });

    service.createOrderLine(lineInput).subscribe();
    const lineRequest = http.expectOne('http://localhost:8083/api/order-lines');
    expect(lineRequest.request.method).toBe('POST');
    expect(lineRequest.request.body).toEqual(lineInput);
    lineRequest.flush({ id: 21, ...lineInput, unitPrice: 14.5 });
  });

  it('updates orders and order lines at their resource URLs', () => {
    const orderInput = { userId: 3, orderDate: null, status: 'SHIPPED' };
    const lineInput = { productId: 5, quantity: 4, customerOrder: { id: 12 } };

    service.updateOrder(12, orderInput).subscribe();
    const orderRequest = http.expectOne('http://localhost:8083/api/orders/12');
    expect(orderRequest.request.method).toBe('PUT');
    expect(orderRequest.request.body).toEqual(orderInput);
    orderRequest.flush({ id: 12, ...orderInput, orderDate: '2025-03-01' });

    service.updateOrderLine(21, lineInput).subscribe();
    const lineRequest = http.expectOne('http://localhost:8083/api/order-lines/21');
    expect(lineRequest.request.method).toBe('PUT');
    expect(lineRequest.request.body).toEqual(lineInput);
    lineRequest.flush({ id: 21, ...lineInput, unitPrice: 14.5 });
  });

  it('deletes orders and order lines at their resource URLs', () => {
    service.deleteOrder(12).subscribe();
    const orderRequest = http.expectOne('http://localhost:8083/api/orders/12');
    expect(orderRequest.request.method).toBe('DELETE');
    orderRequest.flush(null);

    service.deleteOrderLine(21).subscribe();
    const lineRequest = http.expectOne('http://localhost:8083/api/order-lines/21');
    expect(lineRequest.request.method).toBe('DELETE');
    lineRequest.flush(null);
  });
});
