# Profile Self-Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow any logged-in user to update their own username, email, and password from the Profile page, with duplicate-name/email validation returning HTTP 409 and a fresh JWT issued on success.

**Architecture:** A new `ProfileController` (`GET /api/profile`, `PUT /api/profile`) operates on the caller's identity from `JwtPrincipal` — no path variable needed. `updateProfile` is added to `UserService` and checks for username/email conflicts before saving. On success the backend re-issues a JWT cookie (same as `change-password`) so the token stays fresh. The frontend `ProfileComponent` is rebuilt with two reactive forms: one for account info (username + email) and one for password change (reuses the existing `POST /api/auth/change-password` endpoint). The profile nav icon is removed from the sidebar — profile is only reachable via the avatar button at the bottom.

**Tech Stack:** Spring Boot 3 / Java 21 / Spring Security (backend); Angular 21 standalone components + ReactiveFormsModule (frontend); existing `JwtPrincipal`, `UsernameAlreadyExistsException`, `EmailAlreadyExistsException`, `GlobalExceptionHandler`.

---

## File Map

| File | Change |
|------|--------|
| `ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UpdateProfileRequest.java` | **Create** — DTO record |
| `ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UserService.java` | **Modify** — add `updateProfile` method |
| `ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/ProfileController.java` | **Create** — `GET /api/profile` + `PUT /api/profile` |
| `ai-chat-backen/src/test/java/com/alhashimi/ai/chat/user/UserServiceTest.java` | **Modify** — add `updateProfile` tests |
| `ai-chat-backen/src/test/java/com/alhashimi/ai/chat/user/ProfileControllerTest.java` | **Create** — integration tests |
| `ai-chat-frontend/src/app/core/user.service.ts` | **Modify** — add `updateProfile` method |
| `ai-chat-frontend/src/app/features/profile/profile.component.ts` | **Modify** — two-form layout |
| `ai-chat-frontend/src/app/features/profile/profile.component.html` | **Modify** — account info + password sections |
| `ai-chat-frontend/src/app/features/profile/profile.component.scss` | **Modify** — styles |
| `ai-chat-frontend/src/app/shared/components/sidebar/sidebar.component.html` | **Modify** — remove profile nav link |

---

## Task 1: Backend — UpdateProfileRequest DTO

**Files:**
- Create: `ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UpdateProfileRequest.java`

- [ ] **Step 1: Create the DTO**

```java
package com.alhashimi.ai.chat.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 50) String username,
        @NotBlank @Email String email
) {}
```

- [ ] **Step 2: Commit**

```bash
git add ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UpdateProfileRequest.java
git commit -m "feat: add UpdateProfileRequest DTO"
```

---

## Task 2: Backend — UserService.updateProfile

**Files:**
- Modify: `ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UserService.java`

- [ ] **Step 1: Write the failing tests first**

Open `ai-chat-backen/src/test/java/com/alhashimi/ai/chat/user/UserServiceTest.java`. Add these three tests inside the existing class (after existing tests):

