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
- Angular SPA at `/` (and all non-API paths via a catch-all forward)
- REST API at `/api/**`

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

---

## Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Full access: manage users, system configuration |
| `MODERATOR` | Elevated access: moderate content (scope expanded in later sub-projects) |
| `USER` | Standard access: use the chat application |

---

## API

### Auth (public)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/auth/login` | `{ username, password }` | `{ token, forcePasswordChange }` |
| `POST` | `/api/auth/change-password` | `{ currentPassword, newPassword }` | `200 OK` |

### User Management (ADMIN only)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/api/users` | — | Paginated list of users |
| `POST` | `/api/users` | `{ username, email, password, role }` | Created user |
| `GET` | `/api/users/{id}` | — | User detail |
| `PUT` | `/api/users/{id}` | `{ email, role, enabled }` | Updated user |
| `DELETE` | `/api/users/{id}` | — | Deactivates user (sets `enabled=false`) |

### Profile (any authenticated user)

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/api/users/me` | Own profile |

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
│   │   ├── auth.service.ts          (login, logout, token storage)
│   │   ├── jwt.interceptor.ts       (attaches Bearer token to all requests)
│   │   ├── auth.guard.ts            (blocks unauthenticated access)
│   │   └── role.guard.ts            (blocks access by insufficient role)
│   └── api/
│       └── user-api.service.ts      (HTTP calls to /api/users)
├── layout/
│   └── shell/
│       └── shell.component.ts       (left sidebar + <router-outlet>)
├── features/
│   ├── login/
│   │   └── login.component.ts
│   ├── change-password/
│   │   └── change-password.component.ts
│   └── users/
│       ├── user-list.component.ts
│       └── user-form.component.ts   (create + edit)
└── app.routes.ts
```

### Routes

| Path | Component | Guard |
|------|-----------|-------|
| `/login` | `LoginComponent` | None (public) |
| `/change-password` | `ChangePasswordComponent` | `AuthGuard` |
| `/users` | `UserListComponent` | `AuthGuard` + `RoleGuard(ADMIN)` |
| `/users/new` | `UserFormComponent` | `AuthGuard` + `RoleGuard(ADMIN)` |
| `/users/:id/edit` | `UserFormComponent` | `AuthGuard` + `RoleGuard(ADMIN)` |

### Auth Flow

1. User submits login form → `POST /api/auth/login`
2. On success, token stored in `localStorage`
3. If `forcePasswordChange=true` → redirect to `/change-password` (all other routes blocked until resolved)
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

### application.properties additions

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/aichat
spring.datasource.username=aichat
spring.datasource.password=aichat
spring.jpa.hibernate.ddl-auto=validate

spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration

jwt.secret=<generated-256-bit-secret>
jwt.expiration-ms=86400000
```

---

## Error Handling

| Scenario | HTTP Status | Response body |
|----------|-------------|---------------|
| Wrong credentials | `401 Unauthorized` | `{ error: "Invalid username or password" }` |
| Token missing/invalid | `401 Unauthorized` | `{ error: "Unauthorized" }` |
| Insufficient role | `403 Forbidden` | `{ error: "Access denied" }` |
| Username/email already exists | `409 Conflict` | `{ error: "Username already taken" }` |
| Validation failure | `400 Bad Request` | `{ errors: [...] }` |

---

## Testing

- **Unit tests:** `UserService`, `TokenService` (JWT generation/validation), `AuthController` with mocked dependencies
- **Integration tests:** full request/response cycle for login, change-password, and user CRUD using `@SpringBootTest` with H2 or Testcontainers PostgreSQL
- **Angular:** `AuthService` and guards tested with `TestBed`; HTTP interactions mocked via `HttpClientTestingModule`

---

## Out of Scope (this sub-project)

- AI chat functionality
- Billing / subscription management
- Admin system configuration panel
- Password reset via email
- Social login / SSO
