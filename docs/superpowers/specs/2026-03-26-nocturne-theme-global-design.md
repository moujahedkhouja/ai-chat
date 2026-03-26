# Nocturne Theme — Global Application Redesign
**Date:** 2026-03-26
**Status:** Approved

---

## Overview

Apply the "Nocturne" design system (introduced on the login page) consistently across every surface of the AI Chat Angular frontend. The theme uses a deep forest-navy sidebar, warm amber-gold accents, and a warm-cream content area (light mode) or near-black (dark mode), with Cormorant Garamond display typography, DM Sans body, and Noto Sans Arabic for RTL/Arabic.

---

## Scope

All 14 component SCSS files + the global `styles.scss`:

| File | Type |
|---|---|
| `src/styles.scss` | Global tokens |
| `shell/shell.component.scss` | Layout chrome |
| `shared/components/sidebar/sidebar.component.scss` | Desktop nav |
| `shared/components/bottom-tab-bar/bottom-tab-bar.component.scss` | Mobile nav |
| `features/chat/chat.component.scss` | Chat page layout |
| `features/chat/conversation-list/conversation-list.component.scss` | Conv list panel |
| `features/chat/message-thread/message-thread.component.scss` | Message scroll area |
| `features/chat/message-bubble/message-bubble.component.scss` | User + AI bubbles |
| `features/chat/chat-input/chat-input.component.scss` | Composer input |
| `features/dashboard/dashboard.component.scss` | Stats + table |
| `features/profile/profile.component.scss` | Profile form |
| `features/users/users.component.scss` | Users table |
| `features/users/create-user-dialog/create-user-dialog.component.scss` | Modal dialog |
| `features/change-password/change-password.component.scss` | Password form |

HTML templates are updated only where needed to swap hardcoded gradient SVG colors (logo mark in sidebar, shell top bar) from purple to gold. No structural HTML changes.

---

## Design Tokens (`styles.scss`)

### Fonts
Replace `Outfit` with:
```scss
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');
```

```scss
--f-display: 'Cormorant Garamond', Georgia, serif;
--f-body:    'DM Sans', -apple-system, sans-serif;
--f-arabic:  'Noto Sans Arabic', 'Segoe UI', sans-serif;
```

`body` base font: `var(--f-body)`. `[dir="rtl"] body` switches to `var(--f-arabic)`.

### Color Tokens

| Token | Dark (`:root`) | Light (`html.theme-light`) |
|---|---|---|
| `--color-bg` | `#0c0f14` | `#f2ede4` |
| `--color-surface` | `#0f1820` | `#ffffff` |
| `--color-card` | `#111b14` | `#fffdf9` |
| `--color-border` | `rgba(200,147,76,0.1)` | `rgba(0,0,0,0.07)` |
| `--color-accent` | `#c8934c` | `#b8832e` |
| `--color-accent-hi` | `#e8b472` | `#d4a040` |
| `--color-accent-muted` | `rgba(200,147,76,0.10)` | `rgba(184,131,46,0.08)` |
| `--color-accent-border` | `rgba(200,147,76,0.22)` | `rgba(184,131,46,0.20)` |
| `--color-text` | `#ede8e0` | `#1a1510` |
| `--color-text-muted` | `#7a7060` | `#6b5e48` |
| `--color-text-subtle` | `#3e3830` | `#b0a898` |
| `--color-danger` | `#e06060` | `#c94040` |
| `--color-success` | `#5aaa7a` | `#2e7d52` |
| `--gradient-accent` | `linear-gradient(135deg, #b8832e, #e8b472)` | same |

### Layout Tokens (unchanged)
```scss
--sidebar-width:    60px;
--topbar-height:    52px;
--bottombar-height: 56px;
--radius-sm:  6px;
--radius-md:  8px;
--radius-lg:  10px;
--radius-xl:  12px;
```

---

## Section 2 — Shell Chrome

### Sidebar (`sidebar.component.scss`)
- Background: `#091422` (deep forest-navy, matches login hero)
- Logo SVG gradient: replace `#6366f1 → #8b5cf6` with `#b8832e → #e8b472` (gold)
- Nav icons at rest: `rgba(240,232,216,0.32)`
- Nav icons on hover/active: `var(--color-accent)` with `2px` inset-inline-start gold border on active item
- Theme toggle + avatar footer: gold tint on hover, avatar initials badge gold-bg dark-text
- RTL: `:host-context([dir="rtl"])` flips active border to inset-inline-end

### Shell (`shell.component.scss`)
- Shell background: `var(--color-bg)`
- Top bar: `var(--color-surface)` bg, `1px` bottom border `var(--color-border)`
- Top bar logo SVG gradient: gold (same swap as sidebar)
- Greeting text: DM Sans 400, `var(--color-text-muted)`
- Notification icon btn: `var(--color-text-subtle)` → `var(--color-accent)` on hover

