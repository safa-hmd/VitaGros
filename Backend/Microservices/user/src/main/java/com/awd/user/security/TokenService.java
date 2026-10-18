package com.awd.user.security;

import com.awd.user.entity.User;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Jetons signés HMAC-SHA256, sans dépendance externe.
 * Format : base64url(payload) + "." + base64url(signature), payload = "id|ROLE|expiration(epoch s)".
 */
@Service
public class TokenService {

    private static final Base64.Encoder ENC = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DEC = Base64.getUrlDecoder();

    private final byte[] secret;
    private final long ttlSeconds;

    public TokenService(@Value("${app.jwt.secret}") String secret,
                        @Value("${app.jwt.ttl-seconds:86400}") long ttlSeconds) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("app.jwt.secret doit contenir au moins 32 caractères");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.ttlSeconds = ttlSeconds;
    }

    public String issue(User user) {
        long expiresAt = Instant.now().getEpochSecond() + ttlSeconds;
        String payload = user.getId() + "|" + user.getRole().name() + "|" + expiresAt;
        String body = ENC.encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return body + "." + sign(body);
    }

    /** Vérifie la signature et l'expiration (utilisable par le gateway ou d'autres services). */
    public boolean isValid(String token) {
        if (token == null) return false;
        String[] parts = token.split("\\.");
        if (parts.length != 2) return false;
        if (!MessageDigest.isEqual(sign(parts[0]).getBytes(StandardCharsets.UTF_8),
                parts[1].getBytes(StandardCharsets.UTF_8))) {
            return false;
        }
        try {
            String[] fields = new String(DEC.decode(parts[0]), StandardCharsets.UTF_8).split("\\|");
            return fields.length == 3 && Long.parseLong(fields[2]) > Instant.now().getEpochSecond();
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private String sign(String body) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return ENC.encodeToString(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Signature HMAC indisponible", e);
        }
    }
}
