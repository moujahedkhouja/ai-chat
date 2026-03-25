# Dark Pro UI Redesign + Angular Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Angular from v19 to v21 and redesign the entire UI with a Dark Pro theme (dark background, icon sidebar, indigo/violet accents, mobile-first with bottom tab bar).

**Architecture:** All components are already standalone — no NgModule changes needed. The shell gains a fixed top bar and delegates mobile navigation to a new `BottomTabBarComponent`. Design tokens live in `styles.scss` as CSS custom properties so every component inherits them. The `change-password` route moves inside the shell so it picks up the top bar and bottom tabs.

**Tech Stack:** Angular 21 (upgraded from 19 via 20), TypeScript, SCSS (component-scoped), Angular Router, RxJS, Karma/Jasmine

**Spec:** `docs/superpowers/specs/2026-03-25-dark-pro-redesign-design.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `ai-chat-frontend/package.json` | Angular v21 versions after upgrade |
| Modify | `ai-chat-frontend/src/styles.scss` | Global CSS custom properties (design tokens) |
| Modify | `ai-chat-frontend/src/app/app.routes.ts` | Move change-password inside shell |
| Modify | `ai-chat-frontend/src/app/shell/shell.component.ts` | Import BottomTabBar + AuthService |
| Modify | `ai-chat-frontend/src/app/shell/shell.component.html` | Top bar + sidebar + router-outlet + bottom tab bar |
| Modify | `ai-chat-frontend/src/app/shell/shell.component.scss` | Fixed sidebar + fixed top bar layout |
| Modify | `ai-chat-frontend/src/app/shared/components/sidebar/sidebar.component.html` | Icon-only nav with tooltips |
| Modify | `ai-chat-frontend/src/app/shared/components/sidebar/sidebar.component.scss` | Dark Pro sidebar styles |
| Create | `ai-chat-frontend/src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component.ts` | Mobile nav component |
| Create | `ai-chat-frontend/src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component.html` | 4-tab mobile bar |
| Create | `ai-chat-frontend/src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component.scss` | Bottom bar styles |
| Modify | `ai-chat-frontend/src/app/features/login/login.component.html` | Dark Pro login card |
| Modify | `ai-chat-frontend/src/app/features/login/login.component.scss` | Login page styles |
| Modify | `ai-chat-frontend/src/app/features/dashboard/dashboard.component.ts` | Extract to templateUrl, add AuthService |
| Create | `ai-chat-frontend/src/app/features/dashboard/dashboard.component.html` | Stat cards + user mini-table |
| Create | `ai-chat-frontend/src/app/features/dashboard/dashboard.component.scss` | Dashboard styles |
| Modify | `ai-chat-frontend/src/app/features/users/users.component.html` | Table + mobile card list |
| Modify | `ai-chat-frontend/src/app/features/users/users.component.scss` | Users page styles |
| Modify | `ai-chat-frontend/src/app/features/users/create-user-dialog/create-user-dialog.component.html` | Dark modal + mobile bottom sheet |
| Modify | `ai-chat-frontend/src/app/features/users/create-user-dialog/create-user-dialog.component.scss` | Dialog styles |
| Modify | `ai-chat-frontend/src/app/features/profile/profile.component.html` | Avatar upload + fields |
| Modify | `ai-chat-frontend/src/app/features/profile/profile.component.scss` | Profile styles |
| Modify | `ai-chat-frontend/src/app/features/change-password/change-password.component.html` | Dark card form |
| Modify | `ai-chat-frontend/src/app/features/change-password/change-password.component.scss` | Change password styles |

---

## Task 1: Upgrade Angular 19 → 20 → 21

**Files:**
- Modify: `ai-chat-frontend/package.json` (updated by ng update)

- [ ] **Step 1: Navigate to the frontend directory and check current state**

```bash
cd ai-chat-frontend
npx ng version
```
Expected: Angular CLI: 19.x, Angular: 19.x

- [ ] **Step 2: Upgrade to Angular 20**

```bash
npx ng update @angular/core@20 @angular/cli@20
```
Expected: Migration scripts run, `package.json` updated to `^20.x`, no errors.
If peer dependency conflicts appear, add `--force` flag.

- [ ] **Step 3: Run tests to verify Angular 20 is stable**

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```
Expected: All existing tests pass. Fix any failures before continuing.

- [ ] **Step 4: Upgrade to Angular 21**

```bash
npx ng update @angular/core@21 @angular/cli@21
```
Expected: Migration scripts run, `package.json` updated to `^21.x`, no errors.

