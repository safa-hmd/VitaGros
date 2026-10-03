# livraison microservice

Spring Boot 3.5.6 / Java 17 service exposing a REST API for Delivery and Carrier (one-to-many: delivery.carrier_id -> carrier.id), with MySQL and Swagger.

## Run
```
mvn spring-boot:run
```
- Port: http://localhost:8085
- Swagger UI: http://localhost:8085/swagger-ui.html
- OpenAPI JSON: http://localhost:8085/v3/api-docs
- Database: `livraison_db` (MySQL, created automatically, user root / empty password, see application.properties)
- Registers itself in Eureka (http://localhost:8761), start Eureka first.

## Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/carriers | List Carrier |
| GET | /api/carriers/{id} | Get one Carrier |
| POST | /api/carriers | Create Carrier |
| PUT | /api/carriers/{id} | Update Carrier |
| DELETE | /api/carriers/{id} | Delete Carrier |
| GET | /api/deliveries | List Delivery |
| GET | /api/deliveries/{id} | Get one Delivery |
| POST | /api/deliveries | Create Delivery |
| PUT | /api/deliveries/{id} | Update Delivery |
| DELETE | /api/deliveries/{id} | Delete Delivery |

Errors: 400 validation, 404 not found, 409 integrity violation (duplicate / still referenced).

## Example
POST /api/deliveries
```
{ "orderId": ..., "address": ..., "status": ..., "carrier": { "id": 1 } }
```

## Structure
```
com.awd.livraison
├── config       CorsConfig, OpenApiConfig, ApiExceptionHandler
├── controller   CarrierController, DeliveryController
├── entity       Carrier, Delivery (JPA)
├── repository   Spring Data JPA repositories
└── service      CarrierService, DeliveryService
```
