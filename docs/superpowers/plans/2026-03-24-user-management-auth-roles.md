# User Management + Auth + Roles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete user management system with JWT auth, role-based access control (ADMIN/MODERATOR/USER), profile pictures, and LinkedIn URL — served as a single Spring Boot jar with an embedded Angular 19 SPA.

**Architecture:** Spring Boot 4.0 backend exposes a REST API at `/api/**` secured with Spring Security + a custom JWT filter. An Angular 19 standalone-component SPA is built by Gradle and placed into `src/main/resources/static/`. A Docker Compose file runs PostgreSQL 16; Flyway manages all schema changes.

**Tech Stack:** Java 25, Spring Boot 4.0, Spring Security, JJWT 0.12.x, Flyway, PostgreSQL 16, Lombok, Testcontainers, Angular 19, standalone components, functional guards, JJWT, Jasmine/Karma.

**Spec:** `docs/superpowers/specs/2026-03-24-user-management-auth-roles-design.md`

---

## File Map

### Backend — `ai-chat-backen/`

| File | Purpose |
|------|---------|
| `build.gradle.kts` | Add security/flyway/jjwt deps, remove data-rest, add Testcontainers, add Angular build task |
| `src/main/resources/application.properties` | Datasource, Flyway, JWT, upload settings via env vars |
| `docker-compose.yml` (project root) | PostgreSQL 16 service |
| `src/main/resources/db/migration/V1__create_users_table.sql` | Flyway migration |
| `src/main/java/.../role/Role.java` | `ADMIN`, `MODERATOR`, `USER` enum |
| `src/main/java/.../user/User.java` | JPA entity with `@PreUpdate` |
| `src/main/java/.../user/UserRepository.java` | Spring Data JPA repo |
| `src/main/java/.../user/dto/UserResponse.java` | Response DTO (no password) |
| `src/main/java/.../user/dto/UserPage.java` | Pagination wrapper |
| `src/main/java/.../user/dto/CreateUserRequest.java` | Admin creates user |
| `src/main/java/.../user/dto/UpdateUserRequest.java` | Admin updates user |
| `src/main/java/.../user/dto/UpdateProfileRequest.java` | User updates own LinkedIn URL |
| `src/main/java/.../user/UserService.java` | CRUD logic, avatar path, last-admin guard |
| `src/main/java/.../user/UserController.java` | REST endpoints |
| `src/main/java/.../auth/dto/LoginRequest.java` | Login body |
| `src/main/java/.../auth/dto/ChangePasswordRequest.java` | Change password body |
| `src/main/java/.../auth/dto/AuthResponse.java` | `{ token, forcePasswordChange }` |
| `src/main/java/.../auth/TokenService.java` | JWT issue/validate/extract |
| `src/main/java/.../auth/JwtAuthFilter.java` | `OncePerRequestFilter`, populates SecurityContext |
| `src/main/java/.../auth/AuthController.java` | `/api/auth/login`, `/api/auth/change-password` |
| `src/main/java/.../storage/StorageProperties.java` | `@ConfigurationProperties("app.upload")` |
| `src/main/java/.../storage/AvatarStorageService.java` | Save/delete avatar files |
| `src/main/java/.../config/SecurityConfig.java` | `SecurityFilterChain` bean |
| `src/main/java/.../config/WebMvcConfig.java` | SPA forward, dev-profile CORS |

### Frontend — `ai-chat-frontend/`

| File | Purpose |
|------|---------|
| `src/app/app.routes.ts` | Route definitions with guards |
| `src/app/core/auth/auth.service.ts` | Login, logout, token decode, localStorage |
| `src/app/core/auth/jwt.interceptor.ts` | Attach `Authorization: Bearer` header |
| `src/app/core/auth/auth.guard.ts` | Redirect to `/login` if unauthenticated |
| `src/app/core/auth/force-password-change.guard.ts` | Redirect to `/change-password` if flag set |
| `src/app/core/auth/role.guard.ts` | Redirect if role insufficient |
| `src/app/core/api/user-api.service.ts` | HTTP calls to `/api/users`, avatar upload |
| `src/app/layout/shell/shell.component.ts` | Left sidebar + `<router-outlet>` |
| `src/app/features/login/login.component.ts` | Login form |
| `src/app/features/change-password/change-password.component.ts` | Change password form |
| `src/app/features/profile/profile.component.ts` | Edit LinkedIn URL + upload/delete avatar |
| `src/app/features/users/user-list.component.ts` | Paginated user table (ADMIN) |
| `src/app/features/users/user-form.component.ts` | Create + edit user (ADMIN) |

---

## Task 1: Infrastructure Setup

**Files:**
- Create: `docker-compose.yml` (project root)
- Modify: `ai-chat-backen/build.gradle.kts`
- Modify: `ai-chat-backen/src/main/resources/application.properties`
- Create: `ai-chat-backen/.env.example`
- Modify: `ai-chat-backen/.gitignore`

- [ ] **Step 1: Create `docker-compose.yml` at the project root**

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: aichat
      POSTGRES_USER: aichat
      POSTGRES_PASSWORD: ${DB_PASSWORD:-aichat_dev}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [ ] **Step 2: Replace `build.gradle.kts` dependencies**

Full updated `dependencies` block and add Gradle task to copy Angular output:

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.0.4"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.hibernate.orm") version "7.2.7.Final"
    id("org.graalvm.buildtools.native") version "0.11.5"
}

group = "com.alhashimi"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    compileOnly("org.projectlombok:lombok")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    runtimeOnly("org.postgresql:postgresql")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")
    annotationProcessor("org.projectlombok:lombok")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

hibernate {
    enhancement {
        enableAssociationManagement = true
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}

// Copy Angular build output into Spring Boot static resources
val frontendDir = file("${rootDir}/../ai-chat-frontend")
val frontendOutputDir = file("${frontendDir}/dist/ai-chat-frontend/browser")
val staticDir = file("src/main/resources/static")

tasks.register<Exec>("buildFrontend") {
    workingDir = frontendDir
    commandLine("npm", "run", "build")
}

tasks.register<Copy>("copyFrontend") {
    dependsOn("buildFrontend")
    from(frontendOutputDir)
    into(staticDir)
}

tasks.named("processResources") {
    dependsOn("copyFrontend")
}
```

- [ ] **Step 3: Update `application.properties`**

```properties
spring.application.name=ai-chat

# Datasource
spring.datasource.url=jdbc:postgresql://localhost:5432/aichat
spring.datasource.username=aichat
spring.datasource.password=${DB_PASSWORD:aichat_dev}

# JPA
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false

# Flyway
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration

# JWT
jwt.secret=${JWT_SECRET:dev-secret-change-in-production-must-be-256-bits}
jwt.expiration-ms=86400000

# Avatar upload
app.upload.avatar-dir=./uploads/avatars
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=5MB
```

- [ ] **Step 4: Create `.env.example` in `ai-chat-backen/`**

```
DB_PASSWORD=aichat_dev
# JWT_SECRET must be a base64-encoded 256-bit (32-byte) random value.
# Generate one with: openssl rand -base64 32
JWT_SECRET=dGVzdC1zZWNyZXQtdGhhdC1pcy1sb25nLWVub3VnaA==
```

- [ ] **Step 5: Add `.env` to `.gitignore`**

Open `ai-chat-backen/.gitignore` and append:
```
.env
uploads/
```

- [ ] **Step 6: Start PostgreSQL and verify connection**

```bash
cd /Users/mkh/source/playground/ai-chat
DB_PASSWORD=aichat_dev docker compose up -d
# Wait 3 seconds, then:
docker compose exec postgres psql -U aichat -c '\l'
```
Expected: List of databases includes `aichat`.

- [ ] **Step 7: Verify Gradle resolves dependencies**

```bash
cd ai-chat-backen
./gradlew dependencies --configuration compileClasspath 2>&1 | grep -E "jjwt|security|flyway"
```
Expected: `jjwt-api`, `spring-security-core`, `flyway-core` in output.

- [ ] **Step 8: Commit**

```bash
git add docker-compose.yml ai-chat-backen/build.gradle.kts \
  ai-chat-backen/src/main/resources/application.properties \
  ai-chat-backen/.env.example ai-chat-backen/.gitignore
git commit -m "chore: infrastructure setup — docker, dependencies, config"
```

---

## Task 2: Data Layer — Flyway Migration + Entity

**Files:**
- Create: `ai-chat-backen/src/main/resources/db/migration/V1__create_users_table.sql`
- Create: `ai-chat-backen/src/main/java/com/alhashimi/ai/chat/role/Role.java`
- Create: `ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/User.java`
- Create: `ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UserRepository.java`

- [ ] **Step 1: Create Flyway migration**

`src/main/resources/db/migration/V1__create_users_table.sql`:
```sql
CREATE TABLE users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username              VARCHAR(50)  NOT NULL UNIQUE,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    password              VARCHAR(255) NOT NULL,
    role                  VARCHAR(20)  NOT NULL,
    force_password_change BOOLEAN      NOT NULL DEFAULT TRUE,
    enabled               BOOLEAN      NOT NULL DEFAULT TRUE,
    profile_picture_path  VARCHAR(512),
    linkedin_url          VARCHAR(512),
    created_at            TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP    NOT NULL DEFAULT now()
);
```

- [ ] **Step 2: Create `Role` enum**

`src/main/java/com/alhashimi/ai/chat/role/Role.java`:
```java
package com.alhashimi.ai.chat.role;