- [ ] **Step 5: Run tests to verify Angular 21 is stable**

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```
Expected: All existing tests pass. Fix any failures before continuing.

- [ ] **Step 6: Commit**

```bash
git add ai-chat-frontend/package.json ai-chat-frontend/package-lock.json
git commit -m "chore: upgrade Angular from v19 to v21"
```

---

## Task 2: Design Tokens

**Files:**
- Modify: `ai-chat-frontend/src/styles.scss`

- [ ] **Step 1: Replace the empty styles.scss with design tokens**

```scss
/* Design tokens — Dark Pro theme */
:root {
  --color-bg: #0f1117;
  --color-surface: #13151f;
  --color-card: #1a1d27;
  --color-border: #1e2235;

  --color-accent: #6366f1;
  --color-accent-2: #8b5cf6;
  --color-accent-muted: rgba(99, 102, 241, 0.15);
  --color-accent-border: rgba(99, 102, 241, 0.3);

  --color-text: #e2e8f0;
  --color-text-muted: #64748b;
  --color-text-subtle: #475569;

  --color-danger: #ef4444;
  --color-success: #22c55e;

  --gradient-accent: linear-gradient(135deg, #6366f1, #8b5cf6);

  --sidebar-width: 60px;
  --topbar-height: 52px;
  --bottombar-height: 56px;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 12px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  height: 100%;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 2: Verify the app still compiles**

```bash
npx ng build --configuration development 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 3: Commit**

```bash
git add ai-chat-frontend/src/styles.scss
git commit -m "style: add Dark Pro design tokens to global styles"
```

---

## Task 3: Update Routes — Move change-password Inside Shell

**Files:**
- Modify: `ai-chat-frontend/src/app/app.routes.ts`

The `change-password` route currently renders without the shell (no top bar or bottom nav). In the redesign it needs to be inside the shell so it inherits the layout.

- [ ] **Step 1: Update app.routes.ts**

```typescript
import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ShellComponent } from './shell/shell.component';
import { ChangePasswordComponent } from './features/change-password/change-password.component';
import { authGuard } from './auth/guards/auth.guard';
import { forcePasswordChangeGuard } from './auth/guards/force-password-change.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent, canActivate: [forcePasswordChangeGuard] },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent), canActivate: [forcePasswordChangeGuard] },
      { path: 'users', loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent), canActivate: [forcePasswordChangeGuard] },
      { path: 'change-password', component: ChangePasswordComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
```

- [ ] **Step 2: Verify build**

```bash
npx ng build --configuration development 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 3: Commit**

```bash
git add ai-chat-frontend/src/app/app.routes.ts
git commit -m "feat: move change-password route inside shell layout"
```

---

## Task 4: BottomTabBarComponent

**Files:**
- Create: `ai-chat-frontend/src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component.ts`
- Create: `ai-chat-frontend/src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component.html`
- Create: `ai-chat-frontend/src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component.scss`

- [ ] **Step 1: Write the failing test**

Create `ai-chat-frontend/src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BottomTabBarComponent } from './bottom-tab-bar.component';
import { AuthService } from '../../../auth/auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('BottomTabBarComponent', () => {
  let fixture: ComponentFixture<BottomTabBarComponent>;

  const mockAuthService = {
    getRole: () => 'ADMIN'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomTabBarComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(BottomTabBarComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show Users tab for ADMIN', () => {
    expect(fixture.componentInstance.isAdminOrModerator).toBeTrue();
  });

  it('should hide Users tab for USER role', () => {
    mockAuthService.getRole = () => 'USER';
    const comp = new BottomTabBarComponent({ getRole: () => 'USER' } as any);
    expect(comp.isAdminOrModerator).toBeFalse();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx ng test --watch=false --browsers=ChromeHeadless --include="**/bottom-tab-bar*" 2>&1 | tail -10
```
Expected: FAIL — `BottomTabBarComponent` not found.

- [ ] **Step 3: Create the component TypeScript**

`ai-chat-frontend/src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-bottom-tab-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-tab-bar.component.html',
  styleUrl: './bottom-tab-bar.component.scss'
})
export class BottomTabBarComponent {
  constructor(private authService: AuthService) {}

  get isAdminOrModerator(): boolean {
    const role = this.authService.getRole();
    return role === 'ADMIN' || role === 'MODERATOR';
  }
}
```

- [ ] **Step 4: Create the template**

`ai-chat-frontend/src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component.html`:

```html
<nav class="bottom-tab-bar">
  <a class="tab" routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: false}">
    <span class="tab-icon">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor"/>
        <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor"/>
        <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor"/>
        <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor"/>
      </svg>
    </span>
    <span class="tab-label">Home</span>
  </a>

  <a class="tab" routerLink="/profile" routerLinkActive="active">
    <span class="tab-icon">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3.5" fill="currentColor"/>
        <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </span>
    <span class="tab-label">Profile</span>
  </a>

  @if (isAdminOrModerator) {
    <a class="tab" routerLink="/users" routerLinkActive="active">
      <span class="tab-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="7" cy="7" r="2.5" fill="currentColor"/>
          <circle cx="13" cy="7" r="2.5" fill="currentColor"/>
          <path d="M1 17c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M13 12c1.657 0 3 1.119 3 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </span>
      <span class="tab-label">Users</span>
    </a>
  }

  <a class="tab" routerLink="/change-password" routerLinkActive="active">
    <span class="tab-icon">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.8"/>
        <circle cx="10" cy="10" r="2.5" fill="currentColor"/>
      </svg>
    </span>
    <span class="tab-label">Settings</span>
  </a>
</nav>
```

- [ ] **Step 5: Create the styles**

`ai-chat-frontend/src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component.scss`:

```scss
.bottom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottombar-height);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
  text-decoration: none;
  color: var(--color-text-subtle);
  padding: 6px 0;
  transition: color 0.15s ease;

  &.active {
    color: var(--color-accent);
  }
}

.tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.2px;
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx ng test --watch=false --browsers=ChromeHeadless --include="**/bottom-tab-bar*" 2>&1 | tail -10
```
Expected: 3 specs, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add ai-chat-frontend/src/app/shared/components/bottom-tab-bar/
git commit -m "feat: add BottomTabBarComponent for mobile navigation"
```

---

## Task 5: Shell Layout Redesign

**Files:**
- Modify: `ai-chat-frontend/src/app/shell/shell.component.ts`
- Modify: `ai-chat-frontend/src/app/shell/shell.component.html`
- Modify: `ai-chat-frontend/src/app/shell/shell.component.scss`

- [ ] **Step 1: Update shell.component.ts**

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';
import { BottomTabBarComponent } from '../shared/components/bottom-tab-bar/bottom-tab-bar.component';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, BottomTabBarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  constructor(private authService: AuthService) {}

  get username(): string {
    return this.authService.getUsername() ?? 'User';
  }

  get pageTitle(): string {
    return '';  // each page sets its own title via document.title or a shared service
  }
}
```

- [ ] **Step 2: Update shell.component.html**

```html
<div class="shell">
  <!-- Desktop icon sidebar -->
  <app-sidebar class="shell-sidebar"></app-sidebar>

  <!-- Right panel: top bar + content -->
  <div class="shell-panel">
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="app-logo">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect width="18" height="18" rx="5" fill="url(#logo-grad)"/>
            <rect x="4" y="4" width="4" height="4" rx="1" fill="white"/>
            <rect x="10" y="4" width="4" height="4" rx="1" fill="white" opacity="0.7"/>
            <rect x="4" y="10" width="4" height="4" rx="1" fill="white" opacity="0.7"/>
            <rect x="10" y="10" width="4" height="4" rx="1" fill="white" opacity="0.4"/>
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="18" y2="18">
                <stop stop-color="#6366f1"/>
                <stop offset="1" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span class="top-bar-greeting">Welcome back, {{ username }}</span>
      </div>
      <div class="top-bar-right">
        <button class="icon-btn" type="button" title="Notifications">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2a5 5 0 0 1 5 5v3l1.5 2.5H2.5L4 10V7a5 5 0 0 1 5-5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M7 14.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </header>

    <main class="shell-content">
      <router-outlet></router-outlet>
    </main>
  </div>

  <!-- Mobile bottom tab bar -->
  <app-bottom-tab-bar class="shell-bottom-nav"></app-bottom-tab-bar>
</div>
```

- [ ] **Step 3: Update shell.component.scss**

```scss
.shell {
  display: flex;
  height: 100dvh;
  background: var(--color-bg);
}

/* Sidebar hidden on mobile/tablet */
.shell-sidebar {
  display: none;

  @media (min-width: 1024px) {
    display: flex;
  }
}

/* Bottom tab bar hidden on desktop */
.shell-bottom-nav {
  display: flex;

  @media (min-width: 1024px) {
    display: none;
  }
}

.shell-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (min-width: 1024px) {
    margin-left: var(--sidebar-width);
  }
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  height: var(--topbar-height);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-logo {
  display: flex;
  align-items: center;

  @media (min-width: 1024px) {
    display: none;
  }
}

.top-bar-greeting {
  font-size: 13px;
  color: var(--color-text-muted);
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: var(--color-text);
    border-color: var(--color-accent-border);
  }
}

.shell-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: calc(var(--bottombar-height) + 20px);

  @media (min-width: 1024px) {
    padding-bottom: 20px;
  }
}
```

- [ ] **Step 4: Verify build**

```bash
npx ng build --configuration development 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 5: Commit**

```bash
git add ai-chat-frontend/src/app/shell/
git commit -m "feat: redesign shell layout with top bar and mobile bottom nav support"
```

---

## Task 6: Sidebar Redesign (Icon-Only, Desktop)

**Files:**
- Modify: `ai-chat-frontend/src/app/shared/components/sidebar/sidebar.component.html`
- Modify: `ai-chat-frontend/src/app/shared/components/sidebar/sidebar.component.scss`

- [ ] **Step 1: Update sidebar.component.html**

```html
<aside class="sidebar">
  <!-- Logo -->
  <div class="sidebar-logo">
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect width="22" height="22" rx="6" fill="url(#sb-grad)"/>
      <rect x="5" y="5" width="5" height="5" rx="1.5" fill="white"/>
      <rect x="12" y="5" width="5" height="5" rx="1.5" fill="white" opacity="0.7"/>
      <rect x="5" y="12" width="5" height="5" rx="1.5" fill="white" opacity="0.7"/>
      <rect x="12" y="12" width="5" height="5" rx="1.5" fill="white" opacity="0.4"/>
      <defs>
        <linearGradient id="sb-grad" x1="0" y1="0" x2="22" y2="22">
          <stop stop-color="#6366f1"/>
          <stop offset="1" stop-color="#8b5cf6"/>
        </linearGradient>
      </defs>
    </svg>
  </div>

  <!-- Nav -->
  <nav class="sidebar-nav">
    <a class="nav-item" routerLink="/dashboard" routerLinkActive="active" title="Dashboard">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" fill="currentColor"/>
        <rect x="10.5" y="1.5" width="6" height="6" rx="1.5" fill="currentColor"/>
        <rect x="1.5" y="10.5" width="6" height="6" rx="1.5" fill="currentColor"/>
        <rect x="10.5" y="10.5" width="6" height="6" rx="1.5" fill="currentColor"/>
      </svg>
    </a>

    <a class="nav-item" routerLink="/profile" routerLinkActive="active" title="Profile">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6.5" r="3" fill="currentColor"/>
        <path d="M2 16c0-3.314 3.134-5.5 7-5.5s7 2.186 7 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </a>

    @if (isAdminOrModerator) {
      <a class="nav-item" routerLink="/users" routerLinkActive="active" title="Users">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="6.5" cy="6" r="2.5" fill="currentColor"/>
          <circle cx="11.5" cy="6" r="2.5" fill="currentColor"/>
          <path d="M1 16c0-2.761 2.462-4.5 5.5-4.5s5.5 1.739 5.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M12 11.5c1.933 0 3.5 1.119 3.5 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </a>
    }
  </nav>

  <!-- Avatar + logout at bottom -->
  <div class="sidebar-footer">
    <button class="avatar-btn" type="button" [title]="username + ' · ' + role" (click)="logout()">
      <span class="avatar-initials">{{ username.charAt(0).toUpperCase() }}</span>
    </button>
  </div>
</aside>
```

- [ ] **Step 2: Update sidebar.component.scss**

```scss
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100dvh;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 8px;
  z-index: 200;
}

