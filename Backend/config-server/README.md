# Config Server (VitaGros)

Serveur de configuration centralisee (Spring Cloud Config) qui sert la configuration
de tous les microservices depuis `src/main/resources/config/`.

## Lancer en local

1. Demarrer **Eureka** (port 8761) en premier.
2. Lancer `ConfigServerApplication` (port 8888), ou :
   ```
   mvn spring-boot:run
   ```
3. Verifier : http://localhost:8888/commande/default  (doit renvoyer le JSON de la config)

## Fichiers de config

| Fichier                         | Service           | Port |
|---------------------------------|-------------------|------|
| application.properties          | commun a tous     | -    |
| gateway.properties              | gateway           | 8089 |
| user.properties                 | USER              | 8081 |
| produit.properties              | PRODUIT           | 8082 |
| commande.properties             | COMMANDE          | 8083 |
| paiement.properties             | PAIEMENT          | 8084 |
| livraison.properties            | LIVRAISON         | 8085 |

Le nom du fichier doit etre egal a `spring.application.name` du service.

## Brancher un microservice sur le Config Server

Dans le `pom.xml` du service, ajouter :
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-config</artifactId>
</dependency>
```

Dans son `application.properties`, ne garder que :
```properties
spring.application.name=commande
spring.config.import=optional:configserver:http://localhost:8888
```

Les autres proprietes viennent de `src/main/resources/config/`. Pour modifier une config, editer le fichier
dans ce dossier, relancer le config server, puis redemarrer le service concerne.

## Docker

```
mvn clean package -DskipTests
docker build -t config-server .
docker run -p 8888:8888 config-server
```

## Passage en production (plus tard)

Remplacer le backend `native` par un depot Git (`spring.cloud.config.server.git.uri`)
et proteger le serveur avec Spring Security (utilisateur/mot de passe).
