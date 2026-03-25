# Dark Pro UI Redesign + Angular Upgrade — Design Spec

**Date:** 2026-03-25
**Branch:** claude/pensive-pascal
**Scope:** Full UI redesign (Dark Pro theme, mobile-first) + Angular upgrade from 19 → latest stable (21)

---

## 1. Goals

- Replace the current desktop-only, unstyled UI with a polished Dark Pro design system
- Make every page fully responsive with a mobile-first approach
- Upgrade Angular from v19 to the latest stable (v21), stepping through each major version via `ng update`
- Note: Upgrade to Angular v22 once it goes GA (~May 2026); that is a follow-up task

---

## 2. Design System

### Color Tokens (CSS custom properties on `:root`)

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#0f1117` | Page background |
| `--color-surface` | `#13151f` | Sidebar, top bar, bottom tab bar |
| `--color-card` | `#1a1d27` | Cards, table rows, dialogs |
| `--color-border` | `#1e2235` | All borders and dividers |
| `--color-accent` | `#6366f1` | Primary accent (indigo) |
| `--color-accent-2` | `#8b5cf6` | Secondary accent (violet) |
| `--color-accent-muted` | `rgba(99,102,241,0.15)` | Active nav backgrounds |
| `--color-text` | `#e2e8f0` | Primary text |
| `--color-text-muted` | `#64748b` | Secondary / label text |
| `--color-text-subtle` | `#475569` | Placeholder, disabled |
| `--color-danger` | `#ef4444` | Destructive actions |
| `--color-success` | `#22c55e` | Success states |

### Typography

- **Font:** Inter (already present), with `system-ui` fallback
- **Weights:** 400 (body), 500 (labels), 600 (headings), 700 (page titles)
- **Scale:** 11px labels · 13px body · 15px subheadings · 18px headings · 24px page titles

### Spacing & Shape

- **Border radius:** 6px inputs · 8px cards · 10px large cards · 50% avatars
- **Sidebar width (desktop):** 60px (icon-only)
- **Top bar height:** 52px
- **Bottom tab bar height:** 56px (mobile only)
- **Card padding:** 16px
- **Page padding:** 20px desktop · 16px mobile

### Accent Gradient

`linear-gradient(135deg, #6366f1, #8b5cf6)` — used on logo, primary buttons, active states, user avatars.

### Role Badge Colors

| Role | Background | Text |
|---|---|---|
| ADMIN | `rgba(99,102,241,0.2)` | `#818cf8` |
| MODERATOR | `rgba(139,92,246,0.2)` | `#a78bfa` |
| USER | `rgba(100,116,139,0.2)` | `#94a3b8` |

---

## 3. Layout Architecture

### Breakpoints

| Name | Width | Layout |
|---|---|---|
| mobile | `< 768px` | No sidebar · bottom tab bar |
| tablet | `768px – 1023px` | No sidebar · bottom tab bar |
| desktop | `≥ 1024px` | Icon sidebar · no bottom tabs |

### Desktop Shell (`ShellComponent`)

```
┌──────────┬────────────────────────────────────┐
│  60px    │  52px top bar                       │
│  icon    ├────────────────────────────────────┤
│  sidebar │  <router-outlet>                    │
│          │  (scrollable content area)          │
│  avatar  │                                     │
└──────────┴────────────────────────────────────┘
```

- Sidebar: fixed left, full height, `position: fixed` on desktop
- Top bar: fixed top, full width minus sidebar, `position: fixed`
- Content: `margin-left: 60px`, `margin-top: 52px`, `overflow-y: auto`

### Mobile Shell

```
┌────────────────────────────────────┐
│  52px top bar (logo + page title)  │
├────────────────────────────────────┤
│  <router-outlet>                   │
│  (scrollable content area)         │
│                                    │
├────────────────────────────────────┤
│  56px bottom tab bar               │
└────────────────────────────────────┘
```

- Sidebar: hidden entirely on mobile/tablet
- Top bar: full width
- Content: `margin-top: 52px`, `padding-bottom: 56px`
- Bottom tab bar: fixed bottom, full width

---

## 4. Component Designs

### 4.1 Sidebar (`SidebarComponent`)

**Desktop only** — hidden via `display: none` below 1024px.

- Logo: 36×36px gradient square (indigo→violet), border-radius 10px
- Nav items: 40×40px icon buttons, tooltip on hover, active state uses `--color-accent-muted` background + `1px solid rgba(99,102,241,0.3)` border
- Avatar: bottom of sidebar, 36×36px, gradient background, initials fallback, tooltip shows username + role
- No text labels — icons only

Nav items (in order): Dashboard · Profile · Users (admin/moderator only)

### 4.2 Bottom Tab Bar (mobile `<768px` / tablet `<1024px`)

Fixed to bottom of viewport. 4 tabs: **Home · Profile · Users · Settings**

