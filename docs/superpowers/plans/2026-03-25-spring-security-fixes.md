# Spring Security Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all Spring Security issues in the codebase: compilation errors, self-access SpEL bug, JWT parsed 5× per request, redundant DB call in `/me`, missing JSON error responses, unused bean, and hardcoded cookie secure flag.

**Architecture:** Work bottom-up — fix the data model first (`JwtPrincipal`, `TokenClaims`, `TokenService`), then the filter, then the controller, then `SecurityConfig`, then SpEL. Each task compiles and all tests pass before moving to the next.

**Tech Stack:** Java 21, Spring Boot 3, Spring Security 6, JJWT (io.jsonwebtoken), JUnit 5, Mockito, Testcontainers + PostgreSQL for integration tests, Gradle (`./gradlew test`).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/main/java/com/alhashimi/ai/chat/auth/TokenClaims.java` | **Create** | Package-private record: userId, username, role, forcePasswordChange |
| `src/main/java/com/alhashimi/ai/chat/auth/JwtPrincipal.java` | **Modify** | Add `role` and `forcePasswordChange` fields |
| `src/main/java/com/alhashimi/ai/chat/auth/TokenService.java` | **Modify** | Add `extractAll(String token) → TokenClaims` |
| `src/main/java/com/alhashimi/ai/chat/auth/JwtAuthFilter.java` | **Modify** | Replace 5 TokenService calls with one `extractAll`; build 4-arg `JwtPrincipal` |
| `src/main/java/com/alhashimi/ai/chat/auth/AuthController.java` | **Modify** | Fix `changePassword`+`me`; inject `cookieSecure`; remove stale import |
| `src/main/java/com/alhashimi/ai/chat/config/SecurityConfig.java` | **Modify** | Add `exceptionHandling`; remove unused `AuthenticationManager` bean; inject `ObjectMapper` |
| `src/main/java/com/alhashimi/ai/chat/user/UserController.java` | **Modify** | Fix SpEL self-access expression |
| `src/main/java/com/alhashimi/ai/chat/user/AvatarController.java` | **Modify** | Fix SpEL self-access expression |
| `src/test/java/com/alhashimi/ai/chat/auth/TokenServiceTest.java` | **Modify** | Add `extractAll_returnsAllClaimsInOneCall` test |
| `src/test/java/com/alhashimi/ai/chat/auth/JwtAuthFilterTest.java` | **Modify** | Replace 5 individual stubs with single `extractAll` stub per test |
| `src/test/java/com/alhashimi/ai/chat/user/UserControllerTest.java` | **Modify** | Add `getUser_asSelf_returns200` test |

All paths are relative to `ai-chat-backen/`.

---

### Task 1: `TokenClaims` record + `TokenService.extractAll()`

**Files:**
- Create: `src/main/java/com/alhashimi/ai/chat/auth/TokenClaims.java`
- Modify: `src/main/java/com/alhashimi/ai/chat/auth/TokenService.java`
- Test: `src/test/java/com/alhashimi/ai/chat/auth/TokenServiceTest.java`

- [ ] **Step 1: Write a failing test for `extractAll`**

Open `src/test/java/com/alhashimi/ai/chat/auth/TokenServiceTest.java` and add this test after the existing ones:

```java
@Test
void extractAll_returnsAllClaims() {
    String token = tokenService.generateToken(testUser);

    TokenClaims claims = tokenService.extractAll(token);

    assertThat(claims.userId()).isEqualTo(testUser.getId());
    assertThat(claims.username()).isEqualTo("john");
    assertThat(claims.role()).isEqualTo("ADMIN");
    assertThat(claims.forcePasswordChange()).isFalse();
}
```

Also add the import at the top of the file: `import com.alhashimi.ai.chat.auth.TokenClaims;`

- [ ] **Step 2: Run test to verify it fails (won't compile yet)**

```bash
cd ai-chat-backen && ./gradlew test --tests "com.alhashimi.ai.chat.auth.TokenServiceTest.extractAll_returnsAllClaims" 2>&1 | tail -20
```

Expected: compile error — `TokenClaims` does not exist yet.

- [ ] **Step 3: Create `TokenClaims.java`**

Create `src/main/java/com/alhashimi/ai/chat/auth/TokenClaims.java`:

```java
package com.alhashimi.ai.chat.auth;

import java.util.UUID;

