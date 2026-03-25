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

    // -----------------------------------------------------------------------
    // Tests
    // -----------------------------------------------------------------------

    @Test
    void login_withValidCredentials_returnsToken() {
        createUser("alice", "secret123", true, false);

        ResponseEntity<AuthResponse> response = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LoginRequest("alice", "secret123"))
                .retrieve()
                .toEntity(AuthResponse.class);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().token()).isNotBlank();
        assertThat(response.getBody().forcePasswordChange()).isFalse();
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
    void changePassword_withValidToken_updatesPasswordAndReturnsNewToken() {
        // 1. Create a user with forcePasswordChange = true
        createUser("diana", "oldPassword1", true, true);

        // 2. Login to get the token
        ResponseEntity<AuthResponse> loginResponse = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LoginRequest("diana", "oldPassword1"))
                .retrieve()
                .toEntity(AuthResponse.class);

        assertThat(loginResponse.getStatusCode().value()).isEqualTo(200);
        String token = loginResponse.getBody().token();
        assertThat(token).isNotBlank();

        // 3. Change password using the token
        ResponseEntity<AuthResponse> changeResponse = restClient.post()
                .uri("/api/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .body(new ChangePasswordRequest("oldPassword1", "newPassword1"))
                .retrieve()
                .toEntity(AuthResponse.class);

        assertThat(changeResponse.getStatusCode().value()).isEqualTo(200);
        assertThat(changeResponse.getBody()).isNotNull();
        assertThat(changeResponse.getBody().token()).isNotBlank();
        assertThat(changeResponse.getBody().forcePasswordChange()).isFalse();
    }

    @Test
    void changePassword_withWrongCurrentPassword_returns400() {
        // Create a user and login to get a token
        createUser("testuser2", "password123", true, false);

        // Login to get token
        ResponseEntity<AuthResponse> loginResponse = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LoginRequest("testuser2", "password123"))
                .retrieve()
                .toEntity(AuthResponse.class);

        assertThat(loginResponse.getStatusCode().value()).isEqualTo(200);
        String token = loginResponse.getBody().token();

        // Try change-password with wrong current password
        ResponseEntity<Map<String, String>> response = restClient.post()
                .uri("/api/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
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
}
