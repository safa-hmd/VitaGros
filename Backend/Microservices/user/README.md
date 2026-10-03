# user microservice

Spring Boot 3.5.6 / Java 17 service exposing a REST API for User and Role (one-to-many: users.role_id -> role.id), with MySQL and Swagger.

## Run
```
mvn spring-boot:run
```
- Port: http://localhost:8081
- Swagger UI: http://localhost:8081/swagger-ui.html
- OpenAPI JSON: http://localhost:8081/v3/api-docs
- Database: `user_db` (MySQL, created automatically, user root / empty password, see application.properties)
- Registers itself in Eureka (http://localhost:8761), start Eureka first.

## Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/roles | List Role |
| GET | /api/roles/{id} | Get one Role |
| POST | /api/roles | Create Role |
| PUT | /api/roles/{id} | Update Role |
| DELETE | /api/roles/{id} | Delete Role |
| GET | /api/users | List User |
| GET | /api/users/{id} | Get one User |
| POST | /api/users | Create User |
| PUT | /api/users/{id} | Update User |
| DELETE | /api/users/{id} | Delete User |

Errors: 400 validation, 404 not found, 409 integrity violation (duplicate / still referenced).

## Example
POST /api/users
```
{ "firstname": ..., "lastname": ..., "email": ..., "password": ..., "role": { "id": 1 } }
```

## Structure
```
com.awd.user
├── config       CorsConfig, OpenApiConfig, ApiExceptionHandler
├── controller   RoleController, UserController
├── entity       Role, User (JPA)
├── repository   Spring Data JPA repositories
└── service      RoleService, UserService
```