record TokenClaims(UUID userId, String username, String role, boolean forcePasswordChange) {}
```

- [ ] **Step 4: Add `extractAll()` to `TokenService`**

In `src/main/java/com/alhashimi/ai/chat/auth/TokenService.java`, add this method after `isTokenValid`:

```java
public TokenClaims extractAll(String token) {
    var claims = parseClaims(token);
    return new TokenClaims(
            UUID.fromString(claims.getSubject()),
            claims.get(CLAIM_USERNAME, String.class),
            claims.get(CLAIM_ROLE, String.class),
            claims.get(CLAIM_FORCE_PASSWORD_CHANGE, Boolean.class)
    );
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd ai-chat-backen && ./gradlew test --tests "com.alhashimi.ai.chat.auth.TokenServiceTest" 2>&1 | tail -20
```

Expected: all `TokenServiceTest` tests pass.

- [ ] **Step 6: Commit**

```bash
cd ai-chat-backen && git add src/main/java/com/alhashimi/ai/chat/auth/TokenClaims.java src/main/java/com/alhashimi/ai/chat/auth/TokenService.java src/test/java/com/alhashimi/ai/chat/auth/TokenServiceTest.java
git commit -m "feat: add TokenClaims record and TokenService.extractAll() for single-parse JWT extraction"
```

---

### Task 2: Widen `JwtPrincipal` + update `JwtAuthFilter`

**Files:**
- Modify: `src/main/java/com/alhashimi/ai/chat/auth/JwtPrincipal.java`
- Modify: `src/main/java/com/alhashimi/ai/chat/auth/JwtAuthFilter.java`
- Test: `src/test/java/com/alhashimi/ai/chat/auth/JwtAuthFilterTest.java`

- [ ] **Step 1: Update `JwtAuthFilterTest` stubs before changing the filter**

`JwtAuthFilter` currently calls `tokenService.isTokenValid()` + four `extract*` methods. Once the filter switches to `extractAll()`, those stubs become unused and Mockito strict stubbing will throw `UnnecessaryStubbingException`. Update the stubs now, before changing the filter, so the tests describe the new contract.

In `src/test/java/com/alhashimi/ai/chat/auth/JwtAuthFilterTest.java`:

1. Add import: `import com.alhashimi.ai.chat.auth.TokenClaims;`

2. Replace every test that stubs `isTokenValid` + individual `extract*` calls with a single `extractAll` stub. There are three such tests: `doFilterInternal_withValidToken_setsAuthentication`, `doFilterInternal_withForcePasswordChange_andNonChangePasswordPath_returns403`, and `doFilterInternal_withForcePasswordChange_andChangePasswordPath_setsAuthAndProceeds`.

For `doFilterInternal_withValidToken_setsAuthentication` — replace the arrange stubs:
```java
// Before:
when(tokenService.isTokenValid(VALID_TOKEN)).thenReturn(true);
when(tokenService.extractUserId(VALID_TOKEN)).thenReturn(USER_ID);
when(tokenService.extractUsername(VALID_TOKEN)).thenReturn("john");
when(tokenService.extractRole(VALID_TOKEN)).thenReturn("ADMIN");
when(tokenService.extractForcePasswordChange(VALID_TOKEN)).thenReturn(false);

// After:
when(tokenService.extractAll(VALID_TOKEN))
    .thenReturn(new TokenClaims(USER_ID, "john", "ADMIN", false));
```

For `doFilterInternal_withInvalidToken_doesNotSetAuthentication` — replace the single `isTokenValid` stub:
```java
// Before:
when(tokenService.isTokenValid("bad.token")).thenReturn(false);

// After:
when(tokenService.extractAll("bad.token"))
    .thenThrow(new io.jsonwebtoken.JwtException("invalid"));
```

Also add import: `import io.jsonwebtoken.JwtException;`

For `doFilterInternal_withForcePasswordChange_andNonChangePasswordPath_returns403` — replace stubs:
```java
// Before:
when(tokenService.isTokenValid(VALID_TOKEN)).thenReturn(true);
when(tokenService.extractUserId(VALID_TOKEN)).thenReturn(USER_ID);
when(tokenService.extractUsername(VALID_TOKEN)).thenReturn("john");
when(tokenService.extractRole(VALID_TOKEN)).thenReturn("USER");
when(tokenService.extractForcePasswordChange(VALID_TOKEN)).thenReturn(true);

// After:
when(tokenService.extractAll(VALID_TOKEN))
    .thenReturn(new TokenClaims(USER_ID, "john", "USER", true));
```

For `doFilterInternal_withForcePasswordChange_andChangePasswordPath_setsAuthAndProceeds` — same replacement:
```java
// Before:
when(tokenService.isTokenValid(VALID_TOKEN)).thenReturn(true);
when(tokenService.extractUserId(VALID_TOKEN)).thenReturn(USER_ID);
when(tokenService.extractUsername(VALID_TOKEN)).thenReturn("john");
when(tokenService.extractRole(VALID_TOKEN)).thenReturn("USER");
when(tokenService.extractForcePasswordChange(VALID_TOKEN)).thenReturn(true);

// After:
when(tokenService.extractAll(VALID_TOKEN))
    .thenReturn(new TokenClaims(USER_ID, "john", "USER", true));
```

- [ ] **Step 2: Run filter tests — expect failures (filter not updated yet)**

```bash
cd ai-chat-backen && ./gradlew test --tests "com.alhashimi.ai.chat.auth.JwtAuthFilterTest" 2>&1 | tail -30
```

Expected: tests fail with "Wanted but not invoked: tokenService.extractAll(…)" or similar Mockito errors — this confirms the stubs are correct for the new interface.

- [ ] **Step 3: Widen `JwtPrincipal` to carry `role` and `forcePasswordChange`**

Replace the contents of `src/main/java/com/alhashimi/ai/chat/auth/JwtPrincipal.java`:

```java
package com.alhashimi.ai.chat.auth;

import java.security.Principal;
import java.util.UUID;

public record JwtPrincipal(UUID userId, String username, String role, boolean forcePasswordChange)
        implements Principal {

    @Override
    public String getName() {
        return username;
    }
}
```

- [ ] **Step 4: Update `JwtAuthFilter` to use `extractAll`**

Replace the contents of `src/main/java/com/alhashimi/ai/chat/auth/JwtAuthFilter.java`:

```java
package com.alhashimi.ai.chat.auth;

import tools.jackson.databind.ObjectMapper;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    static final String CHANGE_PASSWORD_PATH = "/api/auth/change-password";

    private final TokenService tokenService;
    private final ObjectMapper objectMapper;

    public JwtAuthFilter(TokenService tokenService, ObjectMapper objectMapper) {
        this.tokenService = tokenService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("auth_token".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        TokenClaims claims;
        try {
            claims = tokenService.extractAll(token);
        } catch (JwtException e) {
            filterChain.doFilter(request, response);
            return;
        }

        // Enforce forcePasswordChange: block all requests except POST /api/auth/change-password
        if (claims.forcePasswordChange()) {
            String method = request.getMethod();
            String path = request.getServletPath();
            boolean isChangePasswordRequest = "POST".equals(method)
                    && CHANGE_PASSWORD_PATH.equals(path);

            if (!isChangePasswordRequest) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write(objectMapper.writeValueAsString(
                        Map.of("error", "Password change required")
                ));
                return;
            }
        }

        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + claims.role()));
        var authentication = new UsernamePasswordAuthenticationToken(
                new JwtPrincipal(claims.userId(), claims.username(), claims.role(), claims.forcePasswordChange()),
                null, authorities);

        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}
