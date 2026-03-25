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
- `JwtAuthFilter` calls `TokenService` four separate times per request, parsing the JWT four times
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

**`TokenService`** gets a new `extractAll(String token) → TokenClaims` method that parses the JWT signature **once** and returns all four fields. The existing individual `extract*` methods are retained (used in tests).

**`JwtAuthFilter`** is updated to call `tokenService.extractAll(token)` once, then build a `JwtPrincipal` from the result:

```java
TokenClaims claims = tokenService.extractAll(token);
// use claims.forcePasswordChange() for the force-change check
var authentication = new UsernamePasswordAuthenticationToken(
    new JwtPrincipal(claims.userId(), claims.username(), claims.role(), claims.forcePasswordChange()),
    null, authorities);
```

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

**JSON error responses** — add `exceptionHandling` with `ObjectMapper` injected into `SecurityConfig`:

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

**SpEL self-access fix** — `authentication.principal` is now a `JwtPrincipal`, so the correct expression uses `.userId`:

- `UserController.getUser`:
  `@PreAuthorize("hasAnyRole('ADMIN','MODERATOR') or authentication.principal.userId.toString() == #id.toString()")`

- `AvatarController.uploadAvatar`:
  `@PreAuthorize("hasRole('ADMIN') or authentication.principal.userId.toString() == #id.toString()")`

---

## Files Changed

| File | Change |
|------|--------|
| `auth/JwtPrincipal.java` | Add `role` and `forcePasswordChange` fields |
| `auth/TokenClaims.java` | New package-private record |
| `auth/TokenService.java` | Add `extractAll()` method |
| `auth/JwtAuthFilter.java` | Use `extractAll()` once; build full `JwtPrincipal` |
| `auth/AuthController.java` | Fix `changePassword` + `me`; inject `cookieSecure`; remove stale import |
| `config/SecurityConfig.java` | Add `exceptionHandling`; remove unused `AuthenticationManager` bean; inject `ObjectMapper` |
| `user/UserController.java` | Fix SpEL self-access expression |
| `user/AvatarController.java` | Fix SpEL self-access expression |

---

## Testing Notes

- `JwtAuthFilterTest` checks `auth.getName()` — still works because `JwtPrincipal.getName()` returns `username`
- `JwtAuthFilterTest` will need updating: the `JwtPrincipal` constructor call in assertions gains two new args (`role`, `forcePasswordChange`)
- The existing individual `extract*` methods in `TokenService` are retained, so `TokenServiceTest` (if any) is unaffected
- `AuthController` integration tests for `/me` should no longer expect a DB interaction
