# Projet AWD - Spring Boot 17 / Angular 18 / MySQL (microservices e-commerce)

```
Projet
├── Backend
│   ├── Eureka                  (8761)  discovery server
│   └── Microservices
│       ├── user        (8081)  User --n:1--> Role   db: user_db
│       ├── produit     (8082)  Product --n:1--> Category   db: produit_db
│       ├── commande    (8083)  OrderLine --n:1--> CustomerOrder   db: commande_db
│       ├── paiement    (8084)  Payment --n:1--> Invoice   db: paiement_db
│       ├── livraison   (8085)  Delivery --n:1--> Carrier   db: livraison_db
└── Frontend                (4200)  Angular 18 (CRUD des 10 tables)
```
Chaque microservice : sa propre base MySQL (database per service), son port et sa config dans
`src/main/resources/application.properties`, Swagger sur `http://localhost:<port>/swagger-ui.html`.
Les liens entre microservices se font par id (ex: `userId`, `orderId`, `productId`), sans FK entre bases.

## Prerequis
JDK 17, Maven, Node 18.19+ / 20, MySQL sur localhost:3306 (user `root`, mot de passe vide : modifier `application.properties` sinon).

## Lancement (dans cet ordre)
```
cd Backend/Eureka && mvn spring-boot:run
cd Backend/Microservices/user && mvn spring-boot:run       # idem pour les 4 autres
cd Frontend && npm install && npm start                    # http://localhost:4200
```
Ordre de saisie conseille : creer d'abord les parents (Role, Category, CustomerOrder, Invoice, Carrier), puis les enfants.
