# Admin User Management — Design Spec

**Date:** 2026-03-26
**Feature:** Allow admins to change a user's password and delete a user from the Users page.

---

## Overview

Admins need two actions on each user row in the Users list:
1. **Change Password** — set a new password for any user; forces that user to change it on next login.
2. **Delete User** — permanently remove a user account with a confirmation step.

The delete action already has backend support (`DELETE /api/users/{id}`). The change-password action requires a new backend endpoint.

---

## Backend

### New Endpoint

**`POST /api/users/{id}/reset-password`**

- **Security:** `@PreAuthorize("hasRole('ADMIN')")` — admin only
- **Request body:**
  ```json
  { "newPassword": "string (min 8 chars)" }
  ```
- **Behaviour:**
  - Encodes `newPassword` using the existing password encoder
  - Sets `forcePasswordChange = true` on the user entity
  - Saves and returns `200 OK` (no body needed)
- **Errors:** `404` if user not found, `400` if validation fails

### Files to change (backend)

| File | Change |
|------|--------|
| `UserController.java` | Add `resetPassword` endpoint |
| `UserService.java` | Add `resetPassword(id, newPassword)` method |
| `ResetPasswordRequest.java` | New DTO with `newPassword` field + `@NotBlank @Size(min=8)` |

---

## Frontend

### 1. `user.service.ts`

Add one method:

```typescript
adminResetPassword(id: string, newPassword: string): Observable<void> {
  return this.http.post<void>(`/api/users/${id}/reset-password`, { newPassword });
}
```

### 2. `ChangePasswordDialogComponent` (new)

Location: `src/app/features/users/change-password-dialog/`

- **Inputs:** `@Input() user: UserResponse`
- **Outputs:** `@Output() saved = new EventEmitter<void>()`, `@Output() cancelled = new EventEmitter<void>()`
- **Form fields:**
  - New Password (required, min 8 chars) — with eye-toggle show/hide
  - Confirm Password (required, must match New Password)
- **Info note:** "The user will be required to change this password on next login."
- **Submit:** calls `userService.adminResetPassword(user.id, newPassword)`, emits `saved` on success
- **Styling:** matches `create-user-dialog` — glassmorphism card, teal gradient submit button

### 3. `users.component`

**Action buttons (icon-only, admin-only):**

- Added as the last column of both the desktop table and the mobile card list
- Lock icon (🔒) — opens `ChangePasswordDialogComponent` overlay for that user
- Trash icon (🗑) — sets `userToDelete` to trigger the delete confirmation overlay
- Both buttons hidden for non-admin roles

**Delete confirmation modal (inline):**

- Controlled by `userToDelete: UserResponse | null` in component state
- Shows username in the message: "Are you sure you want to delete **{username}**? This cannot be undone."
- Two buttons: Cancel (sets `userToDelete = null`) and Delete (calls `deleteUser`, then reloads)
- Replaces the existing native `confirm()` call

**Change password overlay:**

- Controlled by `userToChangePassword: UserResponse | null`
- Renders `<app-change-password-dialog>` in an overlay when set
- On `saved`: clears state, shows brief success message
- On `cancelled`: clears state

---

## UI Details

- Action buttons are icon-only with `title` tooltips ("Change password", "Delete user")
- Lock button: teal tint (`rgba(0,201,167,0.08)` background, teal border/color)
- Trash button: red tint (`rgba(224,96,96,0.08)` background, red border/color)
- Delete modal: red-tinted border, red Delete button, centered layout with trash icon
- Change password modal: standard card, teal Save button, matches existing dialog style

---

## Out of Scope

- Role editing (already supported via `updateUser` but not part of this feature)
- Bulk actions
- Password strength indicator
- Email notifications on password reset