- **Home** → `/dashboard`
- **Profile** → `/profile`
- **Users** → `/users` (admin/moderator only — hidden for USER role, giving a 3-tab layout)
- **Settings** → `/change-password` (account settings, the only settings page in scope)
- Active tab: icon tinted `--color-accent`, label in `--color-accent`, small dot indicator
- Inactive: icon `#374151`, label `--color-text-subtle`
- Safe area: add `padding-bottom: env(safe-area-inset-bottom)` for iOS notch support

### 4.3 Top Bar

Both desktop and mobile. Contains:
- **Left:** page title (bold, `--color-text`) + subtitle (muted, e.g. "Welcome back, {username}")
- **Right:** notification icon button + user avatar (desktop only shows avatar as small 28px)
- Mobile: left shows app logo + page name; right shows a single icon button

### 4.4 Login Page (`LoginComponent`)

Full-page centered layout, no shell wrapping.

- Background: `--color-bg` with subtle radial gradient overlay (`rgba(99,102,241,0.05)`)
- Card: `--color-card`, border `--color-border`, border-radius 12px, padding 32px, max-width 400px, centered
- Logo above card: gradient square + app name
- Inputs: dark background (`--color-surface`), border `--color-border`, focus border `--color-accent`, border-radius 6px, height 44px
- Submit button: full width, gradient accent, height 44px, border-radius 6px
- Mobile: card is full width with 16px horizontal margin

### 4.5 Dashboard (`DashboardComponent`)

- 3-column stat card grid (desktop) → single column stack (mobile)
- Stat cards: `--color-card` background, accent gradient progress bar, percentage label
- Recent users mini-table below stats
- "New User" button (admin only): gradient accent, top-right of table header

### 4.6 Users Page (`UsersComponent`)

- Full-width table on desktop with columns: Avatar+Name · Email · Role badge · Actions
- Mobile: card-list layout — each user renders as a card with name, email, role badge, and action buttons stacked
- Pagination: simple prev/next with current page indicator, styled with `--color-card` buttons
- Delete action: red icon button, confirm dialog before action
- Create user button: gradient accent, top-right

### 4.7 Create User Dialog (`CreateUserDialogComponent`)

- Modal overlay with backdrop blur
- Dialog: `--color-card`, border `--color-border`, border-radius 12px, max-width 480px
- Fields: Username · Email · Password · Role (select)
- Mobile: dialog is full-screen bottom sheet (slides up), border-radius only on top corners

### 4.8 Profile Page (`ProfileComponent`)

- Avatar upload: large (80px) circle, gradient border, click-to-upload overlay
- Info fields in a card: editable inline or via form
- LinkedIn URL field with icon
- Save button: gradient accent, right-aligned
- Mobile: single column, full-width inputs

### 4.9 Change Password Page (`ChangePasswordComponent`)

- Single card, max-width 400px, centered
- 3 fields: current password · new password · confirm
- Submit: full-width gradient button
- Validation errors inline below each field in `--color-danger`

---

## 5. Angular Upgrade Plan

### Path: 19 → 20 → 21

Run `ng update` for each major version sequentially. Do not skip versions.

```bash
# Step 1
npx ng update @angular/core@20 @angular/cli@20

# Step 2
npx ng update @angular/core@21 @angular/cli@21
```

### Known migration concerns

- **Standalone components:** Already in use — no NgModule migration needed
- **Signal APIs:** Angular 20+ promotes signal-based inputs/outputs. Migrate opportunistically where it simplifies components, but do not force a full signal rewrite — that is out of scope
- **`@angular/forms`:** Ensure typed forms compatibility is preserved across versions
- **HTTP:** `HttpClient` API is stable; interceptors are already functional
- **Routing:** `RouterModule`-less routing already used — should be forward-compatible
- **Testing:** Re-run `ng test` after each major version upgrade and fix any broken specs before proceeding to the next version

### Post-upgrade

After reaching v21, bump `package.json` engines field and update the README with the new Angular version.

---

## 6. Implementation Order

1. Angular upgrade: 19 → 20 → 21 (fix any breakage at each step)
2. Define CSS custom properties in `styles.scss` (design tokens)
3. Redesign `ShellComponent` + `SidebarComponent` (desktop layout)
4. Add `BottomTabBarComponent` (mobile nav)
5. Redesign `LoginComponent`
6. Redesign `DashboardComponent`
7. Redesign `UsersComponent` (table + mobile card view)
8. Redesign `CreateUserDialogComponent`
9. Redesign `ProfileComponent`
10. Redesign `ChangePasswordComponent`
11. Cross-browser / responsive QA pass
12. Run full test suite; fix failures

---

## 7. Out of Scope

- Angular v22 upgrade (follow-up, once v22 goes GA ~May 2026)
- Adding new features (chat UI, notifications system, etc.)
- Full signal-based component rewrite
- Dark/light theme toggle
- Animations beyond simple CSS transitions
