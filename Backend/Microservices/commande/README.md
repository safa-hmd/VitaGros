# commande microservice

Spring Boot 3.5.6 / Java 17 service exposing a REST API for OrderLine and CustomerOrder (one-to-many: order_line.customerOrder_id -> customer_order.id), with MySQL and Swagger. It talks to the **user** and **produit** services through Eureka (see *Relations with other services*).

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

Errors: 400 validation, 404 not found, 409 integrity violation (duplicate / still referenced) or insufficient stock, 503 user/produit service unavailable.

## Relations with other services
| Direction | Service | Call | Why |
|---|---|---|---|
| commande → user | `user` (:8081) | `GET /api/users/{id}` | `POST /api/orders`: the `userId` must exist (404 otherwise). On `PUT`, only checked if `userId` changes. |
| commande → produit | `produit` (:8082) | `GET /api/products/{id}` | `POST/PUT /api/order-lines`: the product must exist; `unitPrice` is taken from the catalogue (value sent by the client is ignored; on `PUT` of the same product the price paid at order time is kept). |
| commande → produit | `produit` (:8082) | `PUT /api/products/{id}` (product with its new `stock`) | Line created: stock −quantity (409 if not enough). Line updated: stock adjusted by the difference. Line deleted: stock given back. |
| paiement → commande | | `GET /api/orders/{id}` | Read the order before creating its invoice and payment |
| livraison → commande | | `GET /api/orders/{id}` | Read the order to deliver (the livraison service does not call it yet) |
| recommandation → commande | | `GET /api/order-lines` | Read purchase history |
| frontend → commande | | `/api/orders`, `/api/order-lines` | The Angular checkout and order screens use these endpoints |

Use Admin → Commandes in the Angular frontend to test the Commande API.

Services are addressed by their Eureka name (`http://user`, `http://produit`) with a load-balanced `RestClient` (3 s connect / 5 s read timeout). Produit has no dedicated stock endpoint, so Commande reads the product and writes it back with the new stock (read-modify-write, serialized inside one commande instance only). There is no distributed transaction: stock is removed first (checked before writing, 409 if insufficient), the line is saved, and the stock is given back if the save fails. If giving stock back fails (e.g. produit down), a warning is logged and the stock must be corrected manually.

Commande does not call paiement, livraison, or recommandation. Its `PUT /api/orders/{id}` is part of the general order CRUD API, not a call made by Commande to another service.

Start order: Eureka, user, produit, then commande.

## Example
POST /api/order-lines
```
{ "productId": 1, "quantity": 2, "customerOrder": { "id": 1 } }
```

## Structure
```
com.awd.commande
├── client       UserClient, ProductClient, ClientErrors (calls to user / produit)
├── config       CorsConfig, OpenApiConfig, HttpConfig, ApiExceptionHandler
├── controller   CustomerOrderController, OrderLineController
├── entity       CustomerOrder, OrderLine (JPA)
├── repository   Spring Data JPA repositories
└── service      CustomerOrderService, OrderLineService
```
