# User Management + Auth + Roles — Design Spec

**Date:** 2026-03-24
**Sub-project:** 1 of 4 (User Management + Auth + Roles)
**Status:** Approved

---

## Overview

This spec covers the first sub-project of the AI Chat platform: user management, authentication, and role-based access control. It establishes the identity foundation that all other sub-projects depend on.

**Tech stack:**
- Backend: Spring Boot 4.0, Java 25, Spring Security, JPA/Hibernate, PostgreSQL
- Frontend: Angular 19 (standalone components), served from Spring Boot static resources
- Auth: JWT (stateless), bcrypt password hashing
- Infrastructure: Docker Compose for PostgreSQL

> **Note on directory name:** The existing backend directory is named `ai-chat-backen` (no trailing `d`) — this matches the existing project on disk and is intentional.

---

## Architecture

### Project Structure

```
ai-chat/
├── ai-chat-backen/                        (Spring Boot — existing skeleton)
│   └── src/main/
│       ├── java/com/alhashimi/ai/chat/
│       │   ├── auth/                      (JWT filter, token service, AuthController)
│       │   ├── user/                      (User entity, UserService, UserController)
│       │   ├── role/                      (Role enum)
│       │   └── config/                    (SecurityConfig, WebMvcConfig)
│       └── resources/
│           ├── application.properties
│           ├── db/migration/              (Flyway SQL scripts)
│           └── static/                    (Angular build output)
├── ai-chat-frontend/                      (new — Angular 19 app)
└── docker-compose.yml                     (new — PostgreSQL 16)
```

### Request Flow

```
Browser → Angular SPA → Spring Boot REST API (/api/**)
                            ├── JwtAuthFilter       (validates token, populates SecurityContext)
                            ├── SecurityConfig       (role-based access rules)
                            └── Controllers          (@PreAuthorize role checks)
```

### Build Integration

Angular is built with `ng build` (output to `dist/`). The Gradle build copies the Angular output into `src/main/resources/static/` before packaging the Spring Boot jar. Spring Boot serves:
- Angular SPA at `/` (and all non-`/api/**` paths, via `WebMvcConfig`)
- REST API at `/api/**`

**`WebMvcConfig` SPA forwarding rule:** All `GET` requests that do not begin with `/api/` and do not resolve to a static file are forwarded to `/index.html`. This ensures Angular's client-side router handles deep links correctly (e.g. a user navigating directly to `/users` receives `index.html` and Angular takes over).

---

## Data Model

```sql
CREATE TABLE users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username              VARCHAR(50)  NOT NULL UNIQUE,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    password              VARCHAR(255) NOT NULL,          -- bcrypt hashed
    role                  VARCHAR(20)  NOT NULL,          -- ADMIN | MODERATOR | USER
    force_password_change BOOLEAN      NOT NULL DEFAULT TRUE,
    enabled               BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP    NOT NULL DEFAULT now()
);
```

**Design decisions:**
- Single `role` column (not a join table): each user has exactly one role; a `Role` enum with `@Enumerated(EnumType.STRING)` handles mapping cleanly.
- `force_password_change`: set `true` on account creation by admin. The JWT filter rejects all requests except `POST /api/auth/change-password` until this is cleared.
- `enabled`: soft-delete — admins deactivate accounts rather than deleting them.
- UUID primary key: avoids sequential ID enumeration.
- `updated_at`: updated automatically via a JPA `@PreUpdate` lifecycle hook on the `User` entity (not a database trigger).

---

## Roles

| Role | Permissions in this sub-project |
|------|----------------------------------|
| `ADMIN` | Full access: all user management endpoints, own profile |
| `MODERATOR` | Same as `USER` in this sub-project. Elevated permissions are added in later sub-projects. |
| `USER` | Own profile (`GET /api/users/me`) and change-password only |

---

## API

### Response DTOs

