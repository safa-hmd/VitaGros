# commande microservice

Spring Boot 3.5.6 / Java 17 service exposing a REST API for OrderLine and CustomerOrder (one-to-many: order_line.customerOrder_id -> customer_order.id), with MySQL and Swagger.

## Run
```
mvn spring-boot:run
```
- Port: http://localhost:8083
- Swagger UI: http://localhost:8083/swagger-ui.html
- OpenAPI JSON: http://localhost:8083/v3/api-docs
- Database: `commande_db` (MySQL, created automatically, user root / empty password, see application.properties)
- Registers itself in Eureka (http://localhost:8761), start Eureka first.

## Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/orders | List CustomerOrder |
| GET | /api/orders/{id} | Get one CustomerOrder |
| POST | /api/orders | Create CustomerOrder |
| PUT | /api/orders/{id} | Update CustomerOrder |
| DELETE | /api/orders/{id} | Delete CustomerOrder |
| GET | /api/order-lines | List OrderLine |
| GET | /api/order-lines/{id} | Get one OrderLine |
| POST | /api/order-lines | Create OrderLine |
| PUT | /api/order-lines/{id} | Update OrderLine |
| DELETE | /api/order-lines/{id} | Delete OrderLine |

Errors: 400 validation, 404 not found, 409 integrity violation (duplicate / still referenced).

## Example
POST /api/order-lines
```
{ "productId": ..., "quantity": ..., "unitPrice": ..., "customerOrder": { "id": 1 } }
```

## Structure
```
com.awd.commande
├── config       CorsConfig, OpenApiConfig, ApiExceptionHandler
├── controller   CustomerOrderController, OrderLineController
├── entity       CustomerOrder, OrderLine (JPA)
├── repository   Spring Data JPA repositories
└── service      CustomerOrderService, OrderLineService
```
