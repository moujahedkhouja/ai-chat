package com.alhashimi.ai.chat.auth;

import com.alhashimi.ai.chat.role.Role;
import com.alhashimi.ai.chat.user.User;
import com.alhashimi.ai.chat.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.aot.DisabledInAotMode;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.client.RestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
@DisabledInAotMode
class AuthControllerTest {

    @Container
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("jwt.secret", () -> Base64.getEncoder().encodeToString(new byte[32]));
    }

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private RestClient restClient;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        restClient = RestClient.builder()
                .baseUrl("http://localhost:" + port)
                .defaultStatusHandler(HttpStatusCode::isError, (request, response) -> {
                    // suppress error so we can inspect the response
                })
                .build();
    }

    // -----------------------------------------------------------------------
    // Helper
    // -----------------------------------------------------------------------

    private User createUser(String username, String rawPassword, boolean enabled, boolean forcePasswordChange) {
        return userRepository.save(User.builder()
                .username(username)
                .email(username + "@example.com")
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.USER)
                .enabled(enabled)
                .forcePasswordChange(forcePasswordChange)
                .build());
    }

    /**
     * Extract the auth_token cookie value from a Set-Cookie header value.
     */
    private String extractTokenFromCookie(String setCookieHeader) {
        for (String part : setCookieHeader.split(";")) {
            String trimmed = part.trim();
            if (trimmed.startsWith("auth_token=")) {
                return trimmed.substring("auth_token=".length());
            }
        }
        return null;
    }

    // -----------------------------------------------------------------------
    // Tests
    // -----------------------------------------------------------------------

    @Test
    void login_withValidCredentials_setsAuthCookieAndReturnsUserInfo() {
        createUser("alice", "secret123", true, false);

        ResponseEntity<AuthResponse> response = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LoginRequest("alice", "secret123"))
                .retrieve()
                .toEntity(AuthResponse.class);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().username()).isEqualTo("alice");
        assertThat(response.getBody().role()).isEqualTo("USER");
        assertThat(response.getBody().userId()).isNotBlank();
        assertThat(response.getBody().forcePasswordChange()).isFalse();

        List<String> setCookieHeaders = response.getHeaders().get("Set-Cookie");
        assertThat(setCookieHeaders).isNotNull().isNotEmpty();
        String setCookieHeader = setCookieHeaders.get(0);
        assertThat(setCookieHeader).contains("auth_token=");
        assertThat(setCookieHeader).containsIgnoringCase("HttpOnly");
    }

    @Test
    void login_withWrongPassword_returns401() {
        createUser("bob", "correctPassword", true, false);

        ResponseEntity<Map<String, String>> response = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LoginRequest("bob", "wrongPassword"))
                .retrieve()
                .toEntity(new ParameterizedTypeReference<Map<String, String>>() {});

        assertThat(response.getStatusCode().value()).isEqualTo(401);
        assertThat(response.getBody()).containsEntry("error", "Invalid username or password");
    }

    @Test
    void login_withDisabledUser_returns401() {
        createUser("charlie", "password123", false, false);

        ResponseEntity<Map<String, String>> response = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LoginRequest("charlie", "password123"))
                .retrieve()
                .toEntity(new ParameterizedTypeReference<Map<String, String>>() {});

        assertThat(response.getStatusCode().value()).isEqualTo(401);
        assertThat(response.getBody()).containsEntry("error", "Invalid username or password");
    }

    @Test
    void changePassword_withValidCookie_updatesPasswordAndSetsNewCookie() {
        // 1. Create a user with forcePasswordChange = true
        createUser("diana", "oldPassword1", true, true);

        // 2. Login to get the auth cookie
        ResponseEntity<AuthResponse> loginResponse = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LoginRequest("diana", "oldPassword1"))
                .retrieve()
                .toEntity(AuthResponse.class);

        assertThat(loginResponse.getStatusCode().value()).isEqualTo(200);
        List<String> setCookieHeaders = loginResponse.getHeaders().get("Set-Cookie");
        assertThat(setCookieHeaders).isNotNull().isNotEmpty();
        String authCookieHeader = setCookieHeaders.get(0);
        String tokenValue = extractTokenFromCookie(authCookieHeader);
        assertThat(tokenValue).isNotBlank();

        // 3. Change password using the cookie
        ResponseEntity<AuthResponse> changeResponse = restClient.post()
                .uri("/api/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Cookie", "auth_token=" + tokenValue)
                .body(new ChangePasswordRequest("oldPassword1", "newPassword1"))
                .retrieve()
                .toEntity(AuthResponse.class);

        assertThat(changeResponse.getStatusCode().value()).isEqualTo(200);
        assertThat(changeResponse.getBody()).isNotNull();
        assertThat(changeResponse.getBody().forcePasswordChange()).isFalse();

        List<String> changeCookieHeaders = changeResponse.getHeaders().get("Set-Cookie");
        assertThat(changeCookieHeaders).isNotNull().isNotEmpty();
        assertThat(changeCookieHeaders.get(0)).contains("auth_token=");
    }

    @Test
    void changePassword_withWrongCurrentPassword_returns400() {
        // Create a user and login to get a cookie
        createUser("testuser2", "password123", true, false);

        ResponseEntity<AuthResponse> loginResponse = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LoginRequest("testuser2", "password123"))
                .retrieve()
                .toEntity(AuthResponse.class);

        assertThat(loginResponse.getStatusCode().value()).isEqualTo(200);
        List<String> setCookieHeaders = loginResponse.getHeaders().get("Set-Cookie");
        assertThat(setCookieHeaders).isNotNull().isNotEmpty();
        String tokenValue = extractTokenFromCookie(setCookieHeaders.get(0));

        // Try change-password with wrong current password
        ResponseEntity<Map<String, String>> response = restClient.post()
                .uri("/api/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Cookie", "auth_token=" + tokenValue)
                .body(new ChangePasswordRequest("wrongpassword", "newpassword123"))
                .retrieve()
                .toEntity(new ParameterizedTypeReference<Map<String, String>>() {});

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).containsEntry("error", "Current password is incorrect");
    }

    @Test
    void login_withForcePasswordChangeUser_returnsForcePasswordChangeTrue() {
        createUser("evan", "password123", true, true); // forcePasswordChange = true

        ResponseEntity<AuthResponse> response = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LoginRequest("evan", "password123"))
                .retrieve()
                .toEntity(AuthResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(org.springframework.http.HttpStatus.OK);
        assertThat(response.getBody().forcePasswordChange()).isTrue();
    }

    @Test
    void logout_clearsCookie() {
        ResponseEntity<Void> response = restClient.post()
                .uri("/api/auth/logout")
                .retrieve()
                .toEntity(Void.class);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        List<String> setCookieHeaders = response.getHeaders().get("Set-Cookie");
        assertThat(setCookieHeaders).isNotNull().isNotEmpty();
        String setCookieHeader = setCookieHeaders.get(0);
        assertThat(setCookieHeader).contains("auth_token=");
        assertThat(setCookieHeader).containsIgnoringCase("Max-Age=0");
    }

    @Test
    void me_withValidCookie_returnsUserInfo() {
        createUser("frank", "password123", true, false);

        // Login to get cookie
        ResponseEntity<AuthResponse> loginResponse = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LoginRequest("frank", "password123"))
                .retrieve()
                .toEntity(AuthResponse.class);

        assertThat(loginResponse.getStatusCode().value()).isEqualTo(200);
        List<String> setCookieHeaders = loginResponse.getHeaders().get("Set-Cookie");
        assertThat(setCookieHeaders).isNotNull().isNotEmpty();
        String tokenValue = extractTokenFromCookie(setCookieHeaders.get(0));

        // Call /api/auth/me with the cookie
        ResponseEntity<AuthResponse> meResponse = restClient.get()
                .uri("/api/auth/me")
                .header("Cookie", "auth_token=" + tokenValue)
                .retrieve()
                .toEntity(AuthResponse.class);

        assertThat(meResponse.getStatusCode().value()).isEqualTo(200);
        assertThat(meResponse.getBody()).isNotNull();
        assertThat(meResponse.getBody().username()).isEqualTo("frank");
        assertThat(meResponse.getBody().role()).isEqualTo("USER");
        assertThat(meResponse.getBody().forcePasswordChange()).isFalse();
    }

    @Test
    void me_withoutCookie_returnsUnauthorized() {
        ResponseEntity<Map<String, String>> response = restClient.get()
                .uri("/api/auth/me")
                .retrieve()
                .toEntity(new ParameterizedTypeReference<Map<String, String>>() {});

        // Spring Security returns 403 for unauthenticated access to authenticated endpoints in stateless mode
        assertThat(response.getStatusCode().value()).isIn(401, 403);
    }
}