```

- [ ] **Step 5: Run all filter tests**

```bash
cd ai-chat-backen && ./gradlew test --tests "com.alhashimi.ai.chat.auth.JwtAuthFilterTest" 2>&1 | tail -20
```

Expected: all 5 tests pass.

- [ ] **Step 6: Commit**

```bash
cd ai-chat-backen && git add src/main/java/com/alhashimi/ai/chat/auth/JwtPrincipal.java src/main/java/com/alhashimi/ai/chat/auth/JwtAuthFilter.java src/test/java/com/alhashimi/ai/chat/auth/JwtAuthFilterTest.java
git commit -m "feat: widen JwtPrincipal to carry role+forcePasswordChange; JwtAuthFilter parses JWT once via extractAll"
```

---

### Task 3: Fix `AuthController` compilation errors + `me` DB removal + cookie secure flag

**Files:**
- Modify: `src/main/java/com/alhashimi/ai/chat/auth/AuthController.java`
- Test: `src/test/java/com/alhashimi/ai/chat/auth/AuthControllerTest.java` (existing tests cover this, no new tests needed)

- [ ] **Step 1: Verify the current compilation failure**

```bash
cd ai-chat-backen && ./gradlew compileJava 2>&1 | grep -i error | head -20
```

Expected: errors referencing `JwtAuthDetails` in `AuthController.java` on lines 71 and 110.

- [ ] **Step 2: Rewrite `AuthController.java`**

Replace the entire contents of `src/main/java/com/alhashimi/ai/chat/auth/AuthController.java`:

```java
package com.alhashimi.ai.chat.auth;