### Bottom Tab Bar (`bottom-tab-bar.component.scss`)
- Background: `#091422` (matches sidebar)
- Icons: same rest/active rules as sidebar
- Active indicator: 2px top border gold on active tab
- Safe-area bottom padding preserved

---

## Section 3 — Chat Interface

### Chat Page Layout (`chat.component.scss`)
- Full-height grid: conversation panel `280px` fixed + chat panel `1fr`
- Mobile: conv panel hidden off-screen, slides in as drawer

### Conversation List (`conversation-list.component.scss`)
- Background: `#0d1620` (between sidebar darkness and content lightness)
- "New Chat" button: `var(--gradient-accent)`, dark text, `border-radius: var(--radius-lg)`, full width
- Conv items: DM Sans 500 title, muted gold timestamp
  - Hover: `rgba(200,147,76,0.06)` bg
  - Active: `2px inset-inline-start` gold border + `rgba(200,147,76,0.10)` bg
- Delete button: appears on hover, danger red, icon-only

### Message Thread (`message-thread.component.scss`)
- Background: `var(--color-bg)`
- Messages container: max-width `720px`, centered, `24px` horizontal padding
- Smooth scroll, padding-bottom for input overlap

### Message Bubbles (`message-bubble.component.scss`)
- **User bubble**: `rgba(200,147,76,0.12)` bg, `1px solid rgba(200,147,76,0.22)` border, `border-radius: 14px 14px 4px 14px`, warm off-white text, aligned end
- **AI bubble**: `var(--color-card)` bg, `1px solid var(--color-border)` border, `border-radius: 14px 14px 14px 4px`, aligned start
- Timestamps: `10px` DM Sans, `var(--color-text-subtle)`
- Typing indicator: three dots, `var(--color-accent)` fill, staggered bounce animation

### Chat Input (`chat-input.component.scss`)
- Container: `var(--color-surface)` bg, `1px` top border `var(--color-border)`
- Textarea: `var(--color-card)` bg, `border-radius: var(--radius-xl)`, gold focus ring `0 0 0 3px rgba(200,147,76,0.18)`
- Send button: `var(--gradient-accent)` circle, dark icon, lifts on hover with gold shadow
- DM Sans font for input text; Noto Sans Arabic in RTL

---

## Section 4 — Secondary Pages

### Dashboard (`dashboard.component.scss`)
- Page title: Cormorant Garamond 700, `clamp(28px, 3vw, 36px)`
- Stat cards: `var(--color-card)` bg, `1px` gold-tinted border, icon in `rgba(200,147,76,0.10)` circle, value in Cormorant Garamond 700, label DM Sans muted
- Table: gold-tinted header border-bottom, hover rows `rgba(200,147,76,0.03)`, role badges as styled pills
- "View all" link: `var(--color-accent)`, underline on hover

### Profile (`profile.component.scss`)
- Avatar: gold border ring `2px solid var(--color-accent)`, initials in Cormorant Garamond
- Form fields: floating-label pattern identical to login page inputs
- Save button: `var(--gradient-accent)`, matches login submit

### Users (`users.component.scss`)
- Same table style as Dashboard
- "Create User" CTA: `var(--gradient-accent)` primary button

### Create User Dialog (`create-user-dialog.component.scss`)
- Backdrop: `rgba(0,0,0,0.65)` overlay
- Modal card: glassmorphism — `var(--color-card)` bg, `backdrop-filter: blur(24px)`, gold border `var(--color-accent-border)`, `border-radius: var(--radius-xl)`
- Inputs: same floating-label style
- Submit: gold gradient button

### Change Password (`change-password.component.scss`)
- Centered card identical in style to login card (max-width `420px`, glassmorphism, gold border)
- Floating-label inputs, gold submit button
- Feels like a visual continuation of the login page

---

## RTL / Arabic Support

All components apply `:host-context([dir="rtl"])` overrides:
- Font switches to `var(--f-arabic)` for all text
- `inset-inline-start/end` logical properties used throughout (no hardcoded `left`/`right`)
- Active border in sidebar/conv-list flips side automatically via logical properties
- Arrow icons in buttons use `transform: scaleX(-1)`

---

## Implementation Approach

- **No HTML structural changes** except SVG gradient color values in sidebar and shell (purple → gold)
- **All changes confined to SCSS files + `styles.scss`**
- **One file at a time**: global tokens first, then shell chrome, then chat, then secondary pages
- **Login component untouched** — already on Nocturne
- **`themeService` logic untouched** — it toggles `html.theme-light`, which still works with new token values

---

## Out of Scope

- No changes to TypeScript logic, routing, or services
- No new components created
- No changes to Angular animations or `@angular/material` (none used)
