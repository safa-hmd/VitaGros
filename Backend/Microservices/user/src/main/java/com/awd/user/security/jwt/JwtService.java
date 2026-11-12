package com.awd.user.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Seule implémentation JWT du service (jjwt, HS256).
 * Utilisée à la fois pour GÉNÉRER le token (AuthController) et pour le VÉRIFIER (JwtAuthenticationFilter).
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final JwtParser parser;
    private final long ttlSeconds;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.ttl-seconds:86400}") long ttlSeconds) {
        byte[] bytes = secret == null ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret doit contenir au moins 32 caractères (variable JWT_SECRET)");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.parser = Jwts.parser().verifyWith(key).build();
        this.ttlSeconds = ttlSeconds;
    }

    public String generateToken(String email, String role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + ttlSeconds * 1000))
                .signWith(key)
                .compact();
    }

    public String extractEmail(String token) {
        return parse(token).getSubject();
    }

    public String extractRole(String token) {
        return parse(token).get("role", String.class);
    }

    /** Signature + expiration + format : toute erreur => false. */
    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parse(String token) {
        return parser.parseSignedClaims(token).getPayload();
    }
}
