import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommandeApiService, CommandeOrder, CommandeOrderLine } from '../../services/commande-api.service';
import { errorMessage } from '../../core/http-error';

interface OrderForm {
  id: number | null;
  userId: number | null;
  orderDate: string;
  status: string;
}

interface OrderLineForm {
  id: number | null;
  orderId: number | null;
  productId: number | null;
  quantity: number;
}

const EMPTY_ORDER: OrderForm = { id: null, userId: null, orderDate: '', status: 'EN_ATTENTE' };
const EMPTY_LINE: OrderLineForm = { id: null, orderId: null, productId: null, quantity: 1 };

@Component({
  selector: 'app-commande-test',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="test-page">
      <header class="page-head">
        <div>
          <p class="eyebrow">VitaGros · Backend playground</p>
          <h1>Commande API tester</h1>
          <p class="muted">Create and manage orders and order lines through the Commande microservice.</p>
        </div>
        <button class="btn btn-ghost" type="button" (click)="reload()" [disabled]="loading()">
          {{ loading() ? 'Refreshing…' : '↻ Refresh data' }}
        </button>
      </header>

      <div class="connection card">
        <span class="connection-dot"></span>
        <span>API: <code>http://localhost:8083/api</code></span>
        <span class="muted">· Orders and order lines are stored by the backend.</span>
      </div>

      <div class="alert info prerequisites">
        <strong>Before creating test data:</strong>
        create a user, then a category and product in the dependent services.
        <a href="http://localhost:8081/swagger-ui.html" target="_blank" rel="noopener noreferrer">Open User API</a>
        <a href="http://localhost:8082/swagger-ui.html" target="_blank" rel="noopener noreferrer">Open Produit API</a>
        <span class="muted">Use their generated IDs below. Produit needs a category before you can create a product.</span>
      </div>

      @if (notice()) {
        <div class="alert info notice" role="status">{{ notice() }}</div>
      }
      @if (error()) {
        <div class="alert error notice" role="alert">{{ error() }}</div>
      }

      <section class="test-grid">
        <form class="card stack" (ngSubmit)="saveOrder()">
          <div class="section-head">
            <div>
              <h2>{{ orderForm.id === null ? 'Create an order' : 'Edit order #' + orderForm.id }}</h2>
              <p class="muted small">The customer ID must exist in the User service.</p>
            </div>
            @if (orderForm.id !== null) {
              <button class="btn btn-ghost btn-sm" type="button" (click)="resetOrderForm()">Cancel edit</button>
            }
          </div>
          <div class="form-grid">
            <label>User ID
              <input type="number" name="userId" min="1" required [(ngModel)]="orderForm.userId">
            </label>
            <label>Status
              <select name="orderStatus" required [(ngModel)]="orderForm.status">
                @for (status of statuses; track status) {
                  <option [value]="status">{{ status }}</option>
                }
              </select>
            </label>
            <label>Order date <span class="muted">(optional)</span>
              <input type="date" name="orderDate" [(ngModel)]="orderForm.orderDate">
            </label>
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            {{ saving() ? 'Saving…' : orderForm.id === null ? 'Create order' : 'Save order' }}
          </button>
        </form>

        <form class="card stack" (ngSubmit)="saveOrderLine()">
          <div class="section-head">
            <div>
              <h2>{{ lineForm.id === null ? 'Create an order line' : 'Edit line #' + lineForm.id }}</h2>
              <p class="muted small">Product must exist and have enough stock. Price comes from Produit.</p>
            </div>
            @if (lineForm.id !== null) {
              <button class="btn btn-ghost btn-sm" type="button" (click)="resetLineForm()">Cancel edit</button>
            }
          </div>
          <div class="form-grid">
            <label>Order
              <select name="lineOrderId" required [(ngModel)]="lineForm.orderId">
                <option [ngValue]="null" disabled>Select an order</option>
                @for (order of orders(); track order.id) {
                  <option [ngValue]="order.id">#{{ order.id }} · User {{ order.userId }} · {{ order.status }}</option>
                }
              </select>
            </label>
            <label>Product ID
              <input type="number" name="productId" min="1" required [(ngModel)]="lineForm.productId">
            </label>
            <label>Quantity
              <input type="number" name="quantity" min="1" step="1" required [(ngModel)]="lineForm.quantity">
            </label>
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="saving() || orders().length === 0">
            {{ saving() ? 'Saving…' : lineForm.id === null ? 'Create order line' : 'Save order line' }}
          </button>
          @if (orders().length === 0) {
            <p class="muted small">Create an order before adding an order line.</p>
          }
        </form>
      </section>

      <section class="card table-card">
        <div class="section-head table-heading">
          <div>
            <h2>Orders <span class="count">{{ orders().length }}</span></h2>
            <p class="muted small">GET, POST, PUT and DELETE <code>/api/orders</code></p>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>ID</th><th>User ID</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              @for (order of orders(); track order.id) {
                <tr>
                  <td>#{{ order.id }}</td>
                  <td>{{ order.userId }}</td>
                  <td>{{ order.orderDate ? (order.orderDate | date: 'mediumDate') : '—' }}</td>
                  <td><span class="badge">{{ order.status }}</span></td>
                  <td class="actions-cell">
                    <button class="btn btn-ghost btn-sm" type="button" (click)="editOrder(order)">Edit</button>
                    <button class="btn btn-danger btn-sm" type="button" (click)="removeOrder(order)">Delete</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">No orders yet. Create one above to try the API.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="card table-card">
        <div class="section-head table-heading">
          <div>
            <h2>Order lines <span class="count">{{ lines().length }}</span></h2>
            <p class="muted small">GET, POST, PUT and DELETE <code>/api/order-lines</code> · creates and deletes adjust Produit stock</p>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>ID</th><th>Order ID</th><th>Product ID</th><th>Quantity</th><th>Unit price</th><th>Actions</th></tr></thead>
            <tbody>
              @for (line of lines(); track line.id) {
                <tr>
                  <td>#{{ line.id }}</td>
                  <td>#{{ line.customerOrder.id }}</td>
                  <td>{{ line.productId }}</td>
                  <td>{{ line.quantity }}</td>
                  <td>{{ line.unitPrice === null ? '—' : (line.unitPrice | number: '1.2-2') }}</td>
                  <td class="actions-cell">
                    <button class="btn btn-ghost btn-sm" type="button" (click)="editLine(line)">Edit</button>
                    <button class="btn btn-danger btn-sm" type="button" (click)="removeLine(line)">Delete</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">No order lines yet. Create an order line above to test product stock updates.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    .test-page { max-width: 1440px; margin: 0 auto; padding: 36px 28px 64px; }
    .page-head { align-items: center; margin-bottom: 22px; }
    .page-head h1 { font-size: clamp(26px, 4vw, 36px); margin: 3px 0 6px; }
    .page-head p { margin: 0; }
    .eyebrow { color: var(--primary-light); text-transform: uppercase; letter-spacing: 1.2px; font-size: 11px; font-weight: 800; }
    .connection { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; padding: 12px 16px; box-shadow: none; }
    .connection-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--success); box-shadow: 0 0 10px rgba(16,185,129,.55); }
    code { color: #c4b5fd; font-size: 12px; }
    .prerequisites { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
    .prerequisites a { text-decoration: underline; }
    .notice { margin-bottom: 14px; }
    .test-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; align-items: start; }
    .section-head { align-items: flex-start; }
    .section-head h2 { margin-bottom: 4px; }
    .section-head p { margin: 0; }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .table-card { margin-top: 20px; padding: 0; overflow: hidden; }
    .table-heading { padding: 20px 20px 14px; margin: 0; }
    .table-wrap { overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; text-align: left; }
    .table th, .table td { padding: 12px 16px; border-top: 1px solid var(--border); white-space: nowrap; }
    .table th { color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: .5px; }
    .actions-cell { display: flex; gap: 8px; }
    .count { display: inline-flex; min-width: 24px; justify-content: center; margin-left: 4px; padding: 1px 7px; border-radius: 99px; background: var(--border); color: var(--text-muted); font-size: 12px; vertical-align: 2px; }
    .empty { padding: 26px; text-align: center; color: var(--text-muted); }
    @media (max-width: 850px) { .test-grid { grid-template-columns: 1fr; } }
    @media (max-width: 560px) { .test-page { padding: 22px 14px 40px; } .connection { align-items: flex-start; flex-wrap: wrap; } .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class CommandeTestComponent implements OnInit {
  private readonly api = inject(CommandeApiService);

  readonly orders = signal<CommandeOrder[]>([]);
  readonly lines = signal<CommandeOrderLine[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly statuses = ['EN_ATTENTE', 'CONFIRMEE', 'EN_LIVRAISON', 'LIVREE', 'ANNULEE'];

  orderForm: OrderForm = { ...EMPTY_ORDER };
  lineForm: OrderLineForm = { ...EMPTY_LINE };

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    let completed = 0;
    const finish = (): void => {
      completed += 1;
      if (completed === 2) this.loading.set(false);
    };

    this.api.getOrders().subscribe({
      next: orders => this.orders.set(orders),
      error: error => {
        this.error.set(errorMessage(error, 'Could not load orders from Commande.'));
        finish();
      },
      complete: finish
    });
    this.api.getOrderLines().subscribe({
      next: lines => this.lines.set(lines),
      error: error => {
        this.error.set(errorMessage(error, 'Could not load order lines from Commande.'));
        finish();
      },
      complete: finish
    });
  }

  saveOrder(): void {
    const form = this.orderForm;
    if (form.userId === null || !Number.isInteger(form.userId) || form.userId < 1) {
      this.error.set('Enter a valid User ID.');
      return;
    }

    this.runSave(
      form.id === null
        ? this.api.createOrder({ userId: form.userId, orderDate: form.orderDate || null, status: form.status })
        : this.api.updateOrder(form.id, { userId: form.userId, orderDate: form.orderDate || null, status: form.status }),
      form.id === null ? 'Order created.' : 'Order updated.',
      () => this.resetOrderForm()
    );
  }

  saveOrderLine(): void {
    const form = this.lineForm;
    if (form.orderId === null || form.productId === null || !Number.isInteger(form.productId) || form.productId < 1) {
      this.error.set('Select an order and enter a valid Product ID.');
      return;
    }
    if (!Number.isInteger(form.quantity) || form.quantity < 1) {
      this.error.set('Quantity must be a positive whole number.');
      return;
    }

    const line = {
      productId: form.productId,
      quantity: form.quantity,
      customerOrder: { id: form.orderId }
    };
    this.runSave(
      form.id === null ? this.api.createOrderLine(line) : this.api.updateOrderLine(form.id, line),
      form.id === null ? 'Order line created; product stock was updated.' : 'Order line updated; product stock was adjusted.',
      () => this.resetLineForm()
    );
  }

  editOrder(order: CommandeOrder): void {
    this.clearMessages();
    this.orderForm = {
      id: order.id,
      userId: order.userId,
      orderDate: order.orderDate?.slice(0, 10) ?? '',
      status: order.status
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editLine(line: CommandeOrderLine): void {
    this.clearMessages();
    this.lineForm = {
      id: line.id,
      orderId: line.customerOrder?.id ?? null,
      productId: line.productId,
      quantity: line.quantity
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  removeOrder(order: CommandeOrder): void {
    if (!window.confirm(`Delete order #${order.id}? Orders with order lines may be rejected by the backend.`)) return;
    this.api.deleteOrder(order.id).subscribe({
      next: () => {
        this.notice.set(`Order #${order.id} deleted.`);
        this.error.set('');
        this.reload();
      },
      error: error => this.error.set(errorMessage(error, 'Could not delete the order.'))
    });
  }

  removeLine(line: CommandeOrderLine): void {
    if (!window.confirm(`Delete order line #${line.id}? The product stock will be returned.`)) return;
    this.api.deleteOrderLine(line.id).subscribe({
      next: () => {
        this.notice.set(`Order line #${line.id} deleted; stock was returned.`);
        this.error.set('');
        this.reload();
      },
      error: error => this.error.set(errorMessage(error, 'Could not delete the order line.'))
    });
  }

  resetOrderForm(): void {
    this.orderForm = { ...EMPTY_ORDER };
  }

  resetLineForm(): void {
    this.lineForm = { ...EMPTY_LINE };
  }

  private runSave(request: ReturnType<CommandeApiService['createOrder']>, successMessage: string, reset: () => void): void;
  private runSave(request: ReturnType<CommandeApiService['createOrderLine']>, successMessage: string, reset: () => void): void;
  private runSave(request: import('rxjs').Observable<unknown>, successMessage: string, reset: () => void): void {
    this.saving.set(true);
    this.clearMessages();
    request.subscribe({
      next: () => {
        this.saving.set(false);
        reset();
        this.notice.set(successMessage);
        this.reload();
      },
      error: error => {
        this.saving.set(false);
        this.error.set(errorMessage(error, 'The request failed.'));
      }
    });
  }

  private clearMessages(): void {
    this.error.set('');
    this.notice.set('');
  }
}
