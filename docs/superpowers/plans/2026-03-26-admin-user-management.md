# Admin User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to change any user's password and delete any user from the Users page, with styled modals replacing the native browser `confirm()`.

**Architecture:** One new backend endpoint (`POST /api/users/{id}/reset-password`) handles admin password resets and sets `forcePasswordChange = true`. The frontend adds a new `ChangePasswordDialogComponent` (following the existing `CreateUserDialogComponent` pattern) and replaces the native `confirm()` delete flow with an inline confirmation modal in `UsersComponent`.

**Tech Stack:** Spring Boot 3 / Java 21 (backend), Angular 21 standalone components + ReactiveFormsModule (frontend), SCSS with CSS custom properties.

---

## File Map

| File | Change |
|------|--------|
| `ai-chat-backen/.../user/ResetPasswordRequest.java` | **Create** — DTO record |
| `ai-chat-backen/.../user/UserService.java` | **Modify** — add `resetPassword` method |
| `ai-chat-backen/.../user/UserController.java` | **Modify** — add endpoint |
| `ai-chat-frontend/.../core/user.service.ts` | **Modify** — add `adminResetPassword` method |
| `ai-chat-frontend/.../users/change-password-dialog/change-password-dialog.component.ts` | **Create** |
| `ai-chat-frontend/.../users/change-password-dialog/change-password-dialog.component.html` | **Create** |
| `ai-chat-frontend/.../users/change-password-dialog/change-password-dialog.component.scss` | **Create** |
| `ai-chat-frontend/.../users/users.component.ts` | **Modify** — replace confirm(), wire dialogs |
| `ai-chat-frontend/.../users/users.component.html` | **Modify** — add buttons + modals |
| `ai-chat-frontend/.../users/users.component.scss` | **Modify** — add button + modal styles |

---

## Task 1: Backend — ResetPasswordRequest DTO

**Files:**
- Create: `ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/ResetPasswordRequest.java`

- [ ] **Step 1: Create the DTO**

```java
package com.alhashimi.ai.chat.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Size(min = 8) String newPassword
) {}
```

- [ ] **Step 2: Commit**

```bash
git add ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/ResetPasswordRequest.java
git commit -m "feat: add ResetPasswordRequest DTO"
```

---

## Task 2: Backend — UserService.resetPassword

**Files:**
- Modify: `ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UserService.java`

- [ ] **Step 1: Add the method** — insert after `deleteUser` in `UserService.java`

```java
public void resetPassword(UUID id, ResetPasswordRequest request) {
    User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    user.setPassword(passwordEncoder.encode(request.newPassword()));
    user.setForcePasswordChange(true);
    userRepository.save(user);
}
```

- [ ] **Step 2: Verify the file compiles**

```bash
cd ai-chat-backen && ./mvnw compile -q
```
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UserService.java
git commit -m "feat: add resetPassword method to UserService"
```

---

## Task 3: Backend — UserController endpoint

**Files:**
- Modify: `ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UserController.java`

- [ ] **Step 1: Add the endpoint** — insert after `deleteUser` in `UserController.java`

```java
@PostMapping("/{id}/reset-password")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<Void> resetPassword(
        @PathVariable UUID id,
        @Valid @RequestBody ResetPasswordRequest request) {
    userService.resetPassword(id, request);
    return ResponseEntity.noContent().build();
}
```

- [ ] **Step 2: Verify the app starts**

```bash
cd ai-chat-backen && ./mvnw compile -q
```
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add ai-chat-backen/src/main/java/com/alhashimi/ai/chat/user/UserController.java
git commit -m "feat: add POST /api/users/{id}/reset-password endpoint"
```

---

## Task 4: Frontend — user.service.ts

**Files:**
- Modify: `ai-chat-frontend/src/app/core/user.service.ts`

- [ ] **Step 1: Add the method** — insert after `deleteUser` in `user.service.ts`

```typescript
adminResetPassword(id: string, newPassword: string): Observable<void> {
  return this.http.post<void>(`/api/users/${id}/reset-password`, { newPassword });
}
```

- [ ] **Step 2: Commit**

```bash
git add ai-chat-frontend/src/app/core/user.service.ts
git commit -m "feat: add adminResetPassword to UserService"
```

---

## Task 5: Frontend — ChangePasswordDialogComponent

**Files:**
- Create: `ai-chat-frontend/src/app/features/users/change-password-dialog/change-password-dialog.component.ts`
- Create: `ai-chat-frontend/src/app/features/users/change-password-dialog/change-password-dialog.component.html`
- Create: `ai-chat-frontend/src/app/features/users/change-password-dialog/change-password-dialog.component.scss`

