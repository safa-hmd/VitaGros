# paiement microservice

Spring Boot / Java 17 service for payments and invoices (one invoice per order, one payment per invoice), with MySQL, Swagger, Eureka, OpenFeign and RabbitMQ.

## Run
```
mvn spring-boot:run
```
- Port: http://localhost:8084 (through the gateway: http://localhost:8089/api/payments)
- Swagger UI: http://localhost:8084/swagger-ui.html
- Database: `paiement_db` (MySQL, created automatically, see application.properties)
- Eureka: http://localhost:8761 (start it first). Registered as `paiement`.
- RabbitMQ: `docker compose up -d rabbitmq` (console http://localhost:15672, user `awd` / password `awd`)

## Statuses
| Object | Values |
|---|---|
| Payment | `PENDING`, `PAID`, `FAILED`, `REFUNDED` |
| Invoice | `UNPAID`, `PAID`, `CANCELLED` |
| Method | `CARD`, `CASH`, `TRANSFER` |
| Order (service commande) | `EN_ATTENTE`, `CONFIRMEE`, `EN_LIVRAISON`, `LIVREE`, `ANNULEE` |

## Payment flow
1. The cart only creates the order (`EN_ATTENTE`).
2. On the payment page the customer chooses a method and `POST /api/payments/pay` is called.

| Method | Payment | Invoice | Order | Event published |
|---|---|---|---|---|
| `CARD` | `PAID` | `PAID` | `CONFIRMEE` | `payment.completed` |
| `CASH` / `TRANSFER` | `PENDING` | `UNPAID` | `CONFIRMEE` | none yet |

3. When the money is collected (delivery or transfer received), an admin calls `PUT /api/payments/{id}/mark-paid`: payment and invoice become `PAID` and `payment.completed` is published.

`pay` checks the order through `commande` (OpenFeign client `commande`), refuses an order that already has a payment (409), and sets the order to `CONFIRMEE`.

## Endpoints
| Method | Path | Description |
|---|---|---|
| POST | /api/payments/pay | Pay an order (`orderId`, `userId`, `amount`, `method`) |
| PUT | /api/payments/{id}/mark-paid | Collect a `PENDING` payment (409 if not pending) |
| GET | /api/payments/by-order/{orderId} | Payments of an order |
| GET | /api/payments/by-user/{userId} | Payments of a user |
| GET | /api/invoices/by-order/{orderId} | Invoices of an order |
| GET | /api/invoices/by-user/{userId} | Invoices of a user |
| GET, POST, PUT, DELETE | /api/payments, /api/payments/{id} | Generic CRUD |
| GET, POST, PUT, DELETE | /api/invoices, /api/invoices/{id} | Generic CRUD |

Errors: 400 validation, 404 not found, 409 conflict (already paid, not pending, still referenced).

Example:
```
POST /api/payments/pay
{ "orderId": 15, "userId": 1, "amount": 60.0, "method": "CASH" }
```

## RabbitMQ (producer)
| Item | Value |
|---|---|
| Exchange | `vitagros.events` (topic, durable) |
| Routing key | `payment.completed` |
| Published when | a payment becomes `PAID` (`pay` with `CARD`, or `mark-paid`) |

Message (JSON):
```
{
  "eventId": "uuid",
  "paymentId": 14,
  "orderId": 16,
  "userId": 1,
  "amount": 10.0,
  "method": "CARD",
  "transactionRef": "TX-D4E08DE5",
  "paidAt": "2026-11-06T12:59:36"
}
```
`paiement` never declares a queue. Each consumer declares its own queue and binds it to `vitagros.events` with `payment.completed`. Consumers should ignore an `eventId` they already processed (a message can be delivered twice).

## Structure
```
com.awd.paiement
├── client       OrderClient, OrderFeignClient (calls commande)
├── config       CorsConfig, OpenApiConfig, ApiExceptionHandler, RabbitConfig
├── controller   InvoiceController, PaymentController
├── dto          PayRequest
├── entity       Invoice, Payment (JPA)
├── event        PaymentCompleted
├── repository   Spring Data JPA repositories
└── service      InvoiceService, PaymentService
```