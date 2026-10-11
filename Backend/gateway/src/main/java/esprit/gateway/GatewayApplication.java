package esprit.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableDiscoveryClient
public class GatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }

    // URL du microservice Python (non enregistré dans Eureka)
    @Value("${recommandation.url:http://localhost:5000}")
    private String recommandationUrl;

    @Bean
    public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
        return builder.routes()

                // ===== Nouveaux microservices (Eureka) =====
                .route("user", r -> r.path("/api/users/**", "/api/roles/**")
                        .uri("lb://USER"))
                .route("produit", r -> r.path("/api/products/**", "/api/categories/**")
                        .uri("lb://PRODUIT"))
                .route("commande", r -> r.path("/api/orders/**", "/api/order-lines/**")
                        .uri("lb://COMMANDE"))
                .route("paiement", r -> r.path("/api/payments/**", "/api/invoices/**")
                        .uri("lb://PAIEMENT"))
                .route("livraison", r -> r.path("/api/carriers/**", "/api/deliveries/**")
                        .uri("lb://LIVRAISON"))

                // ===== Recommandation (Python / FastAPI) =====
                .route("recommandation", r -> r.path("/api/recommendations/**")
                        .filters(f -> f.dedupeResponseHeader(
                                "Access-Control-Allow-Origin Access-Control-Allow-Credentials",
                                "RETAIN_FIRST"))
                        .uri(recommandationUrl))

                .build();
    }
}