public enum Role {
    ADMIN, MODERATOR, USER
}
```

- [ ] **Step 3: Create `User` entity**

`src/main/java/com/alhashimi/ai/chat/user/User.java`:
```java
package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.role.Role;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false)
    private boolean forcePasswordChange = true;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(length = 512)
    private String profilePicturePath;

    @Column(length = 512)
    private String linkedinUrl;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
```

- [ ] **Step 4: Create `UserRepository`**

`src/main/java/com/alhashimi/ai/chat/user/UserRepository.java`:
```java
package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.role.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    long countByRole(Role role);
}
```

- [ ] **Step 5: Run Flyway migration**

```bash
cd ai-chat-backen
DB_PASSWORD=aichat_dev JWT_SECRET=dev-secret ./gradlew bootRun &
sleep 10
curl -s http://localhost:8080/actuator/health 2>/dev/null || echo "App started (no actuator)"
kill %1
```

Alternatively verify via psql:
```bash
docker compose exec postgres psql -U aichat -c '\d users'
```
Expected: table with all columns listed.

- [ ] **Step 6: Commit**

```bash
git add ai-chat-backen/src/main/resources/db/migration/ \
  ai-chat-backen/src/main/java/com/alhashimi/ai/chat/role/ \
  ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/User.java \
  ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UserRepository.java
git commit -m "feat: add Flyway migration, Role enum, User entity"
```

---

## Task 3: JWT TokenService (TDD)

**Files:**
- Create: `src/test/java/com/alhashimi/ai/chat/auth/TokenServiceTest.java`
- Create: `src/main/java/com/alhashimi/ai/chat/auth/TokenService.java`

- [ ] **Step 1: Write failing tests**

`src/test/java/com/alhashimi/ai/chat/auth/TokenServiceTest.java`:
```java
package com.alhashimi.ai.chat.auth;

import com.alhashimi.ai.chat.role.Role;
import com.alhashimi.ai.chat.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class TokenServiceTest {

    private TokenService tokenService;
    private User user;

    @BeforeEach
    void setUp() {
        // 256-bit base64 secret for testing
        tokenService = new TokenService(
            "dGVzdC1zZWNyZXQtdGhhdC1pcy1sb25nLWVub3VnaC1mb3ItaHMyNTY=",
            86400000L
        );
        user = User.builder()
            .id(UUID.randomUUID())
            .username("alice")
            .role(Role.ADMIN)
            .forcePasswordChange(false)
            .build();
    }

    @Test
    void generateToken_returnsNonNullString() {
        String token = tokenService.generateToken(user);
        assertThat(token).isNotBlank();
    }

    @Test
    void validateToken_validToken_returnsTrue() {
        String token = tokenService.generateToken(user);
        assertThat(tokenService.isTokenValid(token)).isTrue();
    }

    @Test
    void validateToken_invalidToken_returnsFalse() {
        assertThat(tokenService.isTokenValid("not.a.token")).isFalse();
    }

    @Test
    void extractUserId_returnsCorrectId() {
        String token = tokenService.generateToken(user);
        assertThat(tokenService.extractUserId(token)).isEqualTo(user.getId().toString());
    }

    @Test
    void extractRole_returnsCorrectRole() {
        String token = tokenService.generateToken(user);
        assertThat(tokenService.extractRole(token)).isEqualTo("ADMIN");
    }

    @Test
    void extractForcePasswordChange_returnsCorrectValue() {
        String token = tokenService.generateToken(user);
        assertThat(tokenService.extractForcePasswordChange(token)).isFalse();
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ai-chat-backen
./gradlew test --tests "com.alhashimi.ai.chat.auth.TokenServiceTest" 2>&1 | tail -20
```
Expected: compilation failure — `TokenService` does not exist.

- [ ] **Step 3: Implement `TokenService`**

`src/main/java/com/alhashimi/ai/chat/auth/TokenService.java`:
```java
package com.alhashimi.ai.chat.auth;

import com.alhashimi.ai.chat.user.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

@Service
public class TokenService {

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
        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("username", user.getUsername())
            .claim("role", user.getRole().name())
            .claim("forcePasswordChange", user.isForcePasswordChange())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(signingKey)
            .compact();
    }

    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractUserId(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    public boolean extractForcePasswordChange(String token) {
        return parseClaims(token).get("forcePasswordChange", Boolean.class);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
./gradlew test --tests "com.alhashimi.ai.chat.auth.TokenServiceTest" 2>&1 | tail -10
```
Expected: `BUILD SUCCESSFUL`, 6 tests passed.

- [ ] **Step 5: Commit**

```bash
git add ai-chat-backen/src/main/java/com/alhashimi/ai/chat/auth/TokenService.java \
  ai-chat-backen/src/test/java/com/alhashimi/ai/chat/auth/TokenServiceTest.java
git commit -m "feat: add TokenService (JWT generation and validation)"
```

---

## Task 4: Spring Security Config + JwtAuthFilter

**Files:**
- Create: `src/test/java/com/alhashimi/ai/chat/auth/JwtAuthFilterTest.java`
- Create: `src/main/java/com/alhashimi/ai/chat/auth/JwtAuthFilter.java`
- Create: `src/main/java/com/alhashimi/ai/chat/config/SecurityConfig.java`

- [ ] **Step 1: Write failing test**

`src/test/java/com/alhashimi/ai/chat/auth/JwtAuthFilterTest.java`:
```java
package com.alhashimi.ai.chat.auth;

import com.alhashimi.ai.chat.role.Role;
import com.alhashimi.ai.chat.user.User;
import com.alhashimi.ai.chat.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock private TokenService tokenService;
    @Mock private UserRepository userRepository;

    private JwtAuthFilter filter;
    private User user;
    private static final String TOKEN = "valid.jwt.token";

    @BeforeEach
    void setUp() {
        filter = new JwtAuthFilter(tokenService, userRepository);
        user = User.builder()
            .id(UUID.randomUUID())
            .username("alice")
            .role(Role.USER)
            .enabled(true)
            .build();
        SecurityContextHolder.clearContext();
    }

    @Test
    void validToken_populatesSecurityContext() throws Exception {
        when(tokenService.isTokenValid(TOKEN)).thenReturn(true);
        when(tokenService.extractUserId(TOKEN)).thenReturn(user.getId().toString());
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + TOKEN);

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("alice");
    }

    @Test
    void missingToken_doesNotPopulateSecurityContext() throws Exception {
        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), new MockFilterChain());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void invalidToken_doesNotPopulateSecurityContext() throws Exception {
        when(tokenService.isTokenValid("bad")).thenReturn(false);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer bad");

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
./gradlew test --tests "com.alhashimi.ai.chat.auth.JwtAuthFilterTest" 2>&1 | tail -10
```
Expected: compilation failure.

- [ ] **Step 3: Implement `JwtAuthFilter`**

`src/main/java/com/alhashimi/ai/chat/auth/JwtAuthFilter.java`:
```java
package com.alhashimi.ai.chat.auth;

import com.alhashimi.ai.chat.user.User;
import com.alhashimi.ai.chat.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (tokenService.isTokenValid(token)) {
                UUID userId = UUID.fromString(tokenService.extractUserId(token));
                userRepository.findById(userId).ifPresent(user -> {
                    if (user.isEnabled()) {
                        var auth = new UsernamePasswordAuthenticationToken(
                            user.getUsername(),
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                        );
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        request.setAttribute("currentUser", user);
                    }
                });
            }
        }
        chain.doFilter(request, response);
    }
}
```

- [ ] **Step 4: Implement `SecurityConfig`**

`src/main/java/com/alhashimi/ai/chat/config/SecurityConfig.java`:
```java
package com.alhashimi.ai.chat.config;

