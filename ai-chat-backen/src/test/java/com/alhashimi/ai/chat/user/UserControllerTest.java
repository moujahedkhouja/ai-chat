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

    // Tokens for different roles
    private String adminToken;
    private String userToken;
    private UUID adminUserId;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        restClient = RestClient.builder()
                .baseUrl("http://localhost:" + port)
                .defaultStatusHandler(HttpStatusCode::isError, (request, response) -> {
                    // suppress error so we can inspect the response
                })
                .build();

        // Create an admin user and obtain token
        User adminUser = userRepository.save(User.builder()
                .username("admin")
                .email("admin@example.com")
                .password(passwordEncoder.encode("Admin1234"))
                .role(Role.ADMIN)
                .enabled(true)
                .forcePasswordChange(false)
                .build());
        adminUserId = adminUser.getId();

        // Login as admin
        ResponseEntity<Map> adminLoginResponse = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("username", "admin", "password", "Admin1234"))
                .retrieve()
                .toEntity(Map.class);
        adminToken = (String) adminLoginResponse.getBody().get("token");

        // Create a regular user and obtain token
        User regularUser = userRepository.save(User.builder()
                .username("regularuser")
                .email("regular@example.com")
                .password(passwordEncoder.encode("Regular1234"))
                .role(Role.USER)
                .enabled(true)
                .forcePasswordChange(false)
                .build());

        ResponseEntity<Map> userLoginResponse = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("username", "regularuser", "password", "Regular1234"))
                .retrieve()
                .toEntity(Map.class);
        userToken = (String) userLoginResponse.getBody().get("token");
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
                .header("Authorization", "Bearer " + adminToken)
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
                .header("Authorization", "Bearer " + userToken)
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
                .header("Authorization", "Bearer " + adminToken)
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
                .header("Authorization", "Bearer " + adminToken)
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
                .header("Authorization", "Bearer " + adminToken)
                .retrieve()
                .toEntity(Void.class);

        assertThat(response.getStatusCode().value()).isEqualTo(204);
    }
}