- [ ] **Step 1: Create the TypeScript component**

```typescript
// change-password-dialog.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UserService } from '../../../core/user.service';
import { UserResponse } from '../../../models/user.model';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss'
})
export class ChangePasswordDialogComponent {
  @Input() user!: UserResponse;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = new FormBuilder().group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: passwordsMatch }
  );

  showPassword = false;
  loading = false;
  error = '';

  constructor(private userService: UserService) {}

  get passwordMismatch(): boolean {
    return this.form.hasError('passwordMismatch') && !!this.form.get('confirmPassword')?.dirty;
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const newPassword = this.form.value.newPassword!;
    this.userService.adminResetPassword(this.user.id, newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
      },
      error: () => {
        this.error = 'Failed to change password';
        this.loading = false;
      }
    });
  }

  onCancel() {
    this.cancelled.emit();
  }
}
```

- [ ] **Step 2: Create the HTML template**

```html
<!-- change-password-dialog.component.html -->
<div class="dialog-overlay" (click)="onCancel()">
  <div class="dialog" (click)="$event.stopPropagation()">
    <div class="dialog-header">
      <div>
        <h2 class="dialog-title">Change Password</h2>
        <p class="dialog-subtitle">{{ user.email }}</p>
      </div>
      <button class="dialog-close" type="button" (click)="onCancel()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-form">
      <div class="field">
        <label class="field-label" for="cp-new">New Password</label>
        <div class="input-wrap">
          <input
            id="cp-new"
            class="field-input"
            [type]="showPassword ? 'text' : 'password'"
            formControlName="newPassword"
            placeholder="Min. 8 characters"
            autocomplete="new-password"/>
          <button type="button" class="eye-btn" (click)="showPassword = !showPassword">
            @if (showPassword) {
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
        <label class="field-label" for="cp-confirm">Confirm Password</label>
        <input
          id="cp-confirm"
          class="field-input"
          type="password"
          formControlName="confirmPassword"
          placeholder="Repeat new password"
          autocomplete="new-password"/>
        @if (passwordMismatch) {
          <span class="field-error">Passwords do not match</span>
        }
      </div>

      <div class="info-note">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/>
          <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        The user will be required to change this password on next login.
      </div>

      @if (error) {
        <p class="error-message">{{ error }}</p>
      }

      <div class="dialog-actions">
        <button class="btn-ghost" type="button" (click)="onCancel()">Cancel</button>
        <button class="btn-primary" type="submit" [disabled]="loading || form.invalid">
          @if (loading) { Saving... } @else { Save Password }
        </button>
      </div>
    </form>
  </div>
</div>
```

- [ ] **Step 3: Create the SCSS** — copy the pattern from `create-user-dialog.component.scss`, add `.dialog-subtitle`, `.input-wrap`, `.eye-btn`, `.field-error`, `.info-note`

```scss
// change-password-dialog.component.scss
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 300;

  @media (min-width: 640px) {
    align-items: center;
    padding: 16px;
  }
}

.dialog {
  width: 100%;
  background: var(--color-card);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  overflow: hidden;
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  animation: dialog-rise 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;

  @media (min-width: 640px) {
    max-width: 440px;
    border-radius: var(--radius-xl);
  }
}

@keyframes dialog-rise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.dialog-title {
  font-family: var(--f-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

:host-context([dir="rtl"]) .dialog-title {
  font-family: var(--f-arabic);
}

.dialog-subtitle {
  font-size: 12px;
  font-family: var(--f-body);
  color: var(--color-text-muted);
  margin-top: 2px;
}

.dialog-close {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: var(--color-text);
    border-color: var(--color-accent-border);
  }
}

.dialog-form {
  padding: 20px;
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

.info-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(0, 201, 167, 0.06);
  border: 1px solid rgba(0, 201, 167, 0.14);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: var(--f-body);
  color: var(--color-text-muted);
  line-height: 1.5;

  svg { flex-shrink: 0; margin-top: 1px; color: var(--color-accent); }
}

.error-message {
  font-size: 12px;
  font-family: var(--f-body);
  color: var(--color-danger);
  padding: 7px 10px;
  background: rgba(224, 96, 96, 0.1);
  border: 1px solid rgba(224, 96, 96, 0.22);
  border-radius: var(--radius-sm);
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
}

.btn-primary {
  height: 38px;
  padding: 0 18px;
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

.btn-ghost {
  height: 38px;
  padding: 0 14px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 13px;
  font-family: var(--f-body);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: var(--color-text);
    border-color: var(--color-accent-border);
  }
}

:host-context([dir="rtl"]) .btn-ghost {
  font-family: var(--f-arabic);
}
```