import com.alhashimi.ai.chat.auth.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/*/avatar").permitAll()
                .requestMatchers(HttpMethod.GET, "/", "/index.html", "/*.js", "/*.css",
                                 "/*.ico", "/assets/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
./gradlew test --tests "com.alhashimi.ai.chat.auth.JwtAuthFilterTest" 2>&1 | tail -10
```
Expected: `BUILD SUCCESSFUL`, 3 tests passed.

- [ ] **Step 6: Commit**

```bash
git add ai-chat-backen/src/main/java/com/alhashimi/ai/chat/auth/JwtAuthFilter.java \
  ai-chat-backen/src/main/java/com/alhashimi/ai/chat/config/SecurityConfig.java \
  ai-chat-backen/src/test/java/com/alhashimi/ai/chat/auth/JwtAuthFilterTest.java
git commit -m "feat: add JwtAuthFilter and Spring Security config"
```

---

## Task 5: Auth DTOs + AuthController (TDD)

**Files:**
- Create: `src/main/java/com/alhashimi/ai/chat/auth/dto/LoginRequest.java`
- Create: `src/main/java/com/alhashimi/ai/chat/auth/dto/ChangePasswordRequest.java`
- Create: `src/main/java/com/alhashimi/ai/chat/auth/dto/AuthResponse.java`
- Create: `src/test/java/com/alhashimi/ai/chat/auth/AuthControllerTest.java`
- Create: `src/main/java/com/alhashimi/ai/chat/auth/AuthController.java`
- Create: `src/test/java/com/alhashimi/ai/chat/AbstractIntegrationTest.java`

- [ ] **Step 1: Create DTOs**

`src/main/java/com/alhashimi/ai/chat/auth/dto/LoginRequest.java`:
```java
package com.alhashimi.ai.chat.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
```

`src/main/java/com/alhashimi/ai/chat/auth/dto/ChangePasswordRequest.java`:
```java
package com.alhashimi.ai.chat.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    @NotBlank String currentPassword,
    @NotBlank @Size(min = 8) String newPassword
) {}
```

`src/main/java/com/alhashimi/ai/chat/auth/dto/AuthResponse.java`:
```java
package com.alhashimi.ai.chat.auth.dto;

public record AuthResponse(String token, boolean forcePasswordChange) {}
```

- [ ] **Step 2: Create shared Testcontainers base class**

`src/test/java/com/alhashimi/ai/chat/AbstractIntegrationTest.java`:
```java
package com.alhashimi.ai.chat;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

- [ ] **Step 3: Write failing integration tests**

`src/test/java/com/alhashimi/ai/chat/auth/AuthControllerTest.java`:
```java
package com.alhashimi.ai.chat.auth;

import com.alhashimi.ai.chat.AbstractIntegrationTest;
import com.alhashimi.ai.chat.auth.dto.AuthResponse;
import com.alhashimi.ai.chat.auth.dto.LoginRequest;
import com.alhashimi.ai.chat.role.Role;
import com.alhashimi.ai.chat.user.User;
import com.alhashimi.ai.chat.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

class AuthControllerTest extends AbstractIntegrationTest {

    @Autowired private TestRestTemplate restTemplate;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        userRepository.save(User.builder()
            .username("alice")
            .email("alice@example.com")
            .password(passwordEncoder.encode("password123"))
            .role(Role.ADMIN)
            .forcePasswordChange(false)
            .enabled(true)
            .build());
    }

    @Test
    void login_validCredentials_returnsToken() {
        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
            "/api/auth/login",
            new LoginRequest("alice", "password123"),
            AuthResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().token()).isNotBlank();
        assertThat(response.getBody().forcePasswordChange()).isFalse();
    }

    @Test
    void login_invalidPassword_returns401() {
        ResponseEntity<String> response = restTemplate.postForEntity(
            "/api/auth/login",
            new LoginRequest("alice", "wrong"),
            String.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void login_disabledUser_returns401() {
        userRepository.findByUsername("alice").ifPresent(u -> {
            u.setEnabled(false);
            userRepository.save(u);
        });

        ResponseEntity<String> response = restTemplate.postForEntity(
            "/api/auth/login",
            new LoginRequest("alice", "password123"),
            String.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
./gradlew test --tests "com.alhashimi.ai.chat.auth.AuthControllerTest" 2>&1 | tail -15
```
Expected: failure — `AuthController` does not exist.

- [ ] **Step 5: Implement `AuthController`**

`src/main/java/com/alhashimi/ai/chat/auth/AuthController.java`:
```java
package com.alhashimi.ai.chat.auth;

import com.alhashimi.ai.chat.auth.dto.AuthResponse;
import com.alhashimi.ai.chat.auth.dto.ChangePasswordRequest;
import com.alhashimi.ai.chat.auth.dto.LoginRequest;
import com.alhashimi.ai.chat.user.User;
import com.alhashimi.ai.chat.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        return userRepository.findByUsername(request.username())
            .filter(User::isEnabled)
            .filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
            .map(u -> ResponseEntity.ok(new AuthResponse(tokenService.generateToken(u), u.isForcePasswordChange())))
            .orElse(ResponseEntity.status(401).body(null));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        User currentUser = (User) httpRequest.getAttribute("currentUser");
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        if (!passwordEncoder.matches(request.currentPassword(), currentUser.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect"));
        }
        currentUser.setPassword(passwordEncoder.encode(request.newPassword()));
        currentUser.setForcePasswordChange(false);
        userRepository.save(currentUser);
        return ResponseEntity.ok(new AuthResponse(tokenService.generateToken(currentUser), false));
    }
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
./gradlew test --tests "com.alhashimi.ai.chat.auth.AuthControllerTest" 2>&1 | tail -10
```
Expected: `BUILD SUCCESSFUL`, 3 tests passed.

- [ ] **Step 7: Commit**

```bash
git add ai-chat-backen/src/main/java/com/alhashimi/ai/chat/auth/ \
  ai-chat-backen/src/test/java/com/alhashimi/ai/chat/auth/AuthControllerTest.java \
  ai-chat-backen/src/test/java/com/alhashimi/ai/chat/AbstractIntegrationTest.java
git commit -m "feat: add AuthController (login + change-password)"
```

---

## Task 6: User DTOs + UserService (TDD)

**Files:**
- Create: `src/main/java/com/alhashimi/ai/chat/user/dto/*.java` (5 DTOs)
- Create: `src/test/java/com/alhashimi/ai/chat/user/UserServiceTest.java`
- Create: `src/main/java/com/alhashimi/ai/chat/user/UserService.java`

- [ ] **Step 1: Create DTOs**

`src/main/java/com/alhashimi/ai/chat/user/dto/CreateUserRequest.java`:
```java
package com.alhashimi.ai.chat.user.dto;

import com.alhashimi.ai.chat.role.Role;
import jakarta.validation.constraints.*;

public record CreateUserRequest(
    @NotBlank @Size(min = 3, max = 50) String username,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8) String password,
    @NotNull Role role
) {}
```

`src/main/java/com/alhashimi/ai/chat/user/dto/UpdateUserRequest.java`:
```java
package com.alhashimi.ai.chat.user.dto;

import com.alhashimi.ai.chat.role.Role;
import jakarta.validation.constraints.Email;

public record UpdateUserRequest(
    @Email String email,
    Role role,
    Boolean enabled
) {}
```

`src/main/java/com/alhashimi/ai/chat/user/dto/UpdateProfileRequest.java`:
```java
package com.alhashimi.ai.chat.user.dto;

public record UpdateProfileRequest(String linkedinUrl) {}
```

`src/main/java/com/alhashimi/ai/chat/user/dto/UserResponse.java`:
```java
package com.alhashimi.ai.chat.user.dto;

import com.alhashimi.ai.chat.role.Role;
import com.alhashimi.ai.chat.user.User;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(
    UUID id, String username, String email, Role role,
    boolean forcePasswordChange, boolean enabled,
    String profilePictureUrl, String linkedinUrl,
    Instant createdAt, Instant updatedAt
) {
    public static UserResponse from(User user) {
        String avatarUrl = user.getProfilePicturePath() != null
            ? "/api/users/" + user.getId() + "/avatar"
            : null;
        return new UserResponse(
            user.getId(), user.getUsername(), user.getEmail(), user.getRole(),
            user.isForcePasswordChange(), user.isEnabled(),
            avatarUrl, user.getLinkedinUrl(),
            user.getCreatedAt(), user.getUpdatedAt()
        );
    }
}
```

`src/main/java/com/alhashimi/ai/chat/user/dto/UserPage.java`:
```java
package com.alhashimi.ai.chat.user.dto;

import java.util.List;

public record UserPage(
    List<UserResponse> content,
    int page, int size, long totalElements, int totalPages
) {}
```

- [ ] **Step 2: Write failing unit tests**

`src/test/java/com/alhashimi/ai/chat/user/UserServiceTest.java`:
```java
package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.role.Role;
import com.alhashimi.ai.chat.user.dto.CreateUserRequest;
import com.alhashimi.ai.chat.user.dto.UpdateUserRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder);
    }

    @Test
    void createUser_validRequest_savesUser() {
        var request = new CreateUserRequest("bob", "bob@example.com", "password1", Role.USER);
        when(userRepository.existsByUsername("bob")).thenReturn(false);
        when(userRepository.existsByEmail("bob@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password1")).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var result = userService.createUser(request);

        assertThat(result.username()).isEqualTo("bob");
        assertThat(result.forcePasswordChange()).isTrue();
    }

    @Test
    void createUser_duplicateUsername_throwsConflict() {
        var request = new CreateUserRequest("bob", "bob@example.com", "password1", Role.USER);
        when(userRepository.existsByUsername("bob")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("already taken");
    }

    @Test
    void deleteUser_lastAdmin_throwsConflict() {
        var admin = User.builder().id(UUID.randomUUID()).role(Role.ADMIN).enabled(true).build();
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(1L);

        assertThatThrownBy(() -> userService.deleteUser(admin.getId(), admin))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("last admin");
    }

    @Test
    void deleteUser_alreadyDisabled_isIdempotent() {
        var user = User.builder().id(UUID.randomUUID()).role(Role.USER).enabled(false).build();
        var caller = User.builder().id(UUID.randomUUID()).role(Role.ADMIN).build();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThatNoException().isThrownBy(() -> userService.deleteUser(user.getId(), caller));
    }
}
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
./gradlew test --tests "com.alhashimi.ai.chat.user.UserServiceTest" 2>&1 | tail -10
```
Expected: compilation failure.

- [ ] **Step 4: Implement `UserService`**

`src/main/java/com/alhashimi/ai/chat/user/UserService.java`:
```java
package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.role.Role;
import com.alhashimi.ai.chat.user.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        var user = User.builder()
            .username(request.username())
            .email(request.email())
            .password(passwordEncoder.encode(request.password()))
            .role(request.role())
            .forcePasswordChange(true)
            .enabled(true)
            .build();
        return UserResponse.from(userRepository.save(user));
    }

    public UserPage listUsers(int page, int size, String sort) {
        // sort format: "field,direction" e.g. "username,asc" or "username,desc"
        Sort sortSpec = Sort.by("username");
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            Sort.Direction dir = parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc")
                ? Sort.Direction.DESC : Sort.Direction.ASC;
            sortSpec = Sort.by(dir, field);
        }
        Pageable pageable = PageRequest.of(page, size, sortSpec);
        Page<User> result = userRepository.findAll(pageable);
        return new UserPage(
            result.getContent().stream().map(UserResponse::from).toList(),
            result.getNumber(), result.getSize(),
            result.getTotalElements(), result.getTotalPages()
        );
    }

    public UserResponse getUser(UUID id) {
        return UserResponse.from(findUserById(id));
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request, User caller) {
        if (request.email() == null && request.role() == null && request.enabled() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one field must be provided");
        }
        User user = findUserById(id);
        if (caller.getId().equals(id)) {
            if (request.role() != null && !request.role().equals(user.getRole())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot change your own role");
            }
            if (Boolean.FALSE.equals(request.enabled())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot disable your own account");
            }
        }
        if (request.email() != null) user.setEmail(request.email());
        if (request.role() != null) user.setRole(request.role());
        if (request.enabled() != null) user.setEnabled(request.enabled());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(UUID id, User caller) {
        User user = findUserById(id);
        if (caller.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot disable your own account");
        }
        if (user.getRole() == Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot remove the last admin account");
        }
        user.setEnabled(false);
        userRepository.save(user);
    }

    @Transactional
    public UserResponse updateProfile(User user, UpdateProfileRequest request) {
        if (request.linkedinUrl() != null && !request.linkedinUrl().isBlank()) {
            if (!request.linkedinUrl().matches("https://(www\\.)?linkedin\\.com/.*")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "linkedinUrl must be a valid LinkedIn profile URL");
            }
            user.setLinkedinUrl(request.linkedinUrl());
        } else if (request.linkedinUrl() == null) {
            user.setLinkedinUrl(null);
        }
        return UserResponse.from(userRepository.save(user));
    }

    public void updateAvatarPath(User user, String path) {
        user.setProfilePicturePath(path);
        userRepository.save(user);
    }

    public User findUserById(UUID id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
./gradlew test --tests "com.alhashimi.ai.chat.user.UserServiceTest" 2>&1 | tail -10
```
Expected: `BUILD SUCCESSFUL`, 4 tests passed.

- [ ] **Step 6: Commit**

```bash
git add ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/ \
  ai-chat-backen/src/test/java/com/alhashimi/ai/chat/user/UserServiceTest.java
git commit -m "feat: add UserService and user DTOs"
```

---

## Task 7: UserController (TDD)

**Files:**
- Create: `src/test/java/com/alhashimi/ai/chat/user/UserControllerTest.java`
- Create: `src/main/java/com/alhashimi/ai/chat/user/UserController.java`

- [ ] **Step 1: Write failing integration tests**

`src/test/java/com/alhashimi/ai/chat/user/UserControllerTest.java`:
```java
package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.AbstractIntegrationTest;
import com.alhashimi.ai.chat.auth.TokenService;
import com.alhashimi.ai.chat.role.Role;
import com.alhashimi.ai.chat.user.dto.CreateUserRequest;
import com.alhashimi.ai.chat.user.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

class UserControllerTest extends AbstractIntegrationTest {

    @Autowired private TestRestTemplate restTemplate;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private TokenService tokenService;

    private String adminToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        var admin = userRepository.save(User.builder()
            .username("admin")
            .email("admin@example.com")
            .password(passwordEncoder.encode("password123"))
            .role(Role.ADMIN)
            .forcePasswordChange(false)
            .enabled(true)
            .build());
        adminToken = tokenService.generateToken(admin);
    }

    @Test
    void getUsers_asAdmin_returnsUserPage() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        ResponseEntity<String> response = restTemplate.exchange(
            "/api/users", HttpMethod.GET, new HttpEntity<>(headers), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void createUser_asAdmin_returns201() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        var body = new CreateUserRequest("newuser", "new@example.com", "password99", Role.USER);
        ResponseEntity<UserResponse> response = restTemplate.exchange(
            "/api/users", HttpMethod.POST,
            new HttpEntity<>(body, headers), UserResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().username()).isEqualTo("newuser");
        assertThat(response.getBody().forcePasswordChange()).isTrue();
    }

    @Test
    void createUser_unauthenticated_returns401() {
        ResponseEntity<String> response = restTemplate.postForEntity(
            "/api/users",
            new CreateUserRequest("x", "x@x.com", "password1", Role.USER),
            String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void getMe_returnsOwnProfile() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        ResponseEntity<UserResponse> response = restTemplate.exchange(
            "/api/users/me", HttpMethod.GET, new HttpEntity<>(headers), UserResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().username()).isEqualTo("admin");
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
./gradlew test --tests "com.alhashimi.ai.chat.user.UserControllerTest" 2>&1 | tail -10
```
Expected: compilation failure.

- [ ] **Step 3: Implement `UserController`**

`src/main/java/com/alhashimi/ai/chat/user/UserController.java`:
```java
package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.user.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UserPage listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort) {
        return userService.listUsers(page, size, sort);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(201).body(userService.createUser(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUser(@PathVariable UUID id) {
        return userService.getUser(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateUser(@PathVariable UUID id,
                                   @Valid @RequestBody UpdateUserRequest request,
                                   HttpServletRequest httpRequest) {
        User caller = (User) httpRequest.getAttribute("currentUser");
        return userService.updateUser(id, request, caller);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id, HttpServletRequest httpRequest) {
        User caller = (User) httpRequest.getAttribute("currentUser");
        userService.deleteUser(id, caller);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserResponse getMe(HttpServletRequest httpRequest) {
        User user = (User) httpRequest.getAttribute("currentUser");
        return UserResponse.from(user);
    }

    @PutMapping("/me")
    public UserResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request,
                                      HttpServletRequest httpRequest) {
        User user = (User) httpRequest.getAttribute("currentUser");
        return userService.updateProfile(user, request);
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
./gradlew test --tests "com.alhashimi.ai.chat.user.UserControllerTest" 2>&1 | tail -10
```
Expected: `BUILD SUCCESSFUL`, 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UserController.java \
  ai-chat-backen/src/test/java/com/alhashimi/ai/chat/user/UserControllerTest.java
git commit -m "feat: add UserController (CRUD + profile endpoints)"
```

---

## Task 8: Avatar Storage Service (TDD)

**Files:**
- Create: `src/main/java/com/alhashimi/ai/chat/storage/StorageProperties.java`
- Create: `src/test/java/com/alhashimi/ai/chat/storage/AvatarStorageServiceTest.java`
- Create: `src/main/java/com/alhashimi/ai/chat/storage/AvatarStorageService.java`
- Modify: `src/main/java/com/alhashimi/ai/chat/user/UserController.java` (add avatar endpoints)
- Modify: `src/main/java/com/alhashimi/ai/chat/AiChatApplication.java` (enable @ConfigurationPropertiesScan)

- [ ] **Step 1: Create `StorageProperties`**

`src/main/java/com/alhashimi/ai/chat/storage/StorageProperties.java`:
```java
package com.alhashimi.ai.chat.storage;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.upload")
public class StorageProperties {
    private String avatarDir = "./uploads/avatars";
}
```

- [ ] **Step 2: Write failing unit tests**

`src/test/java/com/alhashimi/ai/chat/storage/AvatarStorageServiceTest.java`:
```java
package com.alhashimi.ai.chat.storage;

import org.junit.jupiter.api.*;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.*;

import static org.assertj.core.api.Assertions.*;

class AvatarStorageServiceTest {

    private AvatarStorageService service;
    private Path tempDir;

    @BeforeEach
    void setUp() throws Exception {
        tempDir = Files.createTempDirectory("avatars-test");
        StorageProperties props = new StorageProperties();
        props.setAvatarDir(tempDir.toString());
        service = new AvatarStorageService(props);
    }

    @AfterEach
    void tearDown() throws Exception {
        // clean up temp files
        Files.walk(tempDir).sorted(java.util.Comparator.reverseOrder())
            .forEach(p -> p.toFile().delete());
    }

    @Test
    void saveAvatar_validJpeg_returnsRelativePath() throws Exception {
        var file = new MockMultipartFile("file", "photo.jpg",
            MediaType.IMAGE_JPEG_VALUE, new byte[100]);
        String path = service.saveAvatar("user-123", file);
        assertThat(path).isEqualTo("user-123.jpg");
        assertThat(tempDir.resolve(path)).exists();
    }

    @Test
    void saveAvatar_unsupportedType_throws415() {
        var file = new MockMultipartFile("file", "doc.pdf",
            "application/pdf", new byte[10]);
        assertThatThrownBy(() -> service.saveAvatar("user-123", file))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Unsupported");
    }

    @Test
    void saveAvatar_tooLarge_throws413() {
        var file = new MockMultipartFile("file", "big.jpg",
            MediaType.IMAGE_JPEG_VALUE, new byte[6 * 1024 * 1024]); // 6 MB
        assertThatThrownBy(() -> service.saveAvatar("user-123", file))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("5MB");
    }

    @Test
    void deleteAvatar_existingFile_removesFile() throws Exception {
        var file = new MockMultipartFile("file", "photo.png",
            MediaType.IMAGE_PNG_VALUE, new byte[50]);
        String path = service.saveAvatar("user-456", file);
        service.deleteAvatar(path);
        assertThat(tempDir.resolve(path)).doesNotExist();
    }
}
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
./gradlew test --tests "com.alhashimi.ai.chat.storage.AvatarStorageServiceTest" 2>&1 | tail -10
```
Expected: compilation failure.

- [ ] **Step 4: Implement `AvatarStorageService`**

`src/main/java/com/alhashimi/ai/chat/storage/AvatarStorageService.java`:
```java
package com.alhashimi.ai.chat.storage;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AvatarStorageService {

    private static final long MAX_SIZE = 5L * 1024 * 1024; // 5 MB
    private static final Map<String, String> ALLOWED_TYPES = Map.of(
        "image/jpeg", "jpg",
        "image/png",  "png",
        "image/webp", "webp"
    );

    private final StorageProperties props;

    @PostConstruct
    void init() throws IOException {
        Files.createDirectories(Path.of(props.getAvatarDir()));
    }

    public String saveAvatar(String userId, MultipartFile file) throws IOException {
        if (file.getSize() > MAX_SIZE) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                "File exceeds maximum size of 5MB");
        }
        String ext = ALLOWED_TYPES.get(file.getContentType());
        if (ext == null) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Unsupported file type. Allowed: JPEG, PNG, WebP");
        }
        String filename = userId + "." + ext;
        Path dest = Path.of(props.getAvatarDir()).resolve(filename);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        return filename;
    }

    public void deleteAvatar(String relativePath) throws IOException {
        if (relativePath == null) return;
        Path file = Path.of(props.getAvatarDir()).resolve(relativePath);
        Files.deleteIfExists(file);
    }

    public Path resolveAvatar(String relativePath) {
        return Path.of(props.getAvatarDir()).resolve(relativePath);
    }
}
```

- [ ] **Step 5: Add `UserRepository` and `AvatarStorageService` to `UserController`'s constructor dependencies**

Open `src/main/java/com/alhashimi/ai/chat/user/UserController.java` and update the class declaration:
```java
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;        // ← add this
    private final AvatarStorageService avatarStorageService; // ← add this
    ...
}
```

- [ ] **Step 6: Add avatar endpoints to `UserController`**

Add these methods to `UserController`:
```java
// inject AvatarStorageService in constructor
private final AvatarStorageService avatarStorageService;

@PostMapping("/me/avatar")
public UserResponse uploadAvatar(@RequestParam("file") MultipartFile file,
                                  HttpServletRequest httpRequest) throws java.io.IOException {
    User user = (User) httpRequest.getAttribute("currentUser");
    // Delete old avatar if present
    if (user.getProfilePicturePath() != null) {
        avatarStorageService.deleteAvatar(user.getProfilePicturePath());
    }
    String path = avatarStorageService.saveAvatar(user.getId().toString(), file);
    userService.updateAvatarPath(user, path);
    return UserResponse.from(userRepository.findById(user.getId()).orElseThrow());
}

@DeleteMapping("/me/avatar")
public UserResponse deleteAvatar(HttpServletRequest httpRequest) throws java.io.IOException {
    User user = (User) httpRequest.getAttribute("currentUser");
    avatarStorageService.deleteAvatar(user.getProfilePicturePath());
    userService.updateAvatarPath(user, null);
    return UserResponse.from(userRepository.findById(user.getId()).orElseThrow());
}

@GetMapping("/{id}/avatar")
public ResponseEntity<org.springframework.core.io.Resource> getAvatar(@PathVariable UUID id) throws java.io.IOException {
    User user = userService.findUserById(id);
    if (user.getProfilePicturePath() == null) {
        return ResponseEntity.notFound().build();
    }
    var path = avatarStorageService.resolveAvatar(user.getProfilePicturePath());
    var resource = new org.springframework.core.io.FileSystemResource(path);
    String contentType = java.nio.file.Files.probeContentType(path);
    return ResponseEntity.ok()
        .contentType(org.springframework.http.MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
        .body(resource);
}
```

Also inject `UserRepository` into `UserController` for the avatar upload re-fetch.

- [ ] **Step 6: Run tests to verify they pass**

```bash
./gradlew test --tests "com.alhashimi.ai.chat.storage.AvatarStorageServiceTest" 2>&1 | tail -10
```
Expected: `BUILD SUCCESSFUL`, 4 tests passed.

- [ ] **Step 7: Run all backend tests**

```bash
./gradlew test 2>&1 | tail -15
```
Expected: `BUILD SUCCESSFUL`, all tests pass.

- [ ] **Step 8: Commit**

```bash
git add ai-chat-backen/src/main/java/com/alhashimi/ai/chat/storage/ \
  ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UserController.java \
  ai-chat-backen/src/test/java/com/alhashimi/ai/chat/storage/
git commit -m "feat: add AvatarStorageService and avatar upload/delete endpoints"
```

---

## Task 9: WebMvcConfig — SPA Routing + Dev CORS

**Files:**
- Create: `src/main/java/com/alhashimi/ai/chat/config/WebMvcConfig.java`

- [ ] **Step 1: Create `WebMvcConfig`**

`src/main/java/com/alhashimi/ai/chat/config/WebMvcConfig.java`:
```java
package com.alhashimi.ai.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    // Forward all non-API, non-static GET requests to index.html
    // so Angular's client-side router can handle deep links
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/{path:[^\\.]*}").setViewName("forward:/index.html");
        registry.addViewController("/**/{path:[^\\.]*}").setViewName("forward:/index.html");
    }

    @Configuration
    @Profile("dev")
    static class DevCorsConfig implements WebMvcConfigurer {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
        }
    }
}
```

- [ ] **Step 2: Verify SPA routing works**

```bash
cd ai-chat-backen
DB_PASSWORD=aichat_dev JWT_SECRET=dev-secret ./gradlew bootRun &
sleep 12
# API returns 401 (protected)
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/users
# SPA: returns 200 with empty page (no index.html yet — just no 404)
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/some-deep-link
kill %1
```
Expected: `401` for API, `200` (or a redirect) for deep link.

- [ ] **Step 3: Commit**

```bash
git add ai-chat-backen/src/main/java/com/alhashimi/ai/chat/config/WebMvcConfig.java
git commit -m "feat: add WebMvcConfig — SPA forwarding and dev CORS"
```

---

## Task 10: Angular Project Scaffold

**Files:**
- Create: `ai-chat-frontend/` (entire Angular project)

- [ ] **Step 1: Scaffold Angular project**

```bash
cd /Users/mkh/source/playground/ai-chat
npx @angular/cli@latest new ai-chat-frontend \
  --routing=true \
  --style=css \
  --standalone \
  --skip-tests=false