import com.alhashimi.ai.chat.user.User;
import com.alhashimi.ai.chat.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    private static final String INVALID_CREDENTIALS_ERROR = "Invalid username or password";
    private static final String WRONG_CURRENT_PASSWORD_ERROR = "Current password is incorrect";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final boolean cookieSecure;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          TokenService tokenService,
                          @Value("${app.cookie.secure:false}") boolean cookieSecure) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.cookieSecure = cookieSecure;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
                                   HttpServletResponse httpResponse) {
        User user = userRepository.findByUsername(request.username()).orElse(null);

        if (user == null || !user.isEnabled()) {
            return ResponseEntity.status(401).body(Map.of("error", INVALID_CREDENTIALS_ERROR));
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", INVALID_CREDENTIALS_ERROR));
        }

        String token = tokenService.generateToken(user);
        ResponseCookie cookie = buildAuthCookie(token, 86400);
        httpResponse.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.ok(new AuthResponse(
            user.getId().toString(),
            user.getUsername(),
            user.getRole().name(),
            user.isForcePasswordChange()
        ));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                            HttpServletResponse httpResponse,
                                            @AuthenticationPrincipal JwtPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", INVALID_CREDENTIALS_ERROR));
        }
        UUID userId = principal.userId();

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", WRONG_CURRENT_PASSWORD_ERROR));
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setForcePasswordChange(false);
        userRepository.save(user);

        String token = tokenService.generateToken(user);
        ResponseCookie cookie = buildAuthCookie(token, 86400);
        httpResponse.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.ok(new AuthResponse(
            user.getId().toString(),
            user.getUsername(),
            user.getRole().name(),
            false
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse httpResponse) {
        ResponseCookie cookie = buildAuthCookie("", 0);
        httpResponse.addHeader("Set-Cookie", cookie.toString());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal JwtPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", INVALID_CREDENTIALS_ERROR));
        }
        return ResponseEntity.ok(new AuthResponse(
            principal.userId().toString(),
            principal.username(),
            principal.role(),
            principal.forcePasswordChange()
        ));
    }

    private ResponseCookie buildAuthCookie(String token, int maxAge) {
        return ResponseCookie.from("auth_token", token)
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path("/")
            .maxAge(maxAge)
            .build();
    }
}
```

- [ ] **Step 3: Run `AuthControllerTest`**

```bash
cd ai-chat-backen && ./gradlew test --tests "com.alhashimi.ai.chat.auth.AuthControllerTest" 2>&1 | tail -20
```

Expected: all 8 tests pass.

- [ ] **Step 4: Commit**

```bash
cd ai-chat-backen && git add src/main/java/com/alhashimi/ai/chat/auth/AuthController.java
git commit -m "fix: AuthController — @AuthenticationPrincipal JwtPrincipal, remove DB call from /me, property-driven cookie secure flag"
```

---

### Task 4: `SecurityConfig` — JSON error responses + remove unused bean

**Files:**
- Modify: `src/main/java/com/alhashimi/ai/chat/config/SecurityConfig.java`
- Modify: `src/test/java/com/alhashimi/ai/chat/auth/AuthControllerTest.java` (tighten the 401/403 assertion)

- [ ] **Step 1: Tighten the `me_withoutCookie_returnsUnauthorized` assertion**

In `src/test/java/com/alhashimi/ai/chat/auth/AuthControllerTest.java`, find the test `me_withoutCookie_returnsUnauthorized` and update the assertion — once `exceptionHandling` is configured with a proper `AuthenticationEntryPoint`, unauthenticated requests to authenticated endpoints will always return `401`, not the current vague `401 or 403`:

```java
// Before:
assertThat(response.getStatusCode().value()).isIn(401, 403);

// After:
assertThat(response.getStatusCode().value()).isEqualTo(401);
```

- [ ] **Step 2: Run the test to verify it currently fails**

```bash
cd ai-chat-backen && ./gradlew test --tests "com.alhashimi.ai.chat.auth.AuthControllerTest.me_withoutCookie_returnsUnauthorized" 2>&1 | tail -20
```

Expected: FAIL — currently returns 403, not 401.

- [ ] **Step 3: Rewrite `SecurityConfig.java`**

Replace the entire contents of `src/main/java/com/alhashimi/ai/chat/config/SecurityConfig.java`:

```java
package com.alhashimi.ai.chat.config;

