# produit microservice

Spring Boot 3.5.6 / Java 17 service exposing a REST API for Product and Category (one-to-many: product.category_id -> category.id), with MySQL and Swagger.

## Run
```
mvn spring-boot:run
```
- Port: http://localhost:8082
- Swagger UI: http://localhost:8082/swagger-ui.html
- OpenAPI JSON: http://localhost:8082/v3/api-docs
- Database: `produit_db` (MySQL, created automatically, user root / empty password, see application.properties)
- Registers itself in Eureka (http://localhost:8761), start Eureka first.

## Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/categories | List Category |
| GET | /api/categories/{id} | Get one Category |
| POST | /api/categories | Create Category |
| PUT | /api/categories/{id} | Update Category |
| DELETE | /api/categories/{id} | Delete Category |
| GET | /api/products | List Product |
| GET | /api/products/{id} | Get one Product |
| POST | /api/products | Create Product |
| PUT | /api/products/{id} | Update Product |
| DELETE | /api/products/{id} | Delete Product |

Errors: 400 validation, 404 not found, 409 integrity violation (duplicate / still referenced).

## Example
POST /api/products
```
{ "name": ..., "price": ..., "stock": ..., "category": { "id": 1 } }
```

## Structure
```
com.awd.produit
├── config       CorsConfig, OpenApiConfig, ApiExceptionHandler
├── controller   CategoryController, ProductController
├── entity       Category, Product (JPA)
├── repository   Spring Data JPA repositories
└── service      CategoryService, ProductService
```
