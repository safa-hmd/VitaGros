package esprit.gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.util.pattern.PathPatternParser;

/**
 * Configuration class responsible for handling CORS (Cross-Origin Resource Sharing)
 *
 * Why do we need CORS?
 * ---------------------
 * When a frontend application (e.g., Angular running on localhost:4200)
 * tries to call a backend API (e.g., Gateway running on localhost:8080),
 * the browser blocks the request by default because they have different origins.
 *
 * CORS configuration allows us to explicitly authorize these cross-origin requests.
 *
 * In a microservices/SOA architecture, the Gateway is often accessed by:
 *  - Web clients (Angular/React)
 *  - Mobile applications
 *  - External systems
 *
 * Therefore, CORS must be configured properly.
 */
@Configuration // Marks this class as a Spring configuration class
public class CorsConfig {

    /**
     * Creates and registers a CorsWebFilter bean.
     *
     * @return CorsWebFilter configured with allowed origins, methods, headers, etc.
     */
    @Bean
    public CorsWebFilter corsWebFilter() {

        // Object that holds all CORS rules
        CorsConfiguration corsConfig = new CorsConfiguration();

        /*
         * Allowed Origins:
         * Defines which frontend domains are allowed to call this API.
         *
         * Here we allow Angular default development server:
         * http://localhost:4200
         *
         * In production, this should be replaced with the real frontend domain.
         */
        corsConfig.setAllowedOrigins(
                java.util.Arrays.asList("http://localhost:4200")
        );

        /*
         * Allowed HTTP Methods:
         * Specifies which HTTP methods are accepted in cross-origin requests.
         *
         * GET      -> Retrieve data
         * POST     -> Create data
         * PUT      -> Update data
         * DELETE   -> Remove data
         * PATCH    -> Partial update
         * OPTIONS  -> Preflight request (sent automatically by browser)
         */
        corsConfig.setAllowedMethods(
                java.util.Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
        );

        /*
         * Allowed Headers:
         * Defines which headers can be sent in the request.
         *
         * "*" means all headers are allowed (Authorization, Content-Type, etc.)
         */
        corsConfig.setAllowedHeaders(
                java.util.Arrays.asList("*")
        );

        /*
         * Allow Credentials:
         * If true -> allows cookies, authorization headers, etc.
         * If false -> credentials are not included.
         *
         * NOTE:
         * If set to true, you cannot use "*" as allowed origin.
         */
        corsConfig.setAllowCredentials(false);

        /*
         * Max Age:
         * Duration (in seconds) that the browser can cache
         * the CORS preflight response.
         *
         * 3600 seconds = 1 hour
         *
         * This improves performance by reducing preflight requests.
         */
        corsConfig.setMaxAge(3600L);

        /*
         * This source maps CORS configuration to URL patterns.
         *
         * PathPatternParser is used in Spring WebFlux for path matching.
         */
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource(new PathPatternParser());

        /*
         * Apply this CORS configuration to ALL endpoints:
         * "/**" means every route exposed by the Gateway.
         */
        source.registerCorsConfiguration("/**", corsConfig);

        /*
         * Return the CorsWebFilter that will intercept requests
         * and apply the CORS rules before reaching the services.
         */
        return new CorsWebFilter(source);
    }
}
