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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
@DisabledInAotMode
class ProfileControllerTest {

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
    private String userCookie;

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
                    // suppress errors so tests can inspect the status code
                })
                .build();

        userRepository.save(User.builder()
                .username("profileuser")
                .email("profileuser@example.com")
                .password(passwordEncoder.encode("Profile1234"))
                .role(Role.USER)
                .enabled(true)
                .forcePasswordChange(false)
                .build());

        ResponseEntity<Map> loginResponse = restClient.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("username", "profileuser", "password", "Profile1234"))
                .retrieve()
                .toEntity(Map.class);

        List<String> cookieHeaders = loginResponse.getHeaders().get("Set-Cookie");
        assertThat(cookieHeaders).isNotNull().isNotEmpty();
        userCookie = "auth_token=" + extractTokenFromCookie(cookieHeaders.get(0));
    }

    @Test
    void getProfile_authenticated_returns200WithCurrentUser() {
        ResponseEntity<Map> response = restClient.get()
                .uri("/api/profile")
                .header("Cookie", userCookie)
                .retrieve()
                .toEntity(Map.class);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("username")).isEqualTo("profileuser");
        assertThat(response.getBody().get("email")).isEqualTo("profileuser@example.com");
    }

    @Test
    void getProfile_unauthenticated_returns401() {
        ResponseEntity<Map> response = restClient.get()
                .uri("/api/profile")
                .retrieve()
                .toEntity(Map.class);

        assertThat(response.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void updateProfile_withUniqueValues_returns200AndUpdatedUser() {
        Map<String, String> request = Map.of(
                "username", "updateduser",
                "email", "updated@example.com"
        );

        ResponseEntity<Map> response = restClient.put()
                .uri("/api/profile")
                .header("Cookie", userCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toEntity(Map.class);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("username")).isEqualTo("updateduser");
        assertThat(response.getBody().get("email")).isEqualTo("updated@example.com");
    }

    @Test
    void updateProfile_withTakenUsername_returns409() {
        // Create a second user with a username that will be "taken"
        userRepository.save(User.builder()
                .username("taken")
                .email("taken@other.com")
                .password(passwordEncoder.encode("Other1234"))
                .role(Role.USER)
                .enabled(true)
                .forcePasswordChange(false)
                .build());

        Map<String, String> request = Map.of(
                "username", "taken",
                "email", "profileuser@example.com"
        );

        ResponseEntity<Map> response = restClient.put()
                .uri("/api/profile")
                .header("Cookie", userCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toEntity(Map.class);

        assertThat(response.getStatusCode().value()).isEqualTo(409);
    }

    @Test
    void updateProfile_withTakenEmail_returns409() {
        // Create a second user with an email that will be "taken"
        userRepository.save(User.builder()
                .username("otherusername")
                .email("taken@example.com")
                .password(passwordEncoder.encode("Other1234"))
                .role(Role.USER)
                .enabled(true)
                .forcePasswordChange(false)
                .build());

        Map<String, String> request = Map.of(
                "username", "profileuser",
                "email", "taken@example.com"
        );

        ResponseEntity<Map> response = restClient.put()
                .uri("/api/profile")
                .header("Cookie", userCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toEntity(Map.class);

        assertThat(response.getStatusCode().value()).isEqualTo(409);
    }

    @Test
    void updateProfile_withBlankUsername_returns400() {
        Map<String, String> request = Map.of(
                "username", "",
                "email", "valid@example.com"
        );
        ResponseEntity<Map> response = restClient.put()
                .uri("/api/profile")
                .header("Cookie", userCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toEntity(Map.class);
        assertThat(response.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void updateProfile_withUniqueValues_reissuesNewJwt() {
        String originalToken = userCookie.replace("auth_token=", "");
        Map<String, String> request = Map.of(
                "username", "renameduser",
                "email", "renamed@example.com"
        );
        ResponseEntity<UserResponse> response = restClient.put()
                .uri("/api/profile")
                .header("Cookie", userCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toEntity(UserResponse.class);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        List<String> setCookieHeaders = response.getHeaders().get("Set-Cookie");
        assertThat(setCookieHeaders).isNotNull().isNotEmpty();
        String newToken = extractTokenFromCookie(setCookieHeaders.get(0));
        assertThat(newToken).isNotNull().isNotEqualTo(originalToken);
    }

    @Test
    void updateProfile_unauthenticated_returns401() {
        Map<String, String> request = Map.of(
                "username", "newname",
                "email", "new@example.com"
        );

        ResponseEntity<Map> response = restClient.put()
                .uri("/api/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toEntity(Map.class);

        assertThat(response.getStatusCode().value()).isEqualTo(401);
    }
}