import com.alhashimi.ai.chat.auth.JwtAuthFilter;
import tools.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, ObjectMapper objectMapper) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/{id}/avatar").permitAll()
                // All other /api/** require authentication
                .requestMatchers("/api/**").authenticated()
                // Angular SPA — permit everything else
                .anyRequest().permitAll()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> {
                    res.setStatus(401);
                    res.setContentType("application/json");
                    objectMapper.writeValue(res.getWriter(), Map.of("error", "Unauthorized"));
                })
                .accessDeniedHandler((req, res, e) -> {
                    res.setStatus(403);
                    res.setContentType("application/json");
                    objectMapper.writeValue(res.getWriter(), Map.of("error", "Forbidden"));
                })
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

- [ ] **Step 4: Run `AuthControllerTest` and `UserControllerTest`**

```bash
cd ai-chat-backen && ./gradlew test --tests "com.alhashimi.ai.chat.auth.AuthControllerTest" --tests "com.alhashimi.ai.chat.user.UserControllerTest" 2>&1 | tail -20
```

Expected: all tests pass, including the now-strict `me_withoutCookie_returnsUnauthorized` test.

- [ ] **Step 5: Commit**

```bash
cd ai-chat-backen && git add src/main/java/com/alhashimi/ai/chat/config/SecurityConfig.java src/test/java/com/alhashimi/ai/chat/auth/AuthControllerTest.java
git commit -m "fix: SecurityConfig — JSON 401/403 error responses, remove unused AuthenticationManager bean"
```

---

### Task 5: Fix SpEL self-access expressions + add self-access test

**Files:**
- Modify: `src/main/java/com/alhashimi/ai/chat/user/UserController.java`
- Modify: `src/main/java/com/alhashimi/ai/chat/user/AvatarController.java`
- Modify: `src/test/java/com/alhashimi/ai/chat/user/UserControllerTest.java`

- [ ] **Step 1: Add the failing self-access test to `UserControllerTest`**

In `src/test/java/com/alhashimi/ai/chat/user/UserControllerTest.java`:

1. Add a field to capture the regular user's ID — add `private UUID regularUserId;` next to `private UUID adminUserId;`

2. In `setUp()`, after saving the regular user, capture its ID:
```java
// Replace this:
userRepository.save(User.builder()
        .username("regularuser")
        ...
        .build());

// With:
User regularUser = userRepository.save(User.builder()
        .username("regularuser")
        .email("regular@example.com")
        .password(passwordEncoder.encode("Regular1234"))
        .role(Role.USER)
        .enabled(true)
        .forcePasswordChange(false)
        .build());
regularUserId = regularUser.getId();
```

3. Add the new test at the end of the class:

```java
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd ai-chat-backen && ./gradlew test --tests "com.alhashimi.ai.chat.user.UserControllerTest.getUser_asSelf_returns200" 2>&1 | tail -20
```

Expected: FAIL with 403 — the current SpEL expression `authentication.name == #id.toString()` always evaluates false for regular users.

- [ ] **Step 3: Fix the SpEL expression in `UserController`**

In `src/main/java/com/alhashimi/ai/chat/user/UserController.java`, update line 39:

```java
// Before:
@PreAuthorize("hasAnyRole('ADMIN','MODERATOR') or authentication.name == #id.toString()")

// After:
@PreAuthorize("hasAnyRole('ADMIN','MODERATOR') or authentication.principal.userId.toString().equals(#id.toString())")
```

- [ ] **Step 4: Fix the SpEL expression in `AvatarController`**

In `src/main/java/com/alhashimi/ai/chat/user/AvatarController.java`, update line 30:

```java
// Before:
@PreAuthorize("hasRole('ADMIN') or authentication.name == #id.toString()")

// After:
@PreAuthorize("hasRole('ADMIN') or authentication.principal.userId.toString().equals(#id.toString())")
```

- [ ] **Step 5: Run the full test suite**

```bash
cd ai-chat-backen && ./gradlew test 2>&1 | tail -30
```

Expected: all tests pass, including the new `getUser_asSelf_returns200`.

- [ ] **Step 6: Commit**

```bash
cd ai-chat-backen && git add src/main/java/com/alhashimi/ai/chat/user/UserController.java src/main/java/com/alhashimi/ai/chat/user/AvatarController.java src/test/java/com/alhashimi/ai/chat/user/UserControllerTest.java
git commit -m "fix: correct SpEL self-access expressions to use principal.userId.equals(); add getUser_asSelf_returns200 test"
```
