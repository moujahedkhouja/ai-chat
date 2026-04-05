# AGENTS.md — AI Chat Codebase Guide

## Architecture Overview

Full-stack monorepo with two independent services:

- **`ai-chat-backen/`** — Spring Boot 4 / Java 25 REST API (port `8080`)
- **`ai-chat-frontend/`** — Angular 21 SPA (port `4200` in dev)
- **`docker-compose.yml`** — PostgreSQL 16 (`aichat` db, `aichat_dev` password)

**Production deployment:** Gradle's `processResources` task builds the Angular app and copies it into `ai-chat-backen/src/main/resources/static/`, so the backend serves the SPA from the same origin — no CORS needed in production.

**Dev mode:** Angular dev server proxies `/api/**` to `localhost:8080` via `ai-chat-frontend/proxy.conf.json`. CORS is enabled only when the Spring `dev` profile is active (`WebMvcConfig.DevCorsConfig`).

## Developer Workflows

```bash
# 1. Start the database
docker-compose up -d

# 2a. Backend only (dev)
cd ai-chat-backen
JWT_SECRET=<base64-encoded-256bit-key> ./gradlew bootRun

# 2b. Frontend dev server (separate terminal)
./start-frontend.sh          # or: cd ai-chat-frontend && npm run start

# 3. Full production build (Angular bundled into Spring Boot jar)
cd ai-chat-backen
./gradlew build              # runs buildFrontend → copyFrontend → processResources → bootJar

# 4. Backend tests (uses Testcontainers — Docker must be running)
cd ai-chat-backen
./gradlew test

# 5. Frontend tests
cd ai-chat-frontend
npm test
```

**Required env vars for backend:**
- `JWT_SECRET` — Base64-encoded HMAC-SHA key (mandatory, no default)
- `DB_PASSWORD` — defaults to `aichat_dev`
- `app.cookie.secure` — defaults to `false`; set `true` in production

## Backend Conventions

**Package layout:** `com.alhashimi.ai.chat.<domain>` — domains are `auth`, `user`, `role`, `config`.

**Security model:**
- Stateless JWT stored in `HttpOnly; SameSite=Strict` cookie named `auth_token`
- `JwtAuthFilter` reads the cookie, validates the token, and enforces `forcePasswordChange` — a user with that flag set is blocked from every endpoint **except** `POST /api/auth/change-password`
- Endpoint authorization uses `@PreAuthorize` on controllers (e.g. `hasRole('ADMIN')`, `hasAnyRole('ADMIN','MODERATOR')`)
- Public endpoints: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/users/{id}/avatar`

**Roles:** `ADMIN > MODERATOR > USER` (enum `com.alhashimi.ai.chat.role.Role`)

**Error responses** always follow `{ "error": "message" }` JSON shape via `GlobalExceptionHandler` (`@RestControllerAdvice`).

**Database:** Schema managed by Flyway (`src/main/resources/db/migration/`). `spring.jpa.hibernate.ddl-auto=validate` — never let Hibernate mutate the schema. Add new migrations as `V{n}__description.sql`.

**Entities use Lombok** (`@Builder`, `@Getter`, `@Setter`) + JPA lifecycle hooks (`@PrePersist`/`@PreUpdate`) for `createdAt`/`updatedAt`. `AllArgsConstructor` access is `PACKAGE` — always use the `@Builder`.

**Avatar upload:** Files stored on disk at `./uploads/avatars/` (relative to the working directory), served at `/api/users/{id}/avatar`. The `profilePicturePath` column stores the relative path; the frontend appends `?v=<path>` as a cache-buster.

## Frontend Conventions

**State management:** Angular `signal()` / `computed()` — **not** a state library. `AuthService.currentUser` is the canonical signal for the logged-in user. Deprecated `getX()` wrapper methods exist for backward compatibility; prefer the signal accessors (`role()`, `userId()`, etc.).

**HTTP:** All requests use `withCredentials: true` (cookie forwarding) via `authInterceptor`. No Bearer tokens in headers.

**Routing:** Two guards — `authGuard` (redirect to `/login` if unauthenticated) and `forcePasswordChangeGuard` (redirect to `/change-password` if flag is set). Feature routes are lazy-loaded except `DashboardComponent` and `ChangePasswordComponent`.

**i18n:** `@ngx-translate/core` with JSON files in `src/assets/i18n/{en,ar}.json`. Language persisted in `localStorage` under key `app_lang`. Always add keys to **both** locale files.

**Theming:** CSS class `theme-dark` / `theme-light` toggled on `<html>` by `ThemeService`. Default is `dark`. Persisted in `localStorage` under key `app_theme`.

**Chat history** is stored in `localStorage` keyed by username (`chat_history_<username>`), managed by `ChatHistoryService` (signals-based). `ChatService.sendMessage()` is currently a **stub** — wire it to `POST /api/chat/message` when the backend endpoint is implemented.

## Key Integration Points

| Frontend service | Backend endpoint |
|---|---|
| `AuthService.login` | `POST /api/auth/login` |
| `AuthService.loadCurrentUser` | `GET /api/auth/me` (called on app init) |
| `UserService.listUsers` | `GET /api/users?page=&size=` (paginated, ADMIN/MODERATOR) |
| `UserService.uploadAvatar` | `POST /api/users/{id}/avatar` (multipart) |
| `UserService.updateProfile` | `PUT /api/profile` |
| `ChatService.sendMessage` | `POST /api/chat/message` → Spring AI → LM Studio |

## Initial Seed Data

The admin user is seeded by `V2__seed_admin_user.sql`:
- **username:** `john` | **password:** `Moujahed@123` | **role:** `ADMIN`
- `forcePasswordChange = true` — must set a new password on first login