- [ ] **Step 4: Commit**

```bash
git add ai-chat-frontend/src/app/features/users/change-password-dialog/
git commit -m "feat: add ChangePasswordDialogComponent"
```

---

## Task 6: Frontend — Update UsersComponent TS

**Files:**
- Modify: `ai-chat-frontend/src/app/features/users/users.component.ts`

- [ ] **Step 1: Replace the full file content**

```typescript
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/user.service';
import { AuthService } from '../../auth/auth.service';
import { UserResponse } from '../../models/user.model';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CreateUserDialogComponent, ChangePasswordDialogComponent, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users: UserResponse[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 20;
  isAdmin = false;
  showCreateForm = false;
  loading = false;
  errorMessage = '';

  userToDelete: UserResponse | null = null;
  userToChangePassword: UserResponse | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.getRole() === 'ADMIN';
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.errorMessage = '';
    this.userService.listUsers(this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        this.users = page.content;
        this.totalElements = page.page.totalElements;
        this.totalPages = page.page.totalPages;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }

  onDeleteUser(user: UserResponse) {
    this.userToDelete = user;
  }

  confirmDelete() {
    if (!this.userToDelete) return;
    const id = this.userToDelete.id;
    this.userToDelete = null;
    this.userService.deleteUser(id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.errorMessage = 'Failed to delete user'
    });
  }

  onUserCreated(user: UserResponse) {
    this.showCreateForm = false;
    this.loadUsers();
  }

  onPasswordChanged() {
    this.userToChangePassword = null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add ai-chat-frontend/src/app/features/users/users.component.ts
git commit -m "feat: wire delete confirmation and change-password dialog in UsersComponent"
```

---

## Task 7: Frontend — Update UsersComponent HTML

**Files:**
- Modify: `ai-chat-frontend/src/app/features/users/users.component.html`

- [ ] **Step 1: Replace the full file content**

```html
<div class="users-page">
  <div class="page-header">
    <div>
      <h1 class="page-title">Users</h1>
      <p class="page-subtitle">{{ totalElements }} total users</p>
    </div>
    @if (isAdmin) {
      <button class="btn-primary" type="button" (click)="showCreateForm = true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        New User
      </button>
    }
  </div>

  @if (errorMessage) {
    <div class="alert-error">{{ errorMessage }}</div>
  }

  @if (loading) {
    <div class="loading-state">Loading users...</div>
  } @else {
    <!-- Desktop table -->
    <div class="card desktop-table">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (user of users; track user.id) {
            <tr>
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
                  <span class="user-name">{{ user.username }}</span>
                </div>
              </td>
              <td class="user-email">{{ user.email }}</td>
              <td><span class="role-badge" [class]="user.role.toLowerCase()">{{ user.role }}</span></td>
              <td class="actions-cell">
                @if (isAdmin) {
                  <div class="action-btns">
                    <button class="btn-password-icon" type="button" title="Change password"
                      (click)="userToChangePassword = user">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="7" width="12" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        <circle cx="8" cy="11" r="1" fill="currentColor"/>
                      </svg>
                    </button>
                    <button class="btn-danger-icon" type="button" title="Delete user"
                      (click)="onDeleteUser(user)">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 3h12M5 3V2h4v1M2 3l1 9h8l1-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  </div>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Mobile card list -->
    <div class="mobile-list">
      @for (user of users; track user.id) {
        <div class="user-card">
          <div class="user-card-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
          <div class="user-card-info">
            <span class="user-name">{{ user.username }}</span>
            <span class="user-email">{{ user.email }}</span>
            <span class="role-badge" [class]="user.role.toLowerCase()">{{ user.role }}</span>
          </div>
          @if (isAdmin) {
            <div class="action-btns">
              <button class="btn-password-icon" type="button" title="Change password"
                (click)="userToChangePassword = user">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="7" width="12" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <circle cx="8" cy="11" r="1" fill="currentColor"/>
                </svg>
              </button>
              <button class="btn-danger-icon" type="button" title="Delete user"
                (click)="onDeleteUser(user)">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 3h12M5 3V2h4v1M2 3l1 9h8l1-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          }
        </div>
      }
    </div>

    @if (totalPages > 1) {
      <div class="pagination">
        <button class="page-btn" [disabled]="currentPage === 0" (click)="onPageChange(currentPage - 1)">← Prev</button>
        <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
        <button class="page-btn" [disabled]="currentPage === totalPages - 1" (click)="onPageChange(currentPage + 1)">Next →</button>
      </div>
    }
  }

  <!-- Create user dialog -->
  @if (showCreateForm) {
    <app-create-user-dialog
      (userCreated)="onUserCreated($event)"
      (cancelled)="showCreateForm = false">
    </app-create-user-dialog>
  }

  <!-- Change password dialog -->
  @if (userToChangePassword) {
    <app-change-password-dialog
      [user]="userToChangePassword"
      (saved)="onPasswordChanged()"
      (cancelled)="userToChangePassword = null">
    </app-change-password-dialog>
  }

  <!-- Delete confirmation modal -->
  @if (userToDelete) {
    <div class="confirm-overlay" (click)="userToDelete = null">
      <div class="confirm-dialog" (click)="$event.stopPropagation()">
        <div class="confirm-icon">
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
            <path d="M3 4h10M6 4V2.5h4V4M5 4v8.5h6V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3 class="confirm-title">Delete User</h3>
        <p class="confirm-text">
          Are you sure you want to delete <strong>{{ userToDelete.username }}</strong>?
          This action cannot be undone.
        </p>
        <div class="confirm-actions">
          <button class="btn-ghost" type="button" (click)="userToDelete = null">Cancel</button>
          <button class="btn-delete" type="button" (click)="confirmDelete()">Delete</button>
        </div>
      </div>
    </div>
  }
</div>
```