**`UserResponse`** (returned by all user endpoints):
```json
{
  "id": "<uuid>",
  "username": "john",
  "email": "john@example.com",
  "role": "ADMIN",
  "forcePasswordChange": false,
  "enabled": true,
  "createdAt": "2026-03-24T10:00:00Z",
  "updatedAt": "2026-03-24T10:00:00Z"
}
```
`password` is never included in any response.

**`UserPage`** (returned by `GET /api/users`):
```json
{
  "content": [ /* array of UserResponse */ ],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3
}
```
Default pagination: `?page=0&size=20`. Supports `?sort=username,asc`.

### Auth

`POST /api/auth/login` — **public, no JWT required**

| Body | Response |
|------|----------|
| `{ username, password }` | `{ token, forcePasswordChange }` |

`POST /api/auth/change-password` — **requires valid JWT** (exempt from `forcePasswordChange` block)

| Body | Response |
|------|----------|
| `{ currentPassword, newPassword }` | `{ token, forcePasswordChange: false }` |

The caller is identified from the JWT `sub` claim. On success, `force_password_change` is set to `false` in the database and a new token (with `forcePasswordChange: false`) is returned so the client can replace the stored token without re-logging in. The response shape matches the login response.

### User Management (ADMIN only)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/api/users` | — | `UserPage` |
| `POST` | `/api/users` | `{ username, email, password, role }` | `UserResponse` (201 Created) |
| `GET` | `/api/users/{id}` | — | `UserResponse` |
| `PUT` | `/api/users/{id}` | `{ email, role, enabled }` | `UserResponse` |
| `DELETE` | `/api/users/{id}` | — | `204 No Content` (sets `enabled=false`) |

**`POST /api/users` — field rules:**
- `password`: required, minimum 8 characters. This is the temporary password the admin assigns; `force_password_change` is always set to `true` on creation.
- `username`: immutable after creation. The `PUT` endpoint does not accept `username` — this is intentional, not an omission.
- Hard delete is permanently out of scope. User records are never physically deleted; `enabled=false` is the only removal mechanism.

**Admin self-modification rules:**
- An ADMIN cannot change their own `role` or set their own `enabled` to `false` via `PUT /api/users/{id}` or `DELETE /api/users/{id}`.
- The system must prevent the last remaining `ADMIN` account from being demoted or disabled. Attempting either returns `409 Conflict` with `{ error: "Cannot remove the last admin account" }`.

