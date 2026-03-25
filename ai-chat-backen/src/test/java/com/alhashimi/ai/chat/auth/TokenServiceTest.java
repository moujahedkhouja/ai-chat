package com.alhashimi.ai.chat.auth;

import com.alhashimi.ai.chat.role.Role;
import com.alhashimi.ai.chat.user.User;
import com.alhashimi.ai.chat.auth.TokenClaims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Base64;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class TokenServiceTest {

    private static final String TEST_SECRET =
            Base64.getEncoder().encodeToString(new byte[32]); // 256-bit key

    private static final long EXPIRATION_MS = 60_000L; // 1 minute

    private TokenService tokenService;
    private User testUser;

    @BeforeEach
    void setUp() {
        tokenService = new TokenService(TEST_SECRET, EXPIRATION_MS);

        testUser = User.builder()
                .username("john")
                .email("john@example.com")
                .password("hashed")
                .role(Role.ADMIN)
                .forcePasswordChange(false)
                .build();
        testUser.setId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
    }

    @Test
    void generateToken_containsCorrectSubjectClaim() {
        String token = tokenService.generateToken(testUser);
        String subject = tokenService.extractUserId(token).toString();
        assertThat(subject).isEqualTo(testUser.getId().toString());
    }

    @Test
    void generateToken_containsUsernameClaim() {
        String token = tokenService.generateToken(testUser);
        assertThat(tokenService.extractUsername(token)).isEqualTo("john");
    }

    @Test
    void generateToken_containsRoleClaim() {
        String token = tokenService.generateToken(testUser);
        assertThat(tokenService.extractRole(token)).isEqualTo("ADMIN");
    }

    @Test
    void generateToken_containsForcePasswordChangeClaim() {
        String token = tokenService.generateToken(testUser);
        assertThat(tokenService.extractForcePasswordChange(token)).isFalse();
    }

    @Test
    void isTokenValid_returnsTrueForValidToken() {
        String token = tokenService.generateToken(testUser);
        assertThat(tokenService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_returnsFalseForExpiredToken() {
        TokenService expiredTokenService = new TokenService(TEST_SECRET, -1000L);
        String token = expiredTokenService.generateToken(testUser);
        assertThat(expiredTokenService.isTokenValid(token)).isFalse();
    }

    @Test
    void extractAll_returnsAllClaims() {
        String token = tokenService.generateToken(testUser);

        TokenClaims claims = tokenService.extractAll(token);

        assertThat(claims.userId()).isEqualTo(testUser.getId());
        assertThat(claims.username()).isEqualTo("john");
        assertThat(claims.role()).isEqualTo("ADMIN");
        assertThat(claims.forcePasswordChange()).isFalse();
    }

    @Test
    void isTokenValid_returnsFalseForTamperedToken() {
        // Create a service with different key bytes (all 0x01 instead of 0x00)
        byte[] differentKeyBytes = new byte[32];
        Arrays.fill(differentKeyBytes, (byte) 0x01);
        TokenService otherService = new TokenService(
                Base64.getEncoder().encodeToString(differentKeyBytes),
                EXPIRATION_MS
        );
        String token = tokenService.generateToken(testUser);
        // Token issued by tokenService should not be valid for otherService
        assertThat(otherService.isTokenValid(token)).isFalse();
    }
}
