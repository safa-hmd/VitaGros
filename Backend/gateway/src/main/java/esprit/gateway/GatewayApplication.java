package esprit.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.GatewayFilterSpec;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableDiscoveryClient
public class GatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }

    // CORS est géré par le gateway : on retire les doublons renvoyés par les services
    private GatewayFilterSpec dedupeCors(GatewayFilterSpec f) {
        return f.dedupeResponseHeader(
                "Access-Control-Allow-Origin Access-Control-Allow-Credentials", "RETAIN_FIRST");
    }

    @Bean
    public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth", r -> r.path("/api/auth/**")
                        .filters(this::dedupeCors).uri("lb://USER"))
                .route("user", r -> r.path("/api/users/**", "/api/roles/**")
                        .filters(this::dedupeCors).uri("lb://USER"))
                .route("produit", r -> r.path("/api/products/**", "/api/categories/**")
                        .filters(this::dedupeCors).uri("lb://PRODUIT"))
                .route("commande", r -> r.path("/api/orders/**", "/api/order-lines/**")
                        .filters(this::dedupeCors).uri("lb://COMMANDE"))
                .route("paiement", r -> r.path("/api/payments/**", "/api/invoices/**")
                        .filters(this::dedupeCors).uri("lb://PAIEMENT"))
                .route("livraison", r -> r.path("/api/carriers/**", "/api/deliveries/**")
                        .filters(this::dedupeCors).uri("lb://LIVRAISON"))
                .route("recommandation", r -> r.path("/api/recommendations/**")
                        .filters(this::dedupeCors).uri("lb://RECOMMANDATION"))
                .build();
    }
}