### Profile (any authenticated user)

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/api/users/me` | `UserResponse` |

### JWT Token Structure

```json
{
  "sub": "<user-uuid>",
  "username": "john",
  "role": "ADMIN",
  "forcePasswordChange": false,
  "iat": 1711000000,
  "exp": 1711086400
}
```

Token expiry: **24 hours**. No refresh token — re-login on expiry.

---

## Angular Frontend

### Structure (Standalone Components, Angular 19)

```
ai-chat-frontend/src/app/
├── core/
│   ├── auth/
│   │   ├── auth.service.ts                  (login, logout, token storage)
│   │   ├── jwt.interceptor.ts               (attaches Bearer token to all requests)
│   │   ├── auth.guard.ts                    (blocks unauthenticated; redirects /login)
│   │   ├── force-password-change.guard.ts   (redirects to /change-password if forcePasswordChange=true)
│   │   └── role.guard.ts                    (blocks access by insufficient role)
│   └── api/
│       └── user-api.service.ts              (HTTP calls to /api/users)
├── layout/
│   └── shell/
│       └── shell.component.ts               (left sidebar + <router-outlet>)
├── features/
│   ├── login/
│   │   └── login.component.ts
│   ├── change-password/
│   │   └── change-password.component.ts
│   └── users/
│       ├── user-list.component.ts
│       └── user-form.component.ts           (create + edit)
└── app.routes.ts
```

### Routes

| Path | Component | Guards |
|------|-----------|--------|
| `/login` | `LoginComponent` | None (public) |
| `/change-password` | `ChangePasswordComponent` | `AuthGuard` only |
| `/*` (all other) | (various) | `AuthGuard` → `ForcePasswordChangeGuard` → `RoleGuard` (where applicable) |
| `/users` | `UserListComponent` | `AuthGuard` + `ForcePasswordChangeGuard` + `RoleGuard(ADMIN)` |
| `/users/new` | `UserFormComponent` | `AuthGuard` + `ForcePasswordChangeGuard` + `RoleGuard(ADMIN)` |
| `/users/:id/edit` | `UserFormComponent` | `AuthGuard` + `ForcePasswordChangeGuard` + `RoleGuard(ADMIN)` |

**`ForcePasswordChangeGuard`:** If the decoded JWT contains `forcePasswordChange: true`, this guard redirects any route (other than `/change-password`) to `/change-password`. This ensures users cannot access the application until they set a personal password after admin account creation.

### Auth Flow

1. User submits login form → `POST /api/auth/login`
2. On success, token stored in `localStorage` (known XSS trade-off; acceptable for this internal application — HttpOnly cookies would be more secure but require CSRF handling)
3. If `forcePasswordChange=true` → `ForcePasswordChangeGuard` redirects every route to `/change-password` until the password is changed and the new token is stored
4. `JwtInterceptor` attaches `Authorization: Bearer <token>` to every outbound request
5. On 401 response → clear token, redirect to `/login`

### Shell Layout

Left sidebar (always visible when authenticated):
- App logo / name at top
- Navigation links filtered by role (e.g. `/users` only shown to ADMIN)
- Logout button at bottom

---

## Infrastructure

### docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: aichat
      POSTGRES_USER: aichat
      POSTGRES_PASSWORD: aichat
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Database Migrations (Flyway)

Flyway manages all schema changes. `spring.jpa.hibernate.ddl-auto` is set to `validate` (never `update` in any environment).

Migration files live at `src/main/resources/db/migration/`:
```
V1__create_users_table.sql
```

### application.properties

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/aichat
spring.datasource.username=aichat
spring.datasource.password=aichat
spring.jpa.hibernate.ddl-auto=validate

spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration

jwt.secret=${JWT_SECRET}
jwt.expiration-ms=86400000
```

**Secret management:** `jwt.secret` is injected via the `JWT_SECRET` environment variable. The value must never be committed to version control. For local development, set it in a `.env` file or shell profile. `.env` must be listed in `.gitignore`.

---

## Error Handling

| Scenario | HTTP Status | Response body |
|----------|-------------|---------------|
| Wrong credentials | `401 Unauthorized` | `{ error: "Invalid username or password" }` |
| Disabled account login attempt | `401 Unauthorized` | `{ error: "Invalid username or password" }` (same message — avoids account enumeration) |
| Token missing/invalid | `401 Unauthorized` | `{ error: "Unauthorized" }` |
| Insufficient role | `403 Forbidden` | `{ error: "Access denied" }` |
| Username/email already exists | `409 Conflict` | `{ error: "Username already taken" }` |
| Last admin demotion/disable | `409 Conflict` | `{ error: "Cannot remove the last admin account" }` |
| Validation failure | `400 Bad Request` | `{ errors: [...] }` |

---

## Testing

- **Unit tests:** `UserService`, `TokenService` (JWT generation/validation), `AuthController` with mocked dependencies
- **Integration tests:** full request/response cycle for login, change-password, and user CRUD using `@SpringBootTest` with **Testcontainers PostgreSQL** (H2 is not used — Flyway migrations use `gen_random_uuid()` and PostgreSQL-specific syntax that H2 does not support)
- **Angular:** `AuthService`, `AuthGuard`, `ForcePasswordChangeGuard`, and `RoleGuard` tested with `TestBed`; HTTP interactions mocked via `HttpClientTestingModule`

---

## Out of Scope (this sub-project)

- AI chat functionality
- Billing / subscription management
- Admin system configuration panel
- Password reset via email
- Social login / SSO
- MODERATOR-specific permissions (defined in a later sub-project)
