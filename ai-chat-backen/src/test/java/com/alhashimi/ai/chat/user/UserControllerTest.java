package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.role.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.aot.DisabledInAotMode;
import org.springframework.web.client.RestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
@DisabledInAotMode
class UserControllerTest {

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

    // Cookie values for different roles
    private String adminCookie;
    private String userCookie;
    private UUID adminUserId;
    private UUID regularUserId;

    /**
     * Extract the auth_token value from a Set-Cookie header.
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

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        restClient = RestClient.builder()
                .baseUrl("http://localhost:" + port)
                .defaultStatusHandler(HttpStatusCode::isError, (request, response) -> {
                    // suppress error so we can inspect the response
                })
                .build();

        // Create an admin user
        User adminUser = userRepository.save(User.builder()
                .username("admin")
                .email("admin@example.com")
                .password(passwordEncoder.encode("Admin1234"))
                .role(Role.ADMIN)
                .enabled(true)
                .forcePasswordChange(false)
                .build());
        adminUserId = adminUser.getId();

        // Login as admin — get cookie
        ResponseEntity<Map> adminLoginResponse = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("username", "admin", "password", "Admin1234"))
                .retrieve()
                .toEntity(Map.class);
        List<String> adminCookieHeaders = adminLoginResponse.getHeaders().get("Set-Cookie");
        assertThat(adminCookieHeaders).isNotNull().isNotEmpty();
        adminCookie = "auth_token=" + extractTokenFromCookie(adminCookieHeaders.get(0));

        // Create a regular user
        User regularUser = userRepository.save(User.builder()
                .username("regularuser")
                .email("regular@example.com")
                .password(passwordEncoder.encode("Regular1234"))
                .role(Role.USER)
                .enabled(true)
                .forcePasswordChange(false)
                .build());
        regularUserId = regularUser.getId();

        ResponseEntity<Map> userLoginResponse = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("username", "regularuser", "password", "Regular1234"))
                .retrieve()
                .toEntity(Map.class);
        List<String> userCookieHeaders = userLoginResponse.getHeaders().get("Set-Cookie");
        assertThat(userCookieHeaders).isNotNull().isNotEmpty();
        userCookie = "auth_token=" + extractTokenFromCookie(userCookieHeaders.get(0));
    }

    @Test
    void createUser_asAdmin_returns201() {
        Map<String, Object> request = Map.of(
                "username", "newuser",
                "email", "newuser@example.com",
                "temporaryPassword", "TempPass1",
                "role", "USER"
        );

        ResponseEntity<Map> response = restClient.post()
                .uri("/api/users")
                .header("Cookie", adminCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toEntity(Map.class);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("username")).isEqualTo("newuser");
        assertThat(response.getBody().get("email")).isEqualTo("newuser@example.com");
    }

    @Test
    void createUser_asUser_returns403() {
        Map<String, Object> request = Map.of(
                "username", "anotheruser",
                "email", "another@example.com",
                "temporaryPassword", "TempPass1",
                "role", "USER"
        );

        ResponseEntity<Map> response = restClient.post()
                .uri("/api/users")
                .header("Cookie", userCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toEntity(Map.class);

        assertThat(response.getStatusCode().value()).isEqualTo(403);
    }

    @Test
    void listUsers_asAdmin_returns200WithUserPage() {
        ResponseEntity<Map> response = restClient.get()
                .uri("/api/users?page=0&size=20")
                .header("Cookie", adminCookie)
                .retrieve()
                .toEntity(Map.class);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).containsKey("content");
        assertThat(((java.util.List<?>) response.getBody().get("content"))).isNotNull();
        assertThat(response.getBody()).containsKey("totalElements");
        assertThat(response.getBody()).containsKey("totalPages");
        assertThat(response.getBody()).containsKey("size");
        assertThat(response.getBody()).containsKey("number");
    }

    @Test
    void getUser_asAdmin_returns200() {
        ResponseEntity<Map> response = restClient.get()
                .uri("/api/users/" + adminUserId)
                .header("Cookie", adminCookie)
                .retrieve()
                .toEntity(Map.class);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("id")).isEqualTo(adminUserId.toString());
        assertThat(response.getBody().get("username")).isEqualTo("admin");
    }

    @Test
    void deleteUser_asAdmin_returns204() {
        // Create a user to delete
        User userToDelete = userRepository.save(User.builder()
                .username("todelete")
                .email("todelete@example.com")
                .password(passwordEncoder.encode("TempPass1"))
                .role(Role.USER)
                .enabled(true)
                .forcePasswordChange(false)
                .build());

        ResponseEntity<Void> response = restClient.delete()
                .uri("/api/users/" + userToDelete.getId())
                .header("Cookie", adminCookie)
                .retrieve()
                .toEntity(Void.class);

        assertThat(response.getStatusCode().value()).isEqualTo(204);
    }

    @Test
    void getUser_asSelf_returns200() {
        // A regular user should be able to read their own profile
        ResponseEntity<Map> response = restClient.get()
                .uri("/api/users/" + regularUserId)
                .header("Cookie", userCookie)
                .retrieve()
                .toEntity(Map.class);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("id")).isEqualTo(regularUserId.toString());
        assertThat(response.getBody().get("username")).isEqualTo("regularuser");
    }

    @Test
    void getUser_asRegularUser_accessingOtherUser_returns403() {
        // A regular user must NOT be able to read another user's profile
        ResponseEntity<Map> response = restClient.get()
                .uri("/api/users/" + adminUserId)
                .header("Cookie", userCookie)
                .retrieve()
                .toEntity(Map.class);

        assertThat(response.getStatusCode().value()).isEqualTo(403);
    }
}