.sidebar-logo {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--color-text-subtle);
  text-decoration: none;
  transition: color 0.15s, background 0.15s;
  position: relative;

  &:hover {
    color: var(--color-text);
    background: var(--color-card);
  }

  &.active {
    color: var(--color-accent);
    background: var(--color-accent-muted);
    outline: 1px solid var(--color-accent-border);
  }
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 8px;
}

.avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--gradient-accent);
  border: 2px solid var(--color-border);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, transform 0.15s;

  &:hover {
    border-color: var(--color-accent);
    transform: scale(1.05);
  }
}
```

- [ ] **Step 3: Verify build**

```bash
npx ng build --configuration development 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 4: Commit**

```bash
git add ai-chat-frontend/src/app/shared/components/sidebar/
git commit -m "style: redesign sidebar to Dark Pro icon-only layout"
```

---

## Task 7: Login Page Redesign

**Files:**
- Modify: `ai-chat-frontend/src/app/features/login/login.component.html`
- Modify: `ai-chat-frontend/src/app/features/login/login.component.scss`

- [ ] **Step 1: Update login.component.html**

```html
<div class="login-page">
  <div class="login-card">
    <div class="login-logo">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="9" fill="url(#lg-grad)"/>
        <rect x="7" y="7" width="7" height="7" rx="2" fill="white"/>
        <rect x="18" y="7" width="7" height="7" rx="2" fill="white" opacity="0.7"/>
        <rect x="7" y="18" width="7" height="7" rx="2" fill="white" opacity="0.7"/>
        <rect x="18" y="18" width="7" height="7" rx="2" fill="white" opacity="0.4"/>
        <defs>
          <linearGradient id="lg-grad" x1="0" y1="0" x2="32" y2="32">
            <stop stop-color="#6366f1"/>
            <stop offset="1" stop-color="#8b5cf6"/>
          </linearGradient>
        </defs>
      </svg>
      <span class="login-app-name">AI Chat</span>
    </div>

    <h1 class="login-title">Welcome back</h1>
    <p class="login-subtitle">Sign in to your account</p>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
      <div class="field">
        <label class="field-label" for="username">Username</label>
        <input
          id="username"
          class="field-input"
          type="text"
          formControlName="username"
          placeholder="Enter your username"
          autocomplete="username"
        />
      </div>

      <div class="field">
        <label class="field-label" for="password">Password</label>
        <input
          id="password"
          class="field-input"
          type="password"
          formControlName="password"
          placeholder="Enter your password"
          autocomplete="current-password"
        />
      </div>

      @if (error) {
        <p class="error-message">{{ error }}</p>
      }

      <button class="btn-primary" type="submit" [disabled]="loading">
        @if (loading) { Signing in... } @else { Sign in }
      </button>
    </form>
  </div>
</div>
```