```

- [ ] **Step 2: Verify it builds**

```bash
cd ai-chat-frontend
npm run build
```
Expected: `dist/ai-chat-frontend/browser/` directory created.

- [ ] **Step 3: Add `@angular/common` HttpClient provider to `app.config.ts`**

Open `src/app/app.config.ts` and ensure it includes:
```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([])), // interceptors added in Task 11
  ]
};
```

- [ ] **Step 4: Add `.superpowers/` to `.gitignore`**

Append to `/Users/mkh/source/playground/ai-chat/.gitignore` (create if it doesn't exist):
```
.superpowers/
ai-chat-frontend/node_modules/
ai-chat-frontend/dist/
```

- [ ] **Step 5: Commit**

```bash
cd /Users/mkh/source/playground/ai-chat
git add ai-chat-frontend/ .gitignore
git commit -m "chore: scaffold Angular 19 frontend project"
```

---

## Task 11: Angular Auth Core (TDD)

**Files:**
- Create: `ai-chat-frontend/src/app/core/auth/auth.service.ts`
- Create: `ai-chat-frontend/src/app/core/auth/auth.service.spec.ts`
- Create: `ai-chat-frontend/src/app/core/auth/jwt.interceptor.ts`
- Create: `ai-chat-frontend/src/app/core/auth/auth.guard.ts`
- Create: `ai-chat-frontend/src/app/core/auth/auth.guard.spec.ts`
- Create: `ai-chat-frontend/src/app/core/auth/force-password-change.guard.ts`
- Create: `ai-chat-frontend/src/app/core/auth/force-password-change.guard.spec.ts`
- Create: `ai-chat-frontend/src/app/core/auth/role.guard.ts`
- Create: `ai-chat-frontend/src/app/core/auth/role.guard.spec.ts`

- [ ] **Step 1: Write failing `AuthService` tests**

`src/app/core/auth/auth.service.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: { navigate: jasmine.createSpy() } }]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => httpMock.verify());

  it('login stores token and sets isAuthenticated', () => {
    service.login('alice', 'pass').subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ token: 'test.jwt.token', forcePasswordChange: false });
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('logout clears token', () => {
    localStorage.setItem('token', 'test.jwt.token');
    service.logout();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('getRole returns role from token payload', () => {
    // JWT with payload { role: 'ADMIN' } — use a test token
    const payload = btoa(JSON.stringify({ role: 'ADMIN', sub: '1', exp: 9999999999 }));
    localStorage.setItem('token', `header.${payload}.sig`);
    expect(service.getRole()).toBe('ADMIN');
  });
});
```

- [ ] **Step 2: Implement `AuthService`**

`src/app/core/auth/auth.service.ts`:
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface AuthResponse {
  token: string;
  forcePasswordChange: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { username, password }).pipe(
      tap(res => localStorage.setItem(this.TOKEN_KEY, res.token))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/change-password', { currentPassword, newPassword }).pipe(
      tap(res => localStorage.setItem(this.TOKEN_KEY, res.token))
    );
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const payload = this.decodePayload(token);
    return payload != null && payload.exp * 1000 > Date.now();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): string | null {
    const payload = this.decodePayload(this.getToken()!);
    return payload?.role ?? null;
  }

  isForcePasswordChange(): boolean {
    const payload = this.decodePayload(this.getToken()!);
    return payload?.forcePasswordChange ?? false;
  }

  private decodePayload(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }
}
```

