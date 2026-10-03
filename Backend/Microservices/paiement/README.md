# paiement microservice

Spring Boot 3.5.6 / Java 17 service exposing a REST API for Payment and Invoice (one-to-many: payment.invoice_id -> invoice.id), with MySQL and Swagger.

## Run
```
mvn spring-boot:run
```
- Port: http://localhost:8084
- Swagger UI: http://localhost:8084/swagger-ui.html
- OpenAPI JSON: http://localhost:8084/v3/api-docs
- Database: `paiement_db` (MySQL, created automatically, user root / empty password, see application.properties)
- Registers itself in Eureka (http://localhost:8761), start Eureka first.

## Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/invoices | List Invoice |
| GET | /api/invoices/{id} | Get one Invoice |
| POST | /api/invoices | Create Invoice |
| PUT | /api/invoices/{id} | Update Invoice |
| DELETE | /api/invoices/{id} | Delete Invoice |
| GET | /api/payments | List Payment |
| GET | /api/payments/{id} | Get one Payment |
| POST | /api/payments | Create Payment |
| PUT | /api/payments/{id} | Update Payment |
| DELETE | /api/payments/{id} | Delete Payment |

Errors: 400 validation, 404 not found, 409 integrity violation (duplicate / still referenced).

## Example
POST /api/payments
```
{ "method": ..., "amount": ..., "paidAt": ..., "invoice": { "id": 1 } }
```

## Structure
```
com.awd.paiement
├── config       CorsConfig, OpenApiConfig, ApiExceptionHandler
├── controller   InvoiceController, PaymentController
├── entity       Invoice, Payment (JPA)
├── repository   Spring Data JPA repositories
└── service      InvoiceService, PaymentService
```