- [ ] **Step 2: Update login.component.scss**

```scss
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  background-image: radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 60%);
  padding: 16px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 32px;
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
}

.login-app-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}

.login-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 24px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  letter-spacing: 0.2px;
}

.field-input {
  height: 44px;
  padding: 0 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;

  &::placeholder {
    color: var(--color-text-subtle);
  }

  &:focus {
    border-color: var(--color-accent);
  }
}

.error-message {
  font-size: 13px;
  color: var(--color-danger);
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
}

.btn-primary {
  height: 44px;
  background: var(--gradient-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
}
```

- [ ] **Step 3: Verify build**

```bash
npx ng build --configuration development 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 4: Commit**

```bash
git add ai-chat-frontend/src/app/features/login/
git commit -m "style: redesign login page with Dark Pro card layout"
```

---

## Task 8: Dashboard Redesign

**Files:**
- Modify: `ai-chat-frontend/src/app/features/dashboard/dashboard.component.ts`
- Create: `ai-chat-frontend/src/app/features/dashboard/dashboard.component.html`
- Create: `ai-chat-frontend/src/app/features/dashboard/dashboard.component.scss`

- [ ] **Step 1: Update dashboard.component.ts**

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../core/user.service';
import { UserResponse } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  recentUsers: UserResponse[] = [];
  totalUsers = 0;

  constructor(
    public authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    if (this.isAdminOrModerator) {
      this.userService.listUsers(0, 5).subscribe({
        next: (page) => {
          this.recentUsers = page.content;
          this.totalUsers = page.totalElements;
        }
      });
    }
  }

  get username(): string {
    return this.authService.getUsername() ?? 'User';
  }

  get role(): string {
    return this.authService.getRole() ?? '';
  }

  get isAdminOrModerator(): boolean {
    const r = this.authService.getRole();
    return r === 'ADMIN' || r === 'MODERATOR';
  }

  getRoleBadgeClass(role: string): string {
    return role.toLowerCase();
  }

  getInitial(username: string): string {
    return username.charAt(0).toUpperCase();
  }
}
```

