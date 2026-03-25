# Spring Security Review & Fixes Design

**Date:** 2026-03-25
**Status:** Approved
**Approach:** Fix in place + eliminate redundant DB hit on `/me` (Option B)

---

## Problem Summary

The codebase has several Spring Security issues across three severity levels:

**Won't compile:**
- `AuthController.changePassword` and `AuthController.me` both reference the deleted `JwtAuthDetails` class
- `AuthController.me` uses `@AuthenticationPrincipal Authentication` (wrong type — should be `JwtPrincipal`)

**Security bug:**
- `UserController.getUser` and `AvatarController.uploadAvatar` use the SpEL expression `authentication.name == #id.toString()` which compares the **username string** against a **UUID string** — always false; user self-access is permanently broken

**Design issues:**
- `JwtAuthFilter` calls `TokenService` **five** separate times per request: one `isTokenValid()` call plus four individual `extract*()` calls, each parsing the JWT signature independently
- `AuthController.me` fetches the user from the DB even though all needed data is already in the JWT principal
- `SecurityConfig` has no `exceptionHandling` — 401/403 responses are HTML, not JSON
- `SecurityConfig` declares an unused `AuthenticationManager` bean
- `AuthController.buildAuthCookie` hardcodes `secure(false)` rather than reading from a property

---

## Design

### Section 1 — Core Data Model: `JwtPrincipal` + `TokenService`

**`JwtPrincipal`** gains two new fields so the principal carries the full session context:

```java
public record JwtPrincipal(UUID userId, String username, String role, boolean forcePasswordChange)
        implements Principal {
    @Override
    public String getName() { return username; }
}
```

**`TokenClaims`** is a new package-private record in the `auth` package — a thin data-transfer vessel between `TokenService` and `JwtAuthFilter`:

```java
record TokenClaims(UUID userId, String username, String role, boolean forcePasswordChange) {}
```

**`TokenService`** gets a new `extractAll(String token) → TokenClaims` method that:
1. Calls `parseClaims(token)` once (throwing `JwtException` on invalid/expired tokens)
2. Extracts all four fields from the resulting `Claims` object
3. Returns a `TokenClaims` record

This replaces both the `isTokenValid()` check and the four individual `extract*()` calls in the filter — the single `parseClaims` call inside `extractAll` serves as validation. The filter catches `JwtException` to handle invalid tokens. The existing individual `extract*` methods are **retained** (they are used directly in unit tests).

**`JwtAuthFilter`** is updated to replace the `isTokenValid()` + four `extract*()` calls with a single `try/catch` around `tokenService.extractAll(token)`:

```java
TokenClaims claims;
try {
    claims = tokenService.extractAll(token);
} catch (io.jsonwebtoken.JwtException e) {
    filterChain.doFilter(request, response);
    return;
}
// use claims.forcePasswordChange() for the force-change check
var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + claims.role()));
var authentication = new UsernamePasswordAuthenticationToken(
    new JwtPrincipal(claims.userId(), claims.username(), claims.role(), claims.forcePasswordChange()),
    null, authorities);
SecurityContextHolder.getContext().setAuthentication(authentication);
```

Note: `JwtAuthFilter` currently compiles correctly — it does not reference `JwtAuthDetails`. Its only changes are the `extractAll` optimisation and building the now-four-arg `JwtPrincipal`.

---

### Section 2 — `AuthController` Fixes

**`changePassword`** — switch to `@AuthenticationPrincipal JwtPrincipal principal`, guard with `principal == null`:

```java
public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                        HttpServletResponse httpResponse,
                                        @AuthenticationPrincipal JwtPrincipal principal) {
    if (principal == null) {
        return ResponseEntity.status(401).body(Map.of("error", INVALID_CREDENTIALS_ERROR));
    }
    UUID userId = principal.userId();
    // ... rest unchanged
}
```

**`me`** — switch to `@AuthenticationPrincipal JwtPrincipal principal`, **no DB call**:

```java
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
```

**Cookie `secure` flag** — `AuthController` gets a `boolean cookieSecure` injected via `@Value("${app.cookie.secure:false}")`. `buildAuthCookie` uses it instead of the hardcoded `false`. No `application.properties` change is required — the default is `false`, and production can override with `app.cookie.secure=true`.

**Imports** — remove stale `import org.springframework.security.core.Authentication`.

---

### Section 3 — `SecurityConfig` Hardening + SpEL Fixes

**JSON error responses** — add `exceptionHandling` with `ObjectMapper` injected into `SecurityConfig`.
`AuthenticationEntryPoint.commence` and `AccessDeniedHandler.handle` both declare `throws IOException`,
so `IOException` from `res.getWriter()` and `objectMapper.writeValue()` propagates naturally through
the interface declaration — no try-catch needed inside the lambdas:

```java
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
)
```

**Remove unused bean** — delete the `authenticationManager(AuthenticationConfiguration)` bean method from `SecurityConfig`.

**SpEL self-access fix** — `authentication.principal` is a `JwtPrincipal` record, so the fix uses
`.userId` and `.equals()` for value comparison (SpEL `==` is reference equality, not value equality):

- `UserController.getUser`:
  `@PreAuthorize("hasAnyRole('ADMIN','MODERATOR') or authentication.principal.userId.toString().equals(#id.toString())")`

- `AvatarController.uploadAvatar`:
  `@PreAuthorize("hasRole('ADMIN') or authentication.principal.userId.toString().equals(#id.toString())")`

---

## Files Changed

| File | Change |
|------|--------|
| `auth/JwtPrincipal.java` | Add `role` and `forcePasswordChange` fields |
| `auth/TokenClaims.java` | New package-private record |
| `auth/TokenService.java` | Add `extractAll()` method |
| `auth/JwtAuthFilter.java` | Replace `isTokenValid` + four `extract*` calls with single `extractAll`; build four-arg `JwtPrincipal` |
| `auth/AuthController.java` | Fix `changePassword` + `me`; inject `cookieSecure`; remove stale import |
| `config/SecurityConfig.java` | Add `exceptionHandling`; remove unused `AuthenticationManager` bean; inject `ObjectMapper` |
| `user/UserController.java` | Fix SpEL self-access expression |
| `user/AvatarController.java` | Fix SpEL self-access expression |

---

## Testing Notes

- `JwtAuthFilterTest` checks `auth.getName()` — still works because `JwtPrincipal.getName()` returns `username`
- **`JwtAuthFilterTest` stubs must be updated:** once `JwtAuthFilter` uses `extractAll()`, the four individual `when(tokenService.extract*(…))` stubs in each test must be replaced with a single `when(tokenService.extractAll(…)).thenReturn(new TokenClaims(…))` stub. Leaving the old stubs in place will cause them to be uncalled and potentially trigger Mockito strict-stub failures.
- The existing individual `extract*` methods in `TokenService` are retained, so any `TokenServiceTest` tests are unaffected.
- **Add a new `UserControllerTest.getUser_asSelf_returns200` test** to prove the SpEL fix works — set up an authenticated user whose `JwtPrincipal.userId` matches the path `{id}` and assert a `200` response. Without this, the bug could be re-introduced silently.
- **`AuthController.me` no-DB verification:** the `/me` endpoint no longer calls `UserRepository`. In a `@SpringBootTest` integration test this is invisible from the outside; verify by code inspection that no `userRepository` call remains in the `me` method. If a stricter assertion is desired, spy on `UserRepository` and assert zero interactions.