- [ ] **Step 2: Commit**

```bash
git add ai-chat-frontend/src/app/features/users/users.component.html
git commit -m "feat: add action buttons and confirmation modals to users page"
```

---

## Task 8: Frontend — Update UsersComponent SCSS

**Files:**
- Modify: `ai-chat-frontend/src/app/features/users/users.component.scss`

- [ ] **Step 1: Add new styles** — append to the end of `users.component.scss`

```scss
.actions-cell {
  text-align: end;
  width: 72px;
}

.action-btns {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.btn-password-icon {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-subtle);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s, border-color 0.15s;

  &:hover {
    color: var(--color-accent);
    background: rgba(0, 201, 167, 0.08);
    border-color: rgba(0, 201, 167, 0.2);
  }
}

/* Delete confirmation modal */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 16px;
}

.confirm-dialog {
  background: var(--color-card);
  border: 1px solid rgba(224, 96, 96, 0.25);
  border-radius: var(--radius-xl);
  padding: 28px 24px 20px;
  max-width: 340px;
  width: 100%;
  text-align: center;
  animation: dialog-rise 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}

.confirm-icon {
  width: 48px;
  height: 48px;
  background: rgba(224, 96, 96, 0.12);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  color: var(--color-danger);
}

.confirm-title {
  font-family: var(--f-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

:host-context([dir="rtl"]) .confirm-title {
  font-family: var(--f-arabic);
}

.confirm-text {
  font-size: 13px;
  font-family: var(--f-body);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: 20px;

  strong { color: var(--color-text); font-weight: 600; }
}

:host-context([dir="rtl"]) .confirm-text {
  font-family: var(--f-arabic);
}

.confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-delete {
  height: 38px;
  padding: 0 20px;
  background: rgba(224, 96, 96, 0.15);
  border: 1px solid rgba(224, 96, 96, 0.35);
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--f-body);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: rgba(224, 96, 96, 0.25);
    border-color: rgba(224, 96, 96, 0.5);
  }
}

:host-context([dir="rtl"]) .btn-delete {
  font-family: var(--f-arabic);
}
```

- [ ] **Step 2: Commit**

```bash
git add ai-chat-frontend/src/app/features/users/users.component.scss
git commit -m "feat: add action button and confirmation modal styles to users page"
```

---

## Task 9: Final verification

- [ ] **Step 1: Start the backend**

```bash
cd ai-chat-backen && ./mvnw spring-boot:run
```
Expected: Application starts on port 8080 with no errors.

- [ ] **Step 2: Start the frontend**

```bash
cd ai-chat-frontend && npm start
```
Expected: Angular app compiles and serves on port 4200.

- [ ] **Step 3: Verify as admin**
  1. Log in as an admin user
  2. Navigate to `/users`
  3. Confirm two icon buttons appear on each row (lock + trash)
  4. Click the lock icon — Change Password dialog should open with the user's email in the subtitle
  5. Enter mismatched passwords — "Passwords do not match" error should appear
  6. Enter a valid password (8+ chars, matching confirm) — clicking Save Password should succeed and dialog should close
  7. Click the trash icon — Delete confirmation modal should appear with the username
  8. Click Cancel — modal should close, user should remain
  9. Click the trash icon again, then Delete — user should be removed from the list

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: admin can change user password and delete user with styled modals"
```