- [ ] **Step 2: Create dashboard.component.html**

```html
<div class="dashboard">
  <div class="page-header">
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Welcome back, {{ username }}</p>
  </div>

  <!-- Stat cards -->
  @if (isAdminOrModerator) {
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6" cy="5" r="2.5" fill="currentColor"/>
            <circle cx="10" cy="5" r="2.5" fill="currentColor" opacity="0.6"/>
            <path d="M0 14c0-2.761 2.686-4.5 6-4.5s6 1.739 6 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M10 9.5c2 0 4 1 4 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
          </svg>
        </div>
        <div class="stat-value">{{ totalUsers }}</div>
        <div class="stat-label">Total Users</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--purple">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor"/>
            <rect x="9.5" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor"/>
            <rect x="1" y="9.5" width="5.5" height="5.5" rx="1.5" fill="currentColor"/>
            <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1.5" fill="currentColor"/>
          </svg>
        </div>
        <div class="stat-value">{{ role }}</div>
        <div class="stat-label">Your Role</div>
      </div>
    </div>

    <!-- Recent users table -->
    @if (recentUsers.length > 0) {
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Recent Users</h2>
          <a routerLink="/users" class="btn-outline">View all</a>
        </div>
        <div class="user-table">
          <div class="table-header">
            <span>User</span>
            <span>Email</span>
            <span>Role</span>
          </div>
          @for (user of recentUsers; track user.id) {
            <div class="table-row">
              <div class="user-cell">
                <div class="user-avatar">{{ getInitial(user.username) }}</div>
                <span class="user-name">{{ user.username }}</span>
              </div>
              <span class="user-email">{{ user.email }}</span>
              <span class="role-badge" [class]="getRoleBadgeClass(user.role)">{{ user.role }}</span>
            </div>
          }
        </div>
      </div>
    }
  } @else {
    <div class="card welcome-card">
      <h2 class="card-title">Welcome to AI Chat</h2>
      <p class="card-text">Your workspace is ready. Use the navigation to get started.</p>
    </div>
  }
</div>
```

- [ ] **Step 3: Create dashboard.component.scss**

```scss
.dashboard {
  max-width: 900px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
}

.stat-icon {
  width: 32px;
  height: 32px;
  background: var(--color-accent-muted);
  border-radius: var(--radius-md);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;

  &--purple {
    background: rgba(139, 92, 246, 0.15);
    color: var(--color-accent-2);
  }
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 2px;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 20px;
}

.card-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.card-text {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 8px;
}

.btn-outline {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-accent);
  text-decoration: none;
  padding: 4px 10px;
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-sm);
  transition: background 0.15s;

  &:hover {
    background: var(--color-accent-muted);
  }
}

.user-table {
  padding: 0 16px;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
  align-items: center;

  &:last-child {
    border-bottom: none;
  }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--gradient-accent);
  color: white;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.user-email {
  font-size: 12px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &.admin {
    background: rgba(99, 102, 241, 0.2);
    color: #818cf8;
  }

  &.moderator {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
  }

  &.user {
    background: rgba(100, 116, 139, 0.2);
    color: #94a3b8;
  }
}

.welcome-card {
  padding: 20px 16px;
}
```

- [ ] **Step 4: Verify build**

