package com.alhashimi.ai.chat.auth;

import com.alhashimi.ai.chat.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.Objects;
import java.util.UUID;

@Service
public class TokenService {

    private static final String CLAIM_USERNAME = "username";
    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_FORCE_PASSWORD_CHANGE = "forcePasswordChange";

    private final SecretKey signingKey;
    private final long expirationMs;

    public TokenService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long expirationMs) {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        Objects.requireNonNull(user.getId(), "User must be persisted before generating a token");
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim(CLAIM_USERNAME, user.getUsername())
                .claim(CLAIM_ROLE, user.getRole().name())
                .claim(CLAIM_FORCE_PASSWORD_CHANGE, user.isForcePasswordChange())
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(signingKey)
                .compact();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public String extractUsername(String token) {
        return parseClaims(token).get(CLAIM_USERNAME, String.class);
    }

    public String extractRole(String token) {
        return parseClaims(token).get(CLAIM_ROLE, String.class);
    }

    public boolean extractForcePasswordChange(String token) {
        return parseClaims(token).get(CLAIM_FORCE_PASSWORD_CHANGE, Boolean.class);
    }

    public TokenClaims extractAll(String token) {
        var claims = parseClaims(token);
        return new TokenClaims(
                UUID.fromString(claims.getSubject()),
                claims.get(CLAIM_USERNAME, String.class),
                claims.get(CLAIM_ROLE, String.class),
                claims.get(CLAIM_FORCE_PASSWORD_CHANGE, Boolean.class)
        );
    }

    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (io.jsonwebtoken.JwtException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