- [ ] **Step 3: Implement `jwt.interceptor.ts`**

`src/app/core/auth/jwt.interceptor.ts`:
```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

- [ ] **Step 4: Implement guards**

`src/app/core/auth/auth.guard.ts`:
```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  return true;
};
```

`src/app/core/auth/force-password-change.guard.ts`:
```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const forcePasswordChangeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated() && auth.isForcePasswordChange()) {
    return router.createUrlTree(['/change-password']);
  }
  return true;
};
```

`src/app/core/auth/role.guard.ts`:
```typescript
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredRole: string = route.data['role'];
  if (auth.getRole() !== requiredRole) {
    return router.createUrlTree(['/']);
  }
  return true;
};
```

- [ ] **Step 5: Register `jwtInterceptor` in `app.config.ts`**

```typescript
provideHttpClient(withInterceptors([jwtInterceptor])),
```

- [ ] **Step 6: Run tests**

```bash
cd ai-chat-frontend
npx ng test --watch=false --browsers=ChromeHeadless 2>&1 | tail -20
```
Expected: `AuthService` tests pass.

- [ ] **Step 7: Commit**

```bash
git add ai-chat-frontend/src/app/core/
git commit -m "feat: add Angular auth service, interceptor, and guards"
```

---

## Task 12: Shell Layout

**Files:**
- Create: `ai-chat-frontend/src/app/layout/shell/shell.component.ts`

- [ ] **Step 1: Create `ShellComponent`**

`src/app/layout/shell/shell.component.ts`:
```typescript
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <div class="shell">
      <nav class="sidebar">
        <div class="sidebar-header">
          <span class="logo">AI Chat</span>
        </div>
        <ul class="nav-links">
          <li><a routerLink="/profile">Profile</a></li>
          <li *ngIf="isAdmin()"><a routerLink="/users">Users</a></li>
        </ul>
        <button class="logout-btn" (click)="logout()">Logout</button>
      </nav>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .shell { display: flex; height: 100vh; }
    .sidebar { width: 220px; background: #1e293b; color: white; display: flex; flex-direction: column; padding: 1rem; }
    .sidebar-header { margin-bottom: 2rem; }
    .logo { font-size: 1.25rem; font-weight: bold; }
    .nav-links { list-style: none; padding: 0; flex: 1; }
    .nav-links li { margin-bottom: 0.5rem; }
    .nav-links a { color: #cbd5e1; text-decoration: none; display: block; padding: 0.5rem; border-radius: 4px; }
    .nav-links a:hover { background: #334155; color: white; }
    .logout-btn { background: none; border: 1px solid #475569; color: #cbd5e1; padding: 0.5rem; cursor: pointer; border-radius: 4px; }
    .content { flex: 1; overflow-y: auto; padding: 2rem; }
  `]
})
export class ShellComponent {
  constructor(private auth: AuthService) {}
  isAdmin() { return this.auth.getRole() === 'ADMIN'; }
  logout() { this.auth.logout(); }
}
```

- [ ] **Step 2: Commit**

```bash
git add ai-chat-frontend/src/app/layout/
git commit -m "feat: add ShellComponent with left sidebar"
```

---

## Task 13: App Routes + Login Feature

**Files:**
- Modify: `ai-chat-frontend/src/app/app.routes.ts`
- Create: `ai-chat-frontend/src/app/features/login/login.component.ts`

- [ ] **Step 1: Define all routes**

`src/app/app.routes.ts`:
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { forcePasswordChangeGuard } from './core/auth/force-password-change.guard';
import { roleGuard } from './core/auth/role.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'change-password',
        loadComponent: () => import('./features/change-password/change-password.component').then(m => m.ChangePasswordComponent),
        canActivate: [] // authGuard already applied at parent; no forcePasswordChangeGuard here
      },
      { path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [forcePasswordChangeGuard]
      },
      { path: 'users',
        loadComponent: () => import('./features/users/user-list.component').then(m => m.UserListComponent),
        canActivate: [forcePasswordChangeGuard, roleGuard],
        data: { role: 'ADMIN' }
      },
      { path: 'users/new',
        loadComponent: () => import('./features/users/user-form.component').then(m => m.UserFormComponent),
        canActivate: [forcePasswordChangeGuard, roleGuard],
        data: { role: 'ADMIN' }
      },
      { path: 'users/:id/edit',
        loadComponent: () => import('./features/users/user-form.component').then(m => m.UserFormComponent),
        canActivate: [forcePasswordChangeGuard, roleGuard],
        data: { role: 'ADMIN' }
      },
      { path: '', redirectTo: 'profile', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
```

- [ ] **Step 2: Create `LoginComponent`**

`src/app/features/login/login.component.ts`:
```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <h1>AI Chat</h1>
        <h2>Sign In</h2>
        <form (ngSubmit)="onSubmit()">
          <label>Username</label>
          <input type="text" [(ngModel)]="username" name="username" required />
          <label>Password</label>
          <input type="password" [(ngModel)]="password" name="password" required />
          <div class="error" *ngIf="error">{{ error }}</div>
          <button type="submit" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9; }
    .login-card { background: white; padding: 2rem; border-radius: 8px; width: 360px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    h1 { margin: 0 0 .25rem; font-size: 1.5rem; color: #1e293b; }
    h2 { margin: 0 0 1.5rem; font-weight: normal; color: #64748b; font-size: 1rem; }
    label { display: block; margin-bottom: .25rem; font-size: .875rem; color: #374151; }
    input { width: 100%; padding: .5rem; border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 1rem; box-sizing: border-box; }
    button { width: 100%; padding: .75rem; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
    button:disabled { opacity: .6; }
    .error { color: #dc2626; font-size: .875rem; margin-bottom: .75rem; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.login(this.username, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.forcePasswordChange) {
          this.router.navigate(['/change-password']);
        } else {
          this.router.navigate(['/profile']);
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Invalid username or password';
      }
    });
  }
}
```

- [ ] **Step 3: Verify app compiles**

```bash
cd ai-chat-frontend
npx ng build 2>&1 | tail -10
```
Expected: `Build at:` line, no errors.

- [ ] **Step 4: Commit**

```bash
git add ai-chat-frontend/src/app/app.routes.ts ai-chat-frontend/src/app/features/login/
git commit -m "feat: add app routes and LoginComponent"
```

---

## Task 14: Change Password Feature

**Files:**
- Create: `ai-chat-frontend/src/app/features/change-password/change-password.component.ts`

- [ ] **Step 1: Create `ChangePasswordComponent`**

`src/app/features/change-password/change-password.component.ts`:
```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">
      <h2>Set Your Password</h2>
      <p class="hint">Your admin has assigned a temporary password. Please set a new one to continue.</p>
      <form (ngSubmit)="onSubmit()">
        <label>Current Password</label>
        <input type="password" [(ngModel)]="current" name="current" required />
        <label>New Password <span class="hint-inline">(min 8 characters)</span></label>
        <input type="password" [(ngModel)]="newPass" name="newPass" required minlength="8" />
        <label>Confirm New Password</label>
        <input type="password" [(ngModel)]="confirm" name="confirm" required />
        <div class="error" *ngIf="error">{{ error }}</div>
        <button type="submit" [disabled]="loading">
          {{ loading ? 'Saving...' : 'Set Password' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .page { max-width: 400px; margin: 3rem auto; }
    h2 { margin-bottom: .5rem; }
    .hint { color: #64748b; margin-bottom: 1.5rem; }
    .hint-inline { font-size: .75rem; color: #9ca3af; }
    label { display: block; margin-bottom: .25rem; font-size: .875rem; }
    input { width: 100%; padding: .5rem; border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 1rem; box-sizing: border-box; }
    button { padding: .75rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .error { color: #dc2626; font-size: .875rem; margin-bottom: .75rem; }
  `]
})
export class ChangePasswordComponent {
  current = '';
  newPass = '';
  confirm = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (this.newPass !== this.confirm) {
      this.error = 'Passwords do not match';
      return;
    }
    if (this.newPass.length < 8) {
      this.error = 'Password must be at least 8 characters';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.changePassword(this.current, this.newPass).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/profile']); },
      error: (e) => { this.loading = false; this.error = e.error?.error || 'Failed to change password'; }
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add ai-chat-frontend/src/app/features/change-password/
git commit -m "feat: add ChangePasswordComponent"
```

---

## Task 15: Profile Feature

**Files:**
- Create: `ai-chat-frontend/src/app/core/api/user-api.service.ts`
- Create: `ai-chat-frontend/src/app/features/profile/profile.component.ts`

- [ ] **Step 1: Create `UserApiService`**

`src/app/core/api/user-api.service.ts`:
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserResponse {
  id: string; username: string; email: string; role: string;
  forcePasswordChange: boolean; enabled: boolean;
  profilePictureUrl: string | null; linkedinUrl: string | null;
  createdAt: string; updatedAt: string;
}

export interface UserPage {
  content: UserResponse[]; page: number; size: number;
  totalElements: number; totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  constructor(private http: HttpClient) {}

  getMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>('/api/users/me');
  }

  updateProfile(linkedinUrl: string | null): Observable<UserResponse> {
    return this.http.put<UserResponse>('/api/users/me', { linkedinUrl });
  }

  uploadAvatar(file: File): Observable<UserResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UserResponse>('/api/users/me/avatar', form);
  }

  deleteAvatar(): Observable<UserResponse> {
    return this.http.delete<UserResponse>('/api/users/me/avatar');
  }

  listUsers(page = 0, size = 20, sort?: string): Observable<UserPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sort) params = params.set('sort', sort);
    return this.http.get<UserPage>('/api/users', { params });
  }

  createUser(body: { username: string; email: string; password: string; role: string }): Observable<UserResponse> {
    return this.http.post<UserResponse>('/api/users', body);
  }

  getUser(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`/api/users/${id}`);
  }

  updateUser(id: string, body: { email?: string; role?: string; enabled?: boolean }): Observable<UserResponse> {
    return this.http.put<UserResponse>(`/api/users/${id}`, body);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`);
  }
}
```

- [ ] **Step 2: Create `ProfileComponent`**

`src/app/features/profile/profile.component.ts`:
```typescript
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserApiService, UserResponse } from '../../core/api/user-api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page" *ngIf="user">
      <h2>My Profile</h2>

      <div class="avatar-section">
        <img *ngIf="user.profilePictureUrl" [src]="user.profilePictureUrl" alt="Avatar" class="avatar" />
        <div *ngIf="!user.profilePictureUrl" class="avatar-placeholder">{{ user.username[0].toUpperCase() }}</div>
        <div class="avatar-actions">
          <input type="file" #fileInput accept="image/jpeg,image/png,image/webp"
            (change)="onFileSelected($event)" style="display:none" />
          <button (click)="fileInput.click()">Upload Photo</button>
          <button *ngIf="user.profilePictureUrl" (click)="removeAvatar()" class="danger">Remove</button>
        </div>
        <div class="error" *ngIf="avatarError">{{ avatarError }}</div>
      </div>

      <div class="field-section">
        <label>Username</label>
        <span class="read-only">{{ user.username }}</span>

        <label>Email</label>
        <span class="read-only">{{ user.email }}</span>

        <label>Role</label>
        <span class="read-only">{{ user.role }}</span>

        <label>LinkedIn URL</label>
        <input type="url" [(ngModel)]="linkedinUrl" name="linkedinUrl"
          placeholder="https://linkedin.com/in/yourprofile" />
        <div class="error" *ngIf="linkedinError">{{ linkedinError }}</div>
        <button (click)="saveLinkedin()" [disabled]="saving">
          {{ saving ? 'Saving...' : 'Save LinkedIn' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 560px; margin: 0 auto; }
    h2 { margin-bottom: 2rem; }
    .avatar-section { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
    .avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
    .avatar-placeholder { width: 80px; height: 80px; border-radius: 50%; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; }
    .avatar-actions { display: flex; gap: .5rem; flex-direction: column; }
    .avatar-actions button { padding: .4rem .8rem; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; background: white; }
    .danger { color: #dc2626; border-color: #fca5a5 !important; }
    .field-section { display: grid; grid-template-columns: 140px 1fr; gap: .75rem; align-items: center; }
    .read-only { color: #374151; }
    input { padding: .5rem; border: 1px solid #d1d5db; border-radius: 4px; }
    button { padding: .5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; grid-column: 2; }
    .error { color: #dc2626; font-size: .875rem; grid-column: 2; }
  `]
})
export class ProfileComponent implements OnInit {
  user: UserResponse | null = null;
  linkedinUrl = '';
  saving = false;
  linkedinError = '';
  avatarError = '';

  constructor(private api: UserApiService) {}

  ngOnInit() {
    this.api.getMe().subscribe(u => {
      this.user = u;
      this.linkedinUrl = u.linkedinUrl ?? '';
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarError = '';
    this.api.uploadAvatar(file).subscribe({
      next: u => this.user = u,
      error: e => this.avatarError = e.error?.error || 'Upload failed'
    });
  }

  removeAvatar() {
    this.avatarError = '';
    this.api.deleteAvatar().subscribe({ next: u => this.user = u, error: () => this.avatarError = 'Failed to remove' });
  }

  saveLinkedin() {
    this.saving = true;
    this.linkedinError = '';
    this.api.updateProfile(this.linkedinUrl || null).subscribe({
      next: u => { this.user = u; this.saving = false; },
      error: e => { this.saving = false; this.linkedinError = e.error?.errors?.[0] || 'Save failed'; }
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add ai-chat-frontend/src/app/core/api/ ai-chat-frontend/src/app/features/profile/
git commit -m "feat: add UserApiService and ProfileComponent"
```

---

## Task 16: User Management Feature (ADMIN)

**Files:**
- Create: `ai-chat-frontend/src/app/features/users/user-list.component.ts`
- Create: `ai-chat-frontend/src/app/features/users/user-form.component.ts`

- [ ] **Step 1: Create `UserListComponent`**

`src/app/features/users/user-list.component.ts`:
```typescript
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserApiService, UserPage } from '../../core/api/user-api.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Users</h2>
        <a routerLink="/users/new" class="btn-primary">+ New User</a>
      </div>

      <table *ngIf="page">
        <thead>
          <tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of page.content">
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role }}</td>
            <td><span [class]="user.enabled ? 'badge-active' : 'badge-disabled'">{{ user.enabled ? 'Active' : 'Disabled' }}</span></td>
            <td>
              <a [routerLink]="['/users', user.id, 'edit']">Edit</a>
              <button (click)="disable(user.id)" *ngIf="user.enabled" class="link-btn danger">Disable</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" *ngIf="page && page.totalPages > 1">
        <button (click)="loadPage(currentPage - 1)" [disabled]="currentPage === 0">Previous</button>
        <span>Page {{ currentPage + 1 }} of {{ page.totalPages }}</span>
        <button (click)="loadPage(currentPage + 1)" [disabled]="currentPage >= page.totalPages - 1">Next</button>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: .75rem 1rem; border-bottom: 1px solid #e5e7eb; }
    th { font-size: .75rem; text-transform: uppercase; color: #6b7280; }
    .btn-primary { background: #2563eb; color: white; padding: .5rem 1rem; border-radius: 4px; text-decoration: none; }
    .badge-active { background: #d1fae5; color: #065f46; padding: .2rem .5rem; border-radius: 12px; font-size: .75rem; }
    .badge-disabled { background: #fee2e2; color: #991b1b; padding: .2rem .5rem; border-radius: 12px; font-size: .75rem; }
    a { color: #2563eb; text-decoration: none; margin-right: .5rem; }
    .link-btn { background: none; border: none; cursor: pointer; color: #2563eb; padding: 0; }
    .danger { color: #dc2626 !important; }
    .pagination { display: flex; gap: 1rem; align-items: center; margin-top: 1rem; }
  `]
})
export class UserListComponent implements OnInit {
  page: UserPage | null = null;
  currentPage = 0;

  constructor(private api: UserApiService) {}
  ngOnInit() { this.loadPage(0); }

  loadPage(p: number) {
    this.currentPage = p;
    this.api.listUsers(p).subscribe(page => this.page = page);
  }

  disable(id: string) {
    this.api.deleteUser(id).subscribe(() => this.loadPage(this.currentPage));
  }
}
```

- [ ] **Step 2: Create `UserFormComponent`**

`src/app/features/users/user-form.component.ts`:
```typescript
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserApiService, UserResponse } from '../../core/api/user-api.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">
      <h2>{{ isEdit ? 'Edit User' : 'New User' }}</h2>
      <form (ngSubmit)="onSubmit()">
        <ng-container *ngIf="!isEdit">
          <label>Username *</label>
          <input type="text" [(ngModel)]="form.username" name="username" required minlength="3" maxlength="50" />
          <label>Password * <span class="hint">(min 8 characters)</span></label>
          <input type="password" [(ngModel)]="form.password" name="password" required minlength="8" />
        </ng-container>
        <label>Email *</label>
        <input type="email" [(ngModel)]="form.email" name="email" required />
        <label>Role *</label>
        <select [(ngModel)]="form.role" name="role" required>
          <option value="USER">User</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>
        <ng-container *ngIf="isEdit">
          <label>Enabled</label>
          <select [(ngModel)]="form.enabled" name="enabled">
            <option [ngValue]="true">Active</option>
            <option [ngValue]="false">Disabled</option>
          </select>
        </ng-container>
        <div class="error" *ngIf="error">{{ error }}</div>
        <div class="actions">
          <button type="submit" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
          <button type="button" (click)="cancel()">Cancel</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page { max-width: 480px; margin: 0 auto; }
    h2 { margin-bottom: 1.5rem; }
    label { display: block; margin-bottom: .25rem; font-size: .875rem; color: #374151; }
    .hint { font-size: .75rem; color: #9ca3af; }
    input, select { width: 100%; padding: .5rem; border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 1rem; box-sizing: border-box; }
    .actions { display: flex; gap: .75rem; margin-top: .5rem; }
    button { padding: .5rem 1rem; border-radius: 4px; cursor: pointer; }
    button[type=submit] { background: #2563eb; color: white; border: none; }
    button[type=button] { background: white; border: 1px solid #d1d5db; }
    .error { color: #dc2626; font-size: .875rem; margin-bottom: .75rem; }
  `]
})
export class UserFormComponent implements OnInit {
  isEdit = false;
  userId = '';
  saving = false;
  error = '';
  form: any = { username: '', email: '', password: '', role: 'USER', enabled: true };

  constructor(
    private api: UserApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.params['id'];
    this.isEdit = !!this.userId;
    if (this.isEdit) {
      this.api.getUser(this.userId).subscribe(u => {
        this.form = { email: u.email, role: u.role, enabled: u.enabled };
      });
    }
  }

  onSubmit() {
    this.saving = true;
    this.error = '';
    const call = this.isEdit
      ? this.api.updateUser(this.userId, { email: this.form.email, role: this.form.role, enabled: this.form.enabled })
      : this.api.createUser({ username: this.form.username, email: this.form.email, password: this.form.password, role: this.form.role });

    call.subscribe({
      next: () => this.router.navigate(['/users']),
      error: (e) => { this.saving = false; this.error = e.error?.error || 'Save failed'; }
    });
  }

  cancel() { this.router.navigate(['/users']); }
}
```

- [ ] **Step 3: Commit**

```bash
git add ai-chat-frontend/src/app/features/users/
git commit -m "feat: add UserListComponent and UserFormComponent"
```

---

## Task 17: Build Integration + End-to-End Verification

**Goal:** Ensure `./gradlew bootJar` produces a single jar that includes the Angular SPA and serves it correctly.

- [ ] **Step 1: Build the frontend**

```bash
cd /Users/mkh/source/playground/ai-chat/ai-chat-frontend
npm run build
```
Expected: `dist/ai-chat-frontend/browser/index.html` exists.

- [ ] **Step 2: Run the Gradle build (copies Angular + packages jar)**

```bash
cd ../ai-chat-backen
DB_PASSWORD=aichat_dev JWT_SECRET=dev-secret ./gradlew bootJar
```
Expected: `build/libs/ai-chat-0.0.1-SNAPSHOT.jar` created.

- [ ] **Step 3: Verify Angular assets are inside the jar**

```bash
jar tf build/libs/ai-chat-0.0.1-SNAPSHOT.jar | grep "static/index.html"
```
Expected: `BOOT-INF/classes/static/index.html` listed.

- [ ] **Step 4: Start the jar and verify it serves both SPA and API**

```bash
DB_PASSWORD=aichat_dev JWT_SECRET=dev-secret \
  java -jar build/libs/ai-chat-0.0.1-SNAPSHOT.jar &
sleep 10
# API is protected
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/users
# SPA is served at root
curl -s http://localhost:8080/ | grep -c "<app-root"
kill %1
```
Expected: `401` for API, `1` (or more) for SPA.

- [ ] **Step 5: Run all backend tests one final time**

```bash
cd ai-chat-backen
./gradlew test 2>&1 | tail -15
```
Expected: `BUILD SUCCESSFUL`, all tests pass.

- [ ] **Step 6: Run Angular tests one final time**

```bash
cd ../ai-chat-frontend
npx ng test --watch=false --browsers=ChromeHeadless 2>&1 | tail -15
```
Expected: all Angular tests pass.

- [ ] **Step 7: Final commit**

```bash
cd /Users/mkh/source/playground/ai-chat
git add ai-chat-backen/build.gradle.kts ai-chat-frontend/
git commit -m "feat: complete sub-project 1 — user management, auth, roles, profile"
```

---

## Definition of Done

- [ ] All backend tests pass (Testcontainers integration tests + unit tests)
- [ ] All Angular tests pass
- [ ] `./gradlew bootJar` produces a working jar
- [ ] Login flow works end-to-end in browser
- [ ] `force_password_change` flow redirects and resolves correctly
- [ ] Admin can create, edit, and disable users
- [ ] Any authenticated user can update their profile, upload/delete avatar, set LinkedIn URL
- [ ] Avatar served at `/api/users/{id}/avatar` without authentication
- [ ] ADMIN-only routes return 403 for USER role