```bash
npx ng build --configuration development 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 5: Commit**

```bash
git add ai-chat-frontend/src/app/features/dashboard/
git commit -m "feat: redesign dashboard with stat cards and recent users table"
```

---

## Task 9: Users Page Redesign

**Files:**
- Modify: `ai-chat-frontend/src/app/features/users/users.component.html`
- Modify: `ai-chat-frontend/src/app/features/users/users.component.scss`

- [ ] **Step 1: Update users.component.html**

```html
<div class="users-page">
  <div class="page-header">
    <div>
      <h1 class="page-title">Users</h1>
      <p class="page-subtitle">{{ totalElements }} total users</p>
    </div>
    @if (isAdmin) {
      <button class="btn-primary" type="button" (click)="showCreateForm = true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
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
                  <button class="btn-danger-icon" type="button" title="Delete user" (click)="onDeleteUser(user.id)">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M5 3V2h4v1M2 3l1 9h8l1-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
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
            <button class="btn-danger-icon" type="button" (click)="onDeleteUser(user.id)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M5 3V2h4v1M2 3l1 9h8l1-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          }
        </div>
      }
    </div>

    <!-- Pagination -->
    @if (totalPages > 1) {
      <div class="pagination">
        <button class="page-btn" [disabled]="currentPage === 0" (click)="onPageChange(currentPage - 1)">
          ← Prev
        </button>
        <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
        <button class="page-btn" [disabled]="currentPage === totalPages - 1" (click)="onPageChange(currentPage + 1)">
          Next →
        </button>
      </div>
    }
  }

  @if (showCreateForm) {
    <app-create-user-dialog
      (userCreated)="onUserCreated($event)"
      (cancelled)="showCreateForm = false">
    </app-create-user-dialog>
  }
</div>
```

- [ ] **Step 2: Update users.component.scss**

```scss
.users-page {
  max-width: 900px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  background: var(--gradient-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;

  &:hover { opacity: 0.9; }
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 13px;
  color: var(--color-danger);
  margin-bottom: 16px;
}

.loading-state {
  color: var(--color-text-muted);
  font-size: 13px;
  padding: 32px 0;
  text-align: center;
}

/* Desktop table */
.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 16px;
}

.desktop-table {
  display: none;

  @media (min-width: 640px) {
    display: block;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    padding: 10px 16px;
    font-size: 11px;
    font-weight: 500;
    color: var(--color-text-subtle);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }

  td {
    padding: 10px 16px;
    border-bottom: 1px solid var(--color-border);
    font-size: 13px;
    color: var(--color-text);

    &:last-child {
      text-align: right;
      width: 48px;
    }
  }

  tr:last-child td {
    border-bottom: none;
  }
}

/* Mobile card list */
.mobile-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;

  @media (min-width: 640px) {
    display: none;
  }
}

.user-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-card-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--gradient-accent);
  color: white;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

