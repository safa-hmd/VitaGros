package esprit.gateway;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Point d'entrée unique de la sécurité : vérifie le JWT émis par le service USER
 * (même secret : variable JWT_SECRET) avant de router vers les microservices.
 *
 * Règles (modifiables dans isPublic / requiresAdmin) :
 *  - PUBLIC        : /api/auth/** et la lecture (GET) du catalogue /api/products, /api/categories
 *  - ADMIN         : écriture (POST/PUT/PATCH/DELETE) sur products, categories, carriers
 *  - AUTHENTIFIÉ   : tout le reste (users, orders, payments, invoices, deliveries, recommendations...)
 */
@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private static final String X_USER_EMAIL = "X-User-Email";
    private static final String X_USER_ROLE = "X-User-Role";

    private final JwtParser parser;

    public JwtAuthFilter(@Value("${app.jwt.secret}") String secret) {
        byte[] bytes = secret == null ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret doit contenir au moins 32 caractères (variable JWT_SECRET)");
        }
        this.parser = Jwts.parser().verifyWith(Keys.hmacShaKeyFor(bytes)).build();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest req = exchange.getRequest();
        String method = req.getMethod().name();
        String path = req.getURI().getPath();

        // Empêche de contourner les règles avec /api/products/../orders, %2e%2e, ;x= ...
        if (suspicious(req)) {
            return reject(exchange, HttpStatus.BAD_REQUEST);
        }

        // Préflight CORS (déjà géré par CorsWebFilter) et routes publiques
        if (method.equals("OPTIONS") || isPublic(method, path)) {
            return chain.filter(withIdentity(exchange, null, null));
        }

        String header = req.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            return reject(exchange, HttpStatus.UNAUTHORIZED);
        }

        Claims claims;
        try {
            claims = parser.parseSignedClaims(header.substring(7)).getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            return reject(exchange, HttpStatus.UNAUTHORIZED); // signature fausse, expiré, malformé
        }

        String role = claims.get("role", String.class);
        if (requiresAdmin(method, path) && !"ADMIN".equals(role)) {
            return reject(exchange, HttpStatus.FORBIDDEN);
        }

        return chain.filter(withIdentity(exchange, claims.getSubject(), role));
    }

    // ---------- règles d'accès ----------

    private static boolean isPublic(String method, String path) {
        if (under(path, "/api/auth")) return true;
        boolean read = method.equals("GET") || method.equals("HEAD");
        return read && (under(path, "/api/products") || under(path, "/api/categories"));
    }

    private static boolean requiresAdmin(String method, String path) {
        boolean write = !(method.equals("GET") || method.equals("HEAD"));
        return write && (under(path, "/api/products")
                || under(path, "/api/categories")
                || under(path, "/api/carriers"));
    }

    private static boolean under(String path, String prefix) {
        return path.equals(prefix) || path.startsWith(prefix + "/");
    }

    // ---------- utilitaires ----------

    private static boolean suspicious(ServerHttpRequest req) {
        String raw = req.getURI().getRawPath();
        if (raw == null) return false;
        String p = raw.toLowerCase(Locale.ROOT);
        return p.contains("..") || p.contains("%2e") || p.contains("%2f")
                || p.contains("%5c") || p.contains("//") || p.contains(";");
    }

    /**
     * Supprime toute valeur X-User-* envoyée par le client (anti-usurpation) puis,
     * si le token est valide, ajoute celles issues du JWT pour les services en aval.
     */
    private static ServerWebExchange withIdentity(ServerWebExchange exchange, String email, String role) {
        ServerHttpRequest mutated = exchange.getRequest().mutate().headers(h -> {
            h.remove(X_USER_EMAIL);
            h.remove(X_USER_ROLE);
            if (email != null) h.set(X_USER_EMAIL, email);
            if (role != null) h.set(X_USER_ROLE, role);
        }).build();
        return exchange.mutate().request(mutated).build();
    }

    private static Mono<Void> reject(ServerWebExchange exchange, HttpStatus status) {
        exchange.getResponse().setStatusCode(status);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