```java
@Test
void updateProfile_withNewUniqueUsernameAndEmail_updatesAndReturns() {
    UUID id = UUID.randomUUID();
    User user = new User();
    user.setId(id);
    user.setUsername("oldname");
    user.setEmail("old@example.com");
    UpdateProfileRequest request = new UpdateProfileRequest("newname", "new@example.com");

    when(userRepository.findById(id)).thenReturn(Optional.of(user));
    when(userRepository.existsByUsername("newname")).thenReturn(false);
    when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
    when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    UserResponse result = userService.updateProfile(id, request);

    assertThat(result.username()).isEqualTo("newname");
    assertThat(result.email()).isEqualTo("new@example.com");
    verify(userRepository).save(any(User.class));
}

@Test
void updateProfile_withSameUsernameAndEmail_doesNotCheckDuplicates() {
    UUID id = UUID.randomUUID();
    User user = new User();
    user.setId(id);
    user.setUsername("samename");
    user.setEmail("same@example.com");
    UpdateProfileRequest request = new UpdateProfileRequest("samename", "same@example.com");

    when(userRepository.findById(id)).thenReturn(Optional.of(user));
    when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    UserResponse result = userService.updateProfile(id, request);

    assertThat(result.username()).isEqualTo("samename");
    verify(userRepository, never()).existsByUsername(any());
    verify(userRepository, never()).existsByEmail(any());
}

@Test
void updateProfile_withTakenUsername_throwsUsernameAlreadyExistsException() {
    UUID id = UUID.randomUUID();
    User user = new User();
    user.setId(id);
    user.setUsername("oldname");
    user.setEmail("old@example.com");
    UpdateProfileRequest request = new UpdateProfileRequest("taken", "old@example.com");

    when(userRepository.findById(id)).thenReturn(Optional.of(user));
    when(userRepository.existsByUsername("taken")).thenReturn(true);

    assertThatThrownBy(() -> userService.updateProfile(id, request))
            .isInstanceOf(UsernameAlreadyExistsException.class);
    verify(userRepository, never()).save(any());
}

@Test
void updateProfile_withTakenEmail_throwsEmailAlreadyExistsException() {
    UUID id = UUID.randomUUID();
    User user = new User();
    user.setId(id);
    user.setUsername("oldname");
    user.setEmail("old@example.com");
    UpdateProfileRequest request = new UpdateProfileRequest("oldname", "taken@example.com");

    when(userRepository.findById(id)).thenReturn(Optional.of(user));
    when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

    assertThatThrownBy(() -> userService.updateProfile(id, request))
            .isInstanceOf(EmailAlreadyExistsException.class);
    verify(userRepository, never()).save(any());
}
```

- [ ] **Step 2: Run tests — expect FAIL (method not yet defined)**

```bash
cd ai-chat-backen && ./gradlew test --tests "*UserServiceTest*" -q 2>&1 | tail -15
```
Expected: compilation error or test failures because `updateProfile` does not exist yet.

- [ ] **Step 3: Add the method to UserService** — insert after `resetPassword`:

```java
public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

    if (!user.getUsername().equals(request.username())) {
        if (userRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException(request.username());
        }
        user.setUsername(request.username());
    }

    if (!user.getEmail().equals(request.email())) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }
        user.setEmail(request.email());
    }

    return UserResponse.from(userRepository.save(user));
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd ai-chat-backen && ./gradlew test --tests "*UserServiceTest*" -q 2>&1 | tail -15
```
Expected: BUILD SUCCESSFUL, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UserService.java \
        ai-chat-backen/src/test/java/com/alhashimi/ai/chat/user/UserServiceTest.java