/* Shared styles */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--gradient-accent);
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.user-email {
  font-size: 12px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &.admin { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
  &.moderator { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
  &.user { background: rgba(100, 116, 139, 0.2); color: #94a3b8; }
}

.actions-cell {
  text-align: right;
}

.btn-danger-icon {
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
  margin-left: auto;

  &:hover {
    color: var(--color-danger);
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 0;
}

.page-btn {
  height: 32px;
  padding: 0 12px;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    border-color: var(--color-accent-border);
  }
}

.page-info {
  font-size: 13px;
  color: var(--color-text-muted);
}
```

- [ ] **Step 3: Verify build**

```bash
npx ng build --configuration development 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 4: Commit**

```bash
git add ai-chat-frontend/src/app/features/users/users.component.html ai-chat-frontend/src/app/features/users/users.component.scss
git commit -m "style: redesign users page with table and mobile card list"
```

---

## Task 10: Create User Dialog Redesign

**Files:**
- Modify: `ai-chat-frontend/src/app/features/users/create-user-dialog/create-user-dialog.component.html`
- Modify: `ai-chat-frontend/src/app/features/users/create-user-dialog/create-user-dialog.component.scss`

- [ ] **Step 1: Update create-user-dialog.component.html**

```html
<div class="dialog-overlay" (click)="onCancel()">
  <div class="dialog" (click)="$event.stopPropagation()">
    <div class="dialog-header">
      <h2 class="dialog-title">Create User</h2>
      <button class="dialog-close" type="button" (click)="onCancel()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-form">
      <div class="field">
        <label class="field-label" for="d-username">Username</label>
        <input id="d-username" class="field-input" type="text" formControlName="username" placeholder="e.g. john_doe" autocomplete="off"/>
      </div>

      <div class="field">
        <label class="field-label" for="d-email">Email</label>
        <input id="d-email" class="field-input" type="email" formControlName="email" placeholder="e.g. john@example.com" autocomplete="off"/>
      </div>

      <div class="field">
        <label class="field-label" for="d-password">Temporary Password</label>
        <input id="d-password" class="field-input" type="password" formControlName="temporaryPassword" placeholder="Min. 8 characters" autocomplete="new-password"/>
      </div>

      <div class="field">
        <label class="field-label" for="d-role">Role</label>
        <select id="d-role" class="field-input" formControlName="role">
          <option value="USER">User</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      @if (error) {
        <p class="error-message">{{ error }}</p>
      }

      <div class="dialog-actions">
        <button class="btn-ghost" type="button" (click)="onCancel()">Cancel</button>
        <button class="btn-primary" type="submit" [disabled]="loading">
          @if (loading) { Creating... } @else { Create User }
        </button>
      </div>
    </form>
  </div>
</div>
```

- [ ] **Step 2: Update create-user-dialog.component.scss**

```scss
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 300;
  padding: 0;

  @media (min-width: 640px) {
    align-items: center;
    padding: 16px;
  }
}

.dialog {
  width: 100%;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  overflow: hidden;

  @media (min-width: 640px) {
    max-width: 480px;
    border-radius: var(--radius-xl);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.dialog-close {
  width: 28px;
  height: 28px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s;

  &:hover { color: var(--color-text); }
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
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
}

.field-input {
  height: 40px;
  padding: 0 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;

  &::placeholder { color: var(--color-text-subtle); }
  &:focus { border-color: var(--color-accent); }

  option {
    background: var(--color-card);
    color: var(--color-text);
  }
}

.error-message {
  font-size: 12px;
  color: var(--color-danger);
  padding: 7px 10px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
}

.btn-primary {
  height: 36px;
  padding: 0 16px;
  background: var(--gradient-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:hover:not(:disabled) { opacity: 0.9; }
}

.btn-ghost {
  height: 36px;
  padding: 0 14px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: var(--color-text);
    border-color: var(--color-text-muted);
  }
}
```

- [ ] **Step 3: Verify build**

```bash
npx ng build --configuration development 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 4: Commit**

```bash
git add ai-chat-frontend/src/app/features/users/create-user-dialog/
git commit -m "style: redesign create user dialog with dark modal and mobile bottom sheet"
```

---

## Task 11: Profile Page Redesign

**Files:**
- Modify: `ai-chat-frontend/src/app/features/profile/profile.component.html`
- Modify: `ai-chat-frontend/src/app/features/profile/profile.component.scss`

- [ ] **Step 1: Update profile.component.html**

```html
<div class="profile-page">
  <div class="page-header">
    <h1 class="page-title">Profile</h1>
  </div>

  @if (errorMessage) {
    <div class="alert-error">{{ errorMessage }}</div>
  }

  @if (successMessage) {
    <div class="alert-success">{{ successMessage }}</div>
  }

  @if (user) {
    <div class="profile-card">
      <!-- Avatar -->
      <div class="avatar-section">
        <label class="avatar-upload" title="Click to upload avatar">
          @if (getAvatarUrl()) {
            <img [src]="getAvatarUrl()" [alt]="user.username" class="avatar-img"/>
          } @else {
            <div class="avatar-initials">{{ user.username.charAt(0).toUpperCase() }}</div>
          }
          <div class="avatar-overlay">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 12l3-3 2 2 4-5 3 4" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="1" y="1" width="16" height="16" rx="3" stroke="white" stroke-width="1.6"/></svg>
          </div>
          <input type="file" accept="image/*" class="avatar-file-input" (change)="onAvatarChange($event)" [disabled]="avatarUploading"/>
        </label>
        <div class="avatar-info">
          <span class="profile-username">{{ user.username }}</span>
          <span class="role-badge" [class]="user.role.toLowerCase()">{{ user.role }}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Info fields -->
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">{{ user.email }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">User ID</span>
          <span class="info-value info-mono">{{ user.id }}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Editable fields -->
      <form [formGroup]="form" (ngSubmit)="onSave()" class="edit-section">
        <div class="field">
          <label class="field-label" for="linkedin">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="vertical-align:-2px;margin-right:4px;"><rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M4 6v4M4 4.5v.01M6.5 6v4M6.5 8.5c0-1.4 1.2-2.5 2.5-2.5s2.5 1.1 2.5 2.5v1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
            LinkedIn URL
          </label>
          <input id="linkedin" class="field-input" type="url" formControlName="linkedinUrl" placeholder="https://linkedin.com/in/yourname"/>
        </div>

        <div class="form-actions">
          <button class="btn-primary" type="submit" [disabled]="loading">
            @if (loading) { Saving... } @else { Save Changes }
          </button>
        </div>
      </form>
    </div>
  }
</div>
```

- [ ] **Step 2: Update profile.component.scss**

```scss
.profile-page {
  max-width: 600px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
}

.alert-error,
.alert-success {
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  margin-bottom: 16px;
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--color-danger);
}

.alert-success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: var(--color-success);
}

.profile-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.avatar-section {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-upload {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
}

.avatar-img,
.avatar-initials {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  object-fit: cover;
  border: 2px solid var(--color-border);
}

.avatar-initials {
  background: var(--gradient-accent);
  color: white;
  font-size: 26px;
  font-weight: 700;
  border: 2px solid var(--color-border);
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;

  .avatar-upload:hover & {
    opacity: 1;
  }
}

.avatar-file-input {
  display: none;
}

.avatar-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-username {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.role-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  width: fit-content;

  &.admin { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
  &.moderator { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
  &.user { background: rgba(100, 116, 139, 0.2); color: #94a3b8; }
}

.divider {
  height: 1px;
  background: var(--color-border);
}

.info-section {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: baseline;
  gap: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 2px;
  }
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  min-width: 80px;
}

.info-value {
  font-size: 13px;
  color: var(--color-text);
}

.info-mono {
  font-family: ui-monospace, 'Cascadia Code', monospace;
  font-size: 11px;
  color: var(--color-text-muted);
}

.edit-section {
  padding: 16px 20px 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
}

.field-input {
  height: 40px;
  padding: 0 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;

  &::placeholder { color: var(--color-text-subtle); }
  &:focus { border-color: var(--color-accent); }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  height: 36px;
  padding: 0 16px;
  background: var(--gradient-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:hover:not(:disabled) { opacity: 0.9; }
}
```

- [ ] **Step 3: Verify build**

```bash
npx ng build --configuration development 2>&1 | tail -5
```
Expected: `Application bundle generation complete.`

- [ ] **Step 4: Commit**

```bash
git add ai-chat-frontend/src/app/features/profile/
git commit -m "style: redesign profile page with avatar upload and editable fields"
```

---

## Task 12: Change Password Page Redesign

**Files:**
- Modify: `ai-chat-frontend/src/app/features/change-password/change-password.component.html`
- Modify: `ai-chat-frontend/src/app/features/change-password/change-password.component.scss`

- [ ] **Step 1: Update change-password.component.html**

```html
<div class="change-password-page">
  <div class="page-header">
    <h1 class="page-title">Settings</h1>
    <p class="page-subtitle">Change your account password</p>
  </div>

  <div class="card">
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
      <div class="field">
        <label class="field-label" for="current-password">Current Password</label>
        <input
          id="current-password"
          class="field-input"
          type="password"
          formControlName="currentPassword"
          placeholder="Enter current password"
          autocomplete="current-password"
        />
      </div>

      <div class="field">
        <label class="field-label" for="new-password">New Password</label>
        <input
          id="new-password"
          class="field-input"
          type="password"
          formControlName="newPassword"
          placeholder="Min. 8 characters"
          autocomplete="new-password"
        />
        @if (form.get('newPassword')?.hasError('minlength') && form.get('newPassword')?.touched) {
          <span class="field-error">Password must be at least 8 characters</span>
        }
      </div>

      <div class="field">
        <label class="field-label" for="confirm-password">Confirm New Password</label>
        <input
          id="confirm-password"
          class="field-input"
          type="password"
          formControlName="confirmPassword"
          placeholder="Repeat new password"
          autocomplete="new-password"
        />
        @if (form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
          <span class="field-error">Passwords do not match</span>
        }
      </div>

      @if (error) {
        <p class="alert-error">{{ error }}</p>
      }

      <button class="btn-primary" type="submit" [disabled]="loading || form.invalid">
        @if (loading) { Updating... } @else { Update Password }
      </button>
    </form>
  </div>
</div>
```

- [ ] **Step 2: Update change-password.component.scss**

```scss
.change-password-page {
  max-width: 440px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 24px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
}

.field-input {
  height: 42px;
  padding: 0 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;

  &::placeholder { color: var(--color-text-subtle); }
  &:focus { border-color: var(--color-accent); }
}

.field-error {
  font-size: 12px;
  color: var(--color-danger);
}

.alert-error {
  padding: 9px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-danger);
}

.btn-primary {
  height: 42px;
  background: var(--gradient-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
  transition: opacity 0.15s;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:hover:not(:disabled) { opacity: 0.9; }
}
```

- [ ] **Step 3: Verify full build and tests**

```bash
npx ng build --configuration development 2>&1 | tail -5
npx ng test --watch=false --browsers=ChromeHeadless 2>&1 | tail -15
```
Expected: Build succeeds. All tests pass.

- [ ] **Step 4: Commit**

```bash
git add ai-chat-frontend/src/app/features/change-password/
git commit -m "style: redesign change password page with Dark Pro card layout"
```

---

## Task 13: Final QA + Test Run

- [ ] **Step 1: Run the full test suite**

```bash
cd ai-chat-frontend
npx ng test --watch=false --browsers=ChromeHeadless 2>&1 | tail -20
```
Expected: All specs pass, 0 failures. Fix any failures before proceeding.

- [ ] **Step 2: Build production bundle**

```bash
npx ng build --configuration production 2>&1 | tail -10
```
Expected: `Application bundle generation complete.` with no errors or warnings.

- [ ] **Step 3: Verify .gitignore covers brainstorm output**

Check that `.superpowers/` is in `.gitignore`. If not:

```bash
echo '.superpowers/' >> ../.gitignore
git add ../.gitignore
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git status  # review — should be clean or just .gitignore
git commit -m "chore: final QA pass — all tests green, production build clean" --allow-empty
```