git commit -m "feat: add updateProfile to UserService with username/email conflict checks"
```

---

## Task 3: Backend — ProfileController

**Files:**
- Create: `ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/ProfileController.java`
- Create: `ai-chat-backen/src/test/java/com/alhashimi/ai/chat/user/ProfileControllerTest.java`

- [ ] **Step 1: Write the integration tests first**

Create `ai-chat-backen/src/test/java/com/alhashimi/ai/chat/user/ProfileControllerTest.java`.

Look at `UserControllerTest.java` to understand the test setup (MockMvc, `@SpringBootTest`, authentication helper methods). Then write:

```java
package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.auth.AuthResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProfileControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;

    private String authCookie;
    private String userId;

    @BeforeEach
    void setUp() throws Exception {
        // Register and log in as a regular user
        String loginBody = """
            {"username":"profileuser","password":"Password1!"}
            """;
        // Create the user first via the repository directly
        User user = new User();
        user.setUsername("profileuser");
        user.setEmail("profileuser@example.com");
        user.setPassword("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG"); // "Password1!" bcrypt
        user.setRole(com.alhashimi.ai.chat.role.Role.USER);
        user.setEnabled(true);
        user.setForcePasswordChange(false);
        User saved = userRepository.save(user);
        userId = saved.getId().toString();

        var loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginBody))
            .andExpect(status().isOk())
            .andReturn();
        authCookie = loginResult.getResponse().getHeader("Set-Cookie");
    }

    @Test
    void getProfile_authenticated_returns200WithCurrentUser() throws Exception {
        mockMvc.perform(get("/api/profile")
                .header("Cookie", authCookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username", is("profileuser")))
            .andExpect(jsonPath("$.email", is("profileuser@example.com")));
    }

    @Test
    void getProfile_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/profile"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void updateProfile_withUniqueValues_returns200AndUpdatedUser() throws Exception {
        String body = """
            {"username":"newname","email":"new@example.com"}
            """;
        mockMvc.perform(put("/api/profile")
                .header("Cookie", authCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username", is("newname")))
            .andExpect(jsonPath("$.email", is("new@example.com")));
    }

    @Test
    void updateProfile_withTakenUsername_returns409() throws Exception {
        // Create a second user who owns the username we want
        User other = new User();
        other.setUsername("taken");
        other.setEmail("taken@example.com");
        other.setPassword("irrelevant");
        other.setRole(com.alhashimi.ai.chat.role.Role.USER);
        other.setEnabled(true);
        other.setForcePasswordChange(false);
        userRepository.save(other);

        String body = """
            {"username":"taken","email":"profileuser@example.com"}
            """;
        mockMvc.perform(put("/api/profile")
                .header("Cookie", authCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isConflict());
    }

    @Test
    void updateProfile_withTakenEmail_returns409() throws Exception {
        User other = new User();
        other.setUsername("otherone");
        other.setEmail("taken@example.com");
        other.setPassword("irrelevant");
        other.setRole(com.alhashimi.ai.chat.role.Role.USER);
        other.setEnabled(true);
        other.setForcePasswordChange(false);
        userRepository.save(other);

        String body = """
            {"username":"profileuser","email":"taken@example.com"}
            """;
        mockMvc.perform(put("/api/profile")
                .header("Cookie", authCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isConflict());
    }

    @Test
    void updateProfile_withBlankUsername_returns400() throws Exception {
        String body = """
            {"username":"","email":"valid@example.com"}
            """;
        mockMvc.perform(put("/api/profile")
                .header("Cookie", authCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest());
    }

    @Test
    void updateProfile_unauthenticated_returns401() throws Exception {
        String body = """
            {"username":"any","email":"any@example.com"}
            """;
        mockMvc.perform(put("/api/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 2: Run tests — expect compilation error (ProfileController doesn't exist yet)**

```bash
cd ai-chat-backen && ./gradlew test --tests "*ProfileControllerTest*" -q 2>&1 | tail -15
```
Expected: compilation or 404 failures.

- [ ] **Step 3: Create ProfileController**

```java
package com.alhashimi.ai.chat.user;

import com.alhashimi.ai.chat.auth.AuthResponse;
import com.alhashimi.ai.chat.auth.JwtPrincipal;
import com.alhashimi.ai.chat.auth.TokenService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserService userService;
    private final TokenService tokenService;
    private final boolean cookieSecure;

    public ProfileController(UserService userService,
                             TokenService tokenService,
                             @Value("${app.cookie.secure:false}") boolean cookieSecure) {
        this.userService = userService;
        this.tokenService = tokenService;
        this.cookieSecure = cookieSecure;
    }

    @GetMapping
    public ResponseEntity<UserResponse> getProfile(
            @AuthenticationPrincipal JwtPrincipal principal) {
        return ResponseEntity.ok(userService.getUser(principal.userId()));
    }

    @PutMapping
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request,
            HttpServletResponse httpResponse) {
        UserResponse updated = userService.updateProfile(principal.userId(), request);

        // Re-issue JWT so username in token stays current
        User user = userService.getRawUser(principal.userId());
        String token = tokenService.generateToken(user);
        ResponseCookie cookie = ResponseCookie.from("auth_token", token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/")
                .maxAge(86400)
                .build();
        httpResponse.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.ok(updated);
    }
}
```

- [ ] **Step 4: Add `getRawUser` to UserService** (needed by ProfileController to get the `User` entity for token generation — insert after `getUser`):

```java
@Transactional(readOnly = true)
public User getRawUser(UUID id) {
    return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
}
```

- [ ] **Step 5: Compile**

```bash
cd ai-chat-backen && ./gradlew compileJava -q 2>&1 | tail -10
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd ai-chat-backen && ./gradlew test --tests "*ProfileControllerTest*" -q 2>&1 | tail -15
```
Expected: BUILD SUCCESSFUL, 6 tests pass. If `setUp` fails because of the hardcoded bcrypt hash, replace the password hash with a freshly-encoded one or refactor to use the existing `PasswordEncoder` bean via `@Autowired`.

- [ ] **Step 7: Run full test suite**

```bash
cd ai-chat-backen && ./gradlew test -q 2>&1 | tail -10
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 8: Commit**

```bash
git add ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/ProfileController.java \
        ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UserService.java \
        ai-chat-backen/src/test/java/com/alhashimi/ai/chat/user/ProfileControllerTest.java
git commit -m "feat: add GET/PUT /api/profile endpoint with username/email conflict checks"
```

---

## Task 4: Frontend — user.service.ts updateProfile

**Files:**
- Modify: `ai-chat-frontend/src/app/core/user.service.ts`

- [ ] **Step 1: Add the interface and method**

At the top of the file, add the interface (after `UpdateUserRequest`):

```typescript
export interface UpdateProfileRequest {
  username: string;
  email: string;
}
```

Then add this method after `adminResetPassword`:

```typescript
updateProfile(request: UpdateProfileRequest): Observable<UserResponse> {
  return this.http.put<UserResponse>('/api/profile', request);
}

getProfile(): Observable<UserResponse> {
  return this.http.get<UserResponse>('/api/profile');
}
```

- [ ] **Step 2: Add a test to user.service.spec.ts**

Open `ai-chat-frontend/src/app/core/user.service.spec.ts` and add:

```typescript
it('should PUT to /api/profile with username and email', () => {
  service.updateProfile({ username: 'newname', email: 'new@test.com' }).subscribe();

  const req = httpMock.expectOne('/api/profile');
  expect(req.request.method).toBe('PUT');
  expect(req.request.body).toEqual({ username: 'newname', email: 'new@test.com' });
  req.flush({ id: '1', username: 'newname', email: 'new@test.com' });
});

it('should GET /api/profile', () => {
  service.getProfile().subscribe();

  const req = httpMock.expectOne('/api/profile');
  expect(req.request.method).toBe('GET');
  req.flush({ id: '1', username: 'me', email: 'me@test.com' });
});
```

- [ ] **Step 3: Run frontend tests**

```bash
cd ai-chat-frontend && npx ng test --watch=false --browsers=ChromeHeadless 2>&1 | tail -10
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add ai-chat-frontend/src/app/core/user.service.ts \
        ai-chat-frontend/src/app/core/user.service.spec.ts
git commit -m "feat: add updateProfile and getProfile to frontend UserService"
```

---

## Task 5: Frontend — Remove profile nav icon from sidebar

**Files:**
- Modify: `ai-chat-frontend/src/app/shared/components/sidebar/sidebar.component.html`

- [ ] **Step 1: Remove the profile nav link**

In the sidebar nav, find and delete this block (the entire `<a>` element for profile):

```html
    <a class="nav-item" routerLink="/profile" routerLinkActive="active" title="Profile">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6.5" r="3" fill="currentColor"/>
        <path d="M2 16c0-3.314 3.134-5.5 7-5.5s7 2.186 7 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </a>
```

The profile remains accessible via the avatar button at the bottom of the sidebar (already changed to `routerLink="/profile"`).

- [ ] **Step 2: Commit**

```bash
git add ai-chat-frontend/src/app/shared/components/sidebar/sidebar.component.html
git commit -m "feat: remove profile nav icon from sidebar (accessible via avatar button)"
```

---

## Task 6: Frontend — ProfileComponent TypeScript

**Files:**
- Modify: `ai-chat-frontend/src/app/features/profile/profile.component.ts`

Replace the entire file with:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../core/user.service';
import { UserResponse } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: UserResponse | null = null;

  private fb = inject(FormBuilder);

  infoForm = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]]
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  infoLoading = false;
  infoSuccess = '';
  infoError = '';

  passwordLoading = false;
  passwordSuccess = '';
  passwordError = '';

  showCurrentPassword = false;
  showNewPassword = false;

  avatarUploading = false;
  avatarError = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.infoForm.patchValue({ username: user.username, email: user.email });
      },
      error: () => this.infoError = 'Failed to load profile'
    });
  }

  onSaveInfo() {
    if (this.infoForm.invalid) return;
    this.infoLoading = true;
    this.infoSuccess = '';
    this.infoError = '';
    const { username, email } = this.infoForm.value;
    this.userService.updateProfile({ username: username!, email: email! }).subscribe({
      next: (updated) => {
        this.user = updated;
        this.infoSuccess = 'Profile updated';
        this.infoLoading = false;
        // Update the AuthService in-memory state to reflect new username
        this.authService.refreshFromProfile(updated);
      },
      error: (err) => {
        this.infoError = err?.error?.error ?? 'Failed to update profile';
        this.infoLoading = false;
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;
    this.passwordLoading = true;
    this.passwordSuccess = '';
    this.passwordError = '';
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.http.post('/api/auth/change-password', { currentPassword, newPassword }).subscribe({
      next: () => {
        this.passwordSuccess = 'Password changed successfully';
        this.passwordForm.reset();
        this.passwordLoading = false;
      },
      error: (err) => {
        this.passwordError = err?.error?.error ?? 'Failed to change password';
        this.passwordLoading = false;
      }
    });
  }

  onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.user) return;
    this.avatarUploading = true;
    this.avatarError = '';
    this.userService.uploadAvatar(this.user.id, file).subscribe({
      next: (updated) => {
        this.user = updated;
        this.avatarUploading = false;
      },
      error: () => {
        this.avatarError = 'Failed to upload avatar';
        this.avatarUploading = false;
      }
    });
  }

  getAvatarUrl(): string | null {
    if (!this.user?.profilePicturePath) return null;
    return `/uploads/${this.user.profilePicturePath}`;
  }
}
```

**Note:** `authService.refreshFromProfile(updated)` is a new method we'll add to `AuthService` in the next step to update the in-memory username after a profile update.

- [ ] **Step 1: Add `refreshFromProfile` to AuthService**

Open `ai-chat-frontend/src/app/auth/auth.service.ts`. Read the file to understand how `currentUserSubject` / `setCurrentUser` works, then add:

```typescript
refreshFromProfile(user: UserResponse): void {
  const current = this.currentUserSubject.value;
  if (current) {
    this.currentUserSubject.next({ ...current, username: user.username });
  }
}
```

Import `UserResponse` if not already imported.

- [ ] **Step 2: Write the component file**

Create/replace `ai-chat-frontend/src/app/features/profile/profile.component.ts` with the full content shown above.

- [ ] **Step 3: Compile check**

```bash
cd ai-chat-frontend && npx ng build --configuration development 2>&1 | tail -10
```
Expected: Application bundle generation complete.

- [ ] **Step 4: Commit**

```bash
git add ai-chat-frontend/src/app/auth/auth.service.ts \
        ai-chat-frontend/src/app/features/profile/profile.component.ts
git commit -m "feat: rebuild ProfileComponent with username/email/password editing"
```

---

## Task 7: Frontend — ProfileComponent HTML

**Files:**
- Modify: `ai-chat-frontend/src/app/features/profile/profile.component.html`

Replace the entire file with:

```html
<div class="profile-page">

  <!-- Header -->
  <div class="page-header">
    <h1 class="page-title">Profile</h1>
    <p class="page-subtitle">Manage your account information</p>
  </div>

  <!-- Avatar card -->
  <div class="card avatar-card">
    <div class="avatar-wrap">
      @if (getAvatarUrl()) {
        <img class="avatar-img" [src]="getAvatarUrl()" alt="avatar"/>
      } @else {
        <div class="avatar-fallback">{{ user?.username?.charAt(0)?.toUpperCase() ?? '?' }}</div>
      }
      <label class="avatar-edit-btn" title="Change photo">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 12h10M9.5 2.5l2 2-6 6H3.5V9l6-6.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <input type="file" accept="image/*" (change)="onAvatarChange($event)" style="display:none"/>
      </label>
    </div>
    <div class="avatar-info">
      <p class="avatar-name">{{ user?.username }}</p>
      <p class="avatar-email">{{ user?.email }}</p>
      <span class="role-badge" [class]="user?.role?.toString()?.toLowerCase()">{{ user?.role }}</span>
    </div>
    @if (avatarUploading) {
      <span class="uploading-hint">Uploading…</span>
    }
    @if (avatarError) {
      <p class="field-error">{{ avatarError }}</p>
    }
  </div>

  <!-- Account info form -->
  <div class="card">
    <h2 class="card-title">Account Information</h2>
    <form [formGroup]="infoForm" (ngSubmit)="onSaveInfo()" class="form">

      <div class="field">
        <label class="field-label" for="p-username">Username</label>
        <input id="p-username" class="field-input" type="text"
               formControlName="username" autocomplete="username" placeholder="Your username"/>
      </div>

      <div class="field">
        <label class="field-label" for="p-email">Email address</label>
        <input id="p-email" class="field-input" type="email"
               formControlName="email" autocomplete="email" placeholder="your@email.com"/>
      </div>

      @if (infoError) {
        <div class="alert alert-error">{{ infoError }}</div>
      }
      @if (infoSuccess) {
        <div class="alert alert-success">{{ infoSuccess }}</div>
      }

      <div class="form-actions">
        <button class="btn-primary" type="submit" [disabled]="infoLoading || infoForm.invalid">
          @if (infoLoading) { Saving… } @else { Save Changes }
        </button>
      </div>
    </form>
  </div>

  <!-- Change password form -->
  <div class="card">
    <h2 class="card-title">Change Password</h2>
    <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="form">

      <div class="field">
        <label class="field-label" for="p-cur">Current Password</label>
        <div class="input-wrap">
          <input id="p-cur" class="field-input" [type]="showCurrentPassword ? 'text' : 'password'"
                 formControlName="currentPassword" autocomplete="current-password" placeholder="Enter current password"/>
          <button type="button" class="eye-btn" (click)="showCurrentPassword = !showCurrentPassword"
                  [attr.aria-label]="showCurrentPassword ? 'Hide password' : 'Show password'">
            @if (showCurrentPassword) {
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M6.5 6.6A2 2 0 0 0 9.4 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M4 4.5C2.4 5.6 1 8 1 8s2.5 5 7 5c1.4 0 2.6-.4 3.6-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M9.5 3.7C12 4.8 15 8 15 8s-2.5 5-7 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            } @else {
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.4"/>
                <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/>
              </svg>
            }
          </button>
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="p-new">New Password</label>
        <div class="input-wrap">
          <input id="p-new" class="field-input" [type]="showNewPassword ? 'text' : 'password'"
                 formControlName="newPassword" autocomplete="new-password" placeholder="Min. 8 characters"/>
          <button type="button" class="eye-btn" (click)="showNewPassword = !showNewPassword"
                  [attr.aria-label]="showNewPassword ? 'Hide password' : 'Show password'">
            @if (showNewPassword) {
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M6.5 6.6A2 2 0 0 0 9.4 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M4 4.5C2.4 5.6 1 8 1 8s2.5 5 7 5c1.4 0 2.6-.4 3.6-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M9.5 3.7C12 4.8 15 8 15 8s-2.5 5-7 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            } @else {
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.4"/>
                <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/>
              </svg>
            }
          </button>
        </div>
      </div>

      @if (passwordError) {
        <div class="alert alert-error">{{ passwordError }}</div>
      }
      @if (passwordSuccess) {
        <div class="alert alert-success">{{ passwordSuccess }}</div>
      }

      <div class="form-actions">
        <button class="btn-primary" type="submit" [disabled]="passwordLoading || passwordForm.invalid">
          @if (passwordLoading) { Saving… } @else { Change Password }
        </button>
      </div>
    </form>
  </div>

</div>
```

- [ ] **Step 1: Write the HTML file** (replace existing content)

- [ ] **Step 2: Compile check**

```bash
cd ai-chat-frontend && npx ng build --configuration development 2>&1 | tail -10
```
Expected: Application bundle generation complete.

- [ ] **Step 3: Commit**

```bash
git add ai-chat-frontend/src/app/features/profile/profile.component.html
git commit -m "feat: rebuild profile page HTML with account info and password sections"
```

---

## Task 8: Frontend — ProfileComponent SCSS

**Files:**
- Modify: `ai-chat-frontend/src/app/features/profile/profile.component.scss`

Replace the entire file with:

```scss
.profile-page {
  padding: 24px 20px;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (min-width: 1024px) {
    padding: 32px 36px;
  }
}

.page-header {
  margin-bottom: 4px;
}

.page-title {
  font-family: var(--f-display);
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

:host-context([dir="rtl"]) .page-title {
  font-family: var(--f-arabic);
}

.page-subtitle {
  font-size: 13px;
  font-family: var(--f-body);
  color: var(--color-text-muted);
  margin-top: 4px;
}

/* Card */
.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 20px;
}

.card-title {
  font-family: var(--f-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 16px;
  letter-spacing: -0.01em;
}

:host-context([dir="rtl"]) .card-title {
  font-family: var(--f-arabic);
}

/* Avatar card */
.avatar-card {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar-img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-border);
}

.avatar-fallback {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--gradient-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--f-display);
  font-size: 26px;
  font-weight: 700;
  color: #0c0a06;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  inset-inline-end: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent-border);
  }
}

.avatar-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.avatar-name {
  font-family: var(--f-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

:host-context([dir="rtl"]) .avatar-name {
  font-family: var(--f-arabic);
}

.avatar-email {
  font-size: 12px;
  font-family: var(--f-body);
  color: var(--color-text-muted);
}

.uploading-hint {
  font-size: 11px;
  font-family: var(--f-body);
  color: var(--color-text-subtle);
  align-self: center;
}

/* Role badge */
.role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 600;
  font-family: var(--f-body);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(0, 201, 167, 0.12);
  color: var(--color-accent);
  border: 1px solid rgba(0, 201, 167, 0.2);

  &.admin {
    background: rgba(168, 85, 247, 0.12);
    color: #c084fc;
    border-color: rgba(168, 85, 247, 0.2);
  }
  &.moderator {
    background: rgba(251, 191, 36, 0.12);
    color: #fbbf24;
    border-color: rgba(251, 191, 36, 0.2);
  }
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 11px;
  font-weight: 500;
  font-family: var(--f-body);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

:host-context([dir="rtl"]) .field-label {
  font-family: var(--f-arabic);
  letter-spacing: 0;
}

.input-wrap {
  position: relative;
}

.field-input {
  width: 100%;
  height: 42px;
  padding: 0 40px 0 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 14px;
  font-family: var(--f-body);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.18s, box-shadow 0.18s;

  &:not(.input-wrap > &) {
    padding-inline-end: 12px;
  }

  &::placeholder { color: var(--color-text-subtle); }

  &:focus {
    border-color: var(--color-accent-border);
    box-shadow: 0 0 0 3px rgba(0, 201, 167, 0.10);
  }
}

:host-context([dir="rtl"]) .field-input {
  font-family: var(--f-arabic);
}

.eye-btn {
  position: absolute;
  inset-inline-end: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.15s;

  &:hover { color: var(--color-text); }
}

.field-error {
  font-size: 11px;
  font-family: var(--f-body);
  color: var(--color-danger);
}

/* Alerts */
.alert {
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: var(--f-body);
  line-height: 1.4;
}

.alert-error {
  color: var(--color-danger);
  background: rgba(224, 96, 96, 0.10);
  border: 1px solid rgba(224, 96, 96, 0.22);
}

.alert-success {
  color: var(--color-accent);
  background: rgba(0, 201, 167, 0.08);
  border: 1px solid rgba(0, 201, 167, 0.18);
}

/* Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.btn-primary {
  height: 38px;
  padding: 0 20px;
  background: var(--gradient-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: #0c0a06;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--f-body);
  cursor: pointer;
  transition: box-shadow 0.18s, transform 0.15s;

  &:disabled { opacity: 0.55; cursor: not-allowed; }

  &:hover:not(:disabled) {
    box-shadow: 0 4px 16px rgba(0, 201, 167, 0.32);
    transform: translateY(-1px);
  }
}

:host-context([dir="rtl"]) .btn-primary {
  font-family: var(--f-arabic);
}
```

- [ ] **Step 1: Write the SCSS file**

- [ ] **Step 2: Compile check**

```bash
cd ai-chat-frontend && npx ng build --configuration development 2>&1 | tail -10
```
Expected: Application bundle generation complete.

- [ ] **Step 3: Run all frontend tests**

```bash
cd ai-chat-frontend && npx ng test --watch=false --browsers=ChromeHeadless 2>&1 | tail -10
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add ai-chat-frontend/src/app/features/profile/profile.component.scss
git commit -m "feat: add profile page styles"
```

---

## Self-Review

### Spec Coverage
| Requirement | Task |
|---|---|
| Remove profile icon from sidebar nav | Task 5 |
| Profile accessible only via avatar click | Task 5 (avatar already navigates to /profile from previous fix) |
| Change username from profile | Tasks 2, 3, 6, 7, 8 |
| Change email from profile | Tasks 2, 3, 6, 7, 8 |
| Change password from profile | Task 6 (uses existing `/api/auth/change-password`) |
| Username uniqueness check + 409 | Tasks 2, 3 |
| Email uniqueness check + 409 | Tasks 2, 3 |
| Error message shown when name/email taken | Task 6 (reads `err.error.error`) |
| Change must not save if conflict | Tasks 2 service (throws before save), 3 |
| `PUT /api/profile` endpoint | Task 3 |
| `@PutMapping` on `/api/profile` | Task 3 |
| Spring Security — authenticated only | Task 3 (JwtPrincipal injection, 401 test) |
| Backend: entity with unique constraints | Already exists (`User.java` has `unique=true`) |
| Backend: existsByUsername / existsByEmail | Already exists (`UserRepository`) |
| Backend: UserService validates + persists | Task 2 |
| Backend: UserController with @PutMapping | Task 3 (ProfileController) |

### Type Consistency
- `UpdateProfileRequest` record fields (`username`, `email`) match usage in `UserService.updateProfile`, `ProfileController`, and frontend `UpdateProfileRequest` interface
- `UserResponse.from(user)` — no change, already returns all fields
- `authService.refreshFromProfile(updated)` — added in Task 6, takes `UserResponse`

### No Placeholders
Reviewed — all code blocks are complete. No TBD or TODO in any step.
