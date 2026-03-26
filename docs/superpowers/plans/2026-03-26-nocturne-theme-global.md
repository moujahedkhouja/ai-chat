# Nocturne Theme — Global Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the purple/indigo design system with the Nocturne theme (amber gold, forest navy, Cormorant Garamond + DM Sans + Noto Sans Arabic) across all 14 component SCSS files and the global stylesheet.

**Architecture:** Global CSS tokens in `styles.scss` cascade to all components automatically for anything using `var(--color-*)`. Per-component SCSS is fully rewritten to apply Nocturne-specific values (background colours, typography, RTL rules) that go beyond simple token swaps. Two HTML templates get their hardcoded SVG gradient colours updated from purple to gold.

**Tech Stack:** Angular 18 standalone components, SCSS with nesting, CSS custom properties, Google Fonts via `@import`, `backdrop-filter` glassmorphism, logical CSS properties for RTL.

---

## Files Modified

| File | Change |
|---|---|
| `src/styles.scss` | Full token rewrite + font import |
| `src/app/shell/shell.component.html` | SVG gradient stop colours only |
| `src/app/shell/shell.component.scss` | Token-aware reskin |
| `src/app/shared/components/sidebar/sidebar.component.html` | SVG gradient stop colours only |
| `src/app/shared/components/sidebar/sidebar.component.scss` | Full rewrite — dark navy bg, gold active state, RTL |
| `src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component.scss` | Dark navy bg, gold active, top-border indicator |
| `src/app/features/chat/chat.component.scss` | Conv panel bg depth, chat title font |
| `src/app/features/chat/conversation-list/conversation-list.component.scss` | Deep bg, gold active border, dark-text buttons |
| `src/app/features/chat/message-thread/message-thread.component.scss` | Avatar + typing dot colours |
| `src/app/features/chat/message-bubble/message-bubble.component.scss` | User bubble gold-tinted, AI bubble card style |
| `src/app/features/chat/chat-input/chat-input.component.scss` | Gold focus ring, dark-text send button |
| `src/app/features/dashboard/dashboard.component.scss` | Display font titles, gold role badges, stat card top bar |
| `src/app/features/profile/profile.component.scss` | Gold avatar ring, gold role badges, gold input focus |
| `src/app/features/users/users.component.scss` | Gold role badges, table hover, dark-text buttons |
| `src/app/features/users/create-user-dialog/create-user-dialog.component.scss` | Glassmorphism card, gold input focus |
| `src/app/features/change-password/change-password.component.scss` | Display font, gold input focus, gold submit button |

---

## Task 1: Global Design Tokens

**Files:**
- Modify: `src/styles.scss`

- [ ] **Step 1: Replace the entire file**

```scss
/* ─── Nocturne Design System ──────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');

/* Dark tokens — default */
:root {
  --color-bg:            #0c0f14;
  --color-surface:       #0f1820;
  --color-card:          #111b14;
  --color-border:        rgba(200, 147, 76, 0.1);

  --color-accent:        #c8934c;
  --color-accent-hi:     #e8b472;
  --color-accent-muted:  rgba(200, 147, 76, 0.10);
  --color-accent-border: rgba(200, 147, 76, 0.22);

  --color-text:          #ede8e0;
  --color-text-muted:    #7a7060;
  --color-text-subtle:   #3e3830;

  --color-danger:        #e06060;
  --color-success:       #5aaa7a;

  --gradient-accent: linear-gradient(135deg, #b8832e 0%, #e8b472 100%);

  --f-display: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --f-body:    'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --f-arabic:  'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif;

  --sidebar-width:    60px;
  --topbar-height:    52px;
  --bottombar-height: 56px;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 12px;
}

/* Light theme overrides — applied when <html class="theme-light"> */
html.theme-light {
  --color-bg:            #f2ede4;
  --color-surface:       #ffffff;
  --color-card:          #fffdf9;
  --color-border:        rgba(0, 0, 0, 0.07);

  --color-accent:        #b8832e;
  --color-accent-hi:     #d4a040;
  --color-accent-muted:  rgba(184, 131, 46, 0.08);
  --color-accent-border: rgba(184, 131, 46, 0.20);

  --color-text:          #1a1510;
  --color-text-muted:    #6b5e48;
  --color-text-subtle:   #b0a898;

  --color-danger:        #c94040;
  --color-success:       #2e7d52;

  --gradient-accent: linear-gradient(135deg, #b8832e 0%, #e8b472 100%);
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
  font-family: var(--f-body);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

[dir="rtl"] body {
  font-family: var(--f-arabic);
}
```

- [ ] **Step 2: Verify Angular compiles**

```bash
cd ai-chat-frontend && npx ng build --configuration development 2>&1 | tail -5
```
Expected: `Build at:` line with no errors. SCSS syntax errors show as `Error:`.

- [ ] **Step 3: Commit**

```bash
git add src/styles.scss
git commit -m "style: replace global tokens with Nocturne design system"
```

---

## Task 2: SVG Gradient Colours in HTML Templates

**Files:**
- Modify: `src/app/shell/shell.component.html`
- Modify: `src/app/shared/components/sidebar/sidebar.component.html`

- [ ] **Step 1: Update shell top-bar logo gradient** — find these two `<stop>` lines inside `#logo-grad` in `shell.component.html` and replace:

Old:
```html
<stop stop-color="#6366f1"/>
<stop offset="1" stop-color="#8b5cf6"/>
```

New:
```html
<stop stop-color="#b8832e"/>
<stop offset="1" stop-color="#e8b472"/>
```

- [ ] **Step 2: Update sidebar logo gradient** — find these two `<stop>` lines inside `#sb-grad` in `sidebar.component.html` and replace:

Old:
```html
<stop stop-color="#6366f1"/>
<stop offset="1" stop-color="#8b5cf6"/>
```

New:
```html
<stop stop-color="#b8832e"/>
<stop offset="1" stop-color="#e8b472"/>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/shell/shell.component.html src/app/shared/components/sidebar/sidebar.component.html
git commit -m "style: update SVG logo gradients from purple to Nocturne gold"
```

---

## Task 3: Shell Component SCSS

**Files:**
- Modify: `src/app/shell/shell.component.scss`

- [ ] **Step 1: Replace the entire file**

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
    margin-inline-start: var(--sidebar-width);
  }
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  height: var(--topbar-height);
  background: var(--color-bg);
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
  font-family: var(--f-body);
  color: var(--color-text-muted);
}

:host-context([dir="rtl"]) .top-bar-greeting {
  font-family: var(--f-arabic);
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-subtle);
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

.shell-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: calc(var(--bottombar-height) + 20px);

  @media (min-width: 1024px) {
    padding-bottom: 20px;
  }
}

/* Chat page needs no padding — it manages its own layout */
.shell-content--flush {
  padding: 0;
  overflow: hidden;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/shell/shell.component.scss
git commit -m "style: apply Nocturne theme to shell chrome"
```

---

## Task 4: Sidebar Component SCSS

**Files:**
- Modify: `src/app/shared/components/sidebar/sidebar.component.scss`

- [ ] **Step 1: Replace the entire file**

```scss
.sidebar {
  position: fixed;
  top: 0;
  inset-inline-start: 0;
  width: var(--sidebar-width);
  height: 100dvh;
  background: #091422;
  border-inline-end: 1px solid rgba(200, 147, 76, 0.1);
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
  color: rgba(240, 232, 216, 0.32);
  text-decoration: none;
  transition: color 0.15s, background 0.15s;
  position: relative;

  &:hover {
    color: rgba(240, 232, 216, 0.75);
    background: rgba(200, 147, 76, 0.08);
  }

  &.active {
    color: var(--color-accent);
    background: var(--color-accent-muted);
    box-shadow: inset 2px 0 0 var(--color-accent);
  }
}

:host-context([dir="rtl"]) .nav-item.active {
  box-shadow: inset -2px 0 0 var(--color-accent);
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
}

.theme-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(200, 147, 76, 0.08);
  border: 1px solid rgba(200, 147, 76, 0.12);
  color: rgba(240, 232, 216, 0.40);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: var(--color-accent);
    background: rgba(200, 147, 76, 0.14);
  }
}

.avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--gradient-accent);
  border: 2px solid rgba(200, 147, 76, 0.25);
  color: #0c0a06;
  font-size: 13px;
  font-weight: 700;
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

- [ ] **Step 2: Commit**

```bash
git add src/app/shared/components/sidebar/sidebar.component.scss
git commit -m "style: apply Nocturne theme to sidebar — dark navy, gold active states"
```

---

## Task 5: Bottom Tab Bar SCSS

**Files:**
- Modify: `src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component.scss`

- [ ] **Step 1: Replace the entire file**

```scss
.bottom-tab-bar {
  position: fixed;
  bottom: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  height: var(--bottombar-height);
  padding-bottom: env(safe-area-inset-bottom);
  background: #091422;
  border-top: 1px solid rgba(200, 147, 76, 0.1);
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
  color: rgba(240, 232, 216, 0.32);
  padding: 6px 0;
  position: relative;
  transition: color 0.15s ease;

  &.active {
    color: var(--color-accent);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      inset-inline-start: 25%;
      inset-inline-end: 25%;
      height: 2px;
      background: var(--color-accent);
      border-radius: 0 0 2px 2px;
    }
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
  font-family: var(--f-body);
}

:host-context([dir="rtl"]) .tab-label {
  font-family: var(--f-arabic);
}

.tab-logout {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    color: var(--color-danger);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component.scss
git commit -m "style: apply Nocturne theme to bottom tab bar"
```

---

## Task 6: Chat Page Layout SCSS

**Files:**
- Modify: `src/app/features/chat/chat.component.scss`

- [ ] **Step 1: Replace the entire file**

```scss
:host {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-page {
  display: flex;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* Mobile drawer overlay */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 298;

  @media (min-width: 768px) {
    display: none;
  }
}

/* Conversation list panel */
.conv-panel {
  width: 260px;
  flex-shrink: 0;
  border-inline-end: 1px solid var(--color-border);
  background: #0d1620;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 767px) {
    position: fixed;
    top: 0;
    inset-inline-start: 0;
    bottom: 0;
    z-index: 299;
    transform: translateX(-100%);
    transition: transform 0.25s ease;

    &.open {
      transform: translateX(0);
    }
  }
}

:host-context([dir="rtl"]) .conv-panel {
  @media (max-width: 767px) {
    transform: translateX(100%);

    &.open {
      transform: translateX(0);
    }
  }
}

/* Chat area */
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: var(--color-bg);
}

/* Chat header bar */
.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
}

.menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-md);
  line-height: 0;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: var(--color-accent);
    background: var(--color-accent-muted);
  }

  @media (max-width: 767px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.chat-title {
  font-family: var(--f-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:host-context([dir="rtl"]) .chat-title {
  font-family: var(--f-arabic);
}

/* Empty state */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--color-text-muted);
  font-size: 14px;

  button {
    padding: 10px 24px;
    background: var(--gradient-accent);
    border: none;
    border-radius: var(--radius-md);
    color: #0c0a06;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.15s;

    &:hover {
      box-shadow: 0 4px 16px rgba(200, 147, 76, 0.35);
      transform: translateY(-1px);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/chat/chat.component.scss
git commit -m "style: apply Nocturne theme to chat page layout"
```

---

## Task 7: Conversation List SCSS

**Files:**
- Modify: `src/app/features/chat/conversation-list/conversation-list.component.scss`

- [ ] **Step 1: Replace the entire file**

```scss
.conv-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.conv-toolbar {
  display: flex;
  gap: 8px;
  padding: 12px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border);
}

.search-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 10px;
  height: 32px;
  transition: border-color 0.18s;

  &:focus-within {
    border-color: var(--color-accent-border);
    box-shadow: 0 0 0 2.5px rgba(200, 147, 76, 0.1);
  }
}

.search-icon {
  color: var(--color-text-subtle);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text);
  font-size: 12px;
  font-family: var(--f-body);

  &::placeholder {
    color: var(--color-text-subtle);
  }
}

:host-context([dir="rtl"]) .search-input {
  font-family: var(--f-arabic);
}

.new-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--gradient-accent);
  border: none;
  color: #0c0a06;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: box-shadow 0.18s, transform 0.15s;

  &:hover {
    box-shadow: 0 3px 12px rgba(200, 147, 76, 0.32);
    transform: scale(1.06);
  }
}

.conv-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.group-label {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-subtle);
  padding: 8px 8px 4px;
  font-family: var(--f-body);
}

:host-context([dir="rtl"]) .group-label {
  font-family: var(--f-arabic);
  letter-spacing: 0;
}

.conv-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.12s;
  margin-bottom: 2px;
  border: 1px solid transparent;

  &:hover {
    background: rgba(200, 147, 76, 0.06);

    .conv-delete { opacity: 1; }
  }

  &.active {
    background: rgba(200, 147, 76, 0.10);
    border-color: var(--color-accent-border);
    box-shadow: inset 2px 0 0 var(--color-accent);
  }
}

:host-context([dir="rtl"]) .conv-item.active {
  box-shadow: inset -2px 0 0 var(--color-accent);
}

.conv-title {
  flex: 1;
  font-size: 13px;
  font-family: var(--f-body);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .active & { color: var(--color-accent); }
}

:host-context([dir="rtl"]) .conv-title {
  font-family: var(--f-arabic);
}

.conv-delete {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: none;
  border: none;
  color: var(--color-text-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  flex-shrink: 0;
  transition: opacity 0.12s, color 0.12s;

  &:hover { color: var(--color-danger); }
}

.conv-empty {
  font-size: 12px;
  color: var(--color-text-subtle);
  text-align: center;
  padding: 28px 12px;
  font-family: var(--f-body);
}

:host-context([dir="rtl"]) .conv-empty {
  font-family: var(--f-arabic);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/chat/conversation-list/conversation-list.component.scss
git commit -m "style: apply Nocturne theme to conversation list"
```

---

## Task 8: Message Thread SCSS

**Files:**
- Modify: `src/app/features/chat/message-thread/message-thread.component.scss`

- [ ] **Step 1: Replace the entire file**

```scss
.thread {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
}

.typing-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.typing-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--gradient-accent);
  color: #0c0a06;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.typing-bubble {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 0 12px 12px 12px;
  padding: 12px 16px;
  display: flex;
  gap: 5px;
  align-items: center;
}

:host-context([dir="rtl"]) .typing-bubble {
  border-radius: 12px 0 12px 12px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: typing-bounce 1.2s ease-in-out infinite;

  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
}

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
  30%           { transform: translateY(-5px); opacity: 1; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/chat/message-thread/message-thread.component.scss
git commit -m "style: apply Nocturne theme to message thread"
```

---

## Task 9: Message Bubble SCSS

**Files:**
- Modify: `src/app/features/chat/message-bubble/message-bubble.component.scss`

- [ ] **Step 1: Replace the entire file**

```scss
.bubble {
  display: flex;
  gap: 10px;
  align-items: flex-start;

  &--user {
    flex-direction: row-reverse;
  }
}

.bubble-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--gradient-accent);
  color: #0c0a06;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bubble-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 72%;
}

/* User message bubble — gold-tinted */
.bubble-text {
  background: rgba(200, 147, 76, 0.13);
  border: 1px solid rgba(200, 147, 76, 0.22);
  color: var(--color-text);
  border-radius: 14px 14px 4px 14px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: var(--f-body);
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

:host-context([dir="rtl"]) .bubble-text {
  font-family: var(--f-arabic);
  border-radius: 14px 14px 14px 4px;
}

/* AI message bubble — card style */
.bubble-markdown {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 4px 14px 14px 14px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: var(--f-body);
  line-height: 1.6;
  color: var(--color-text);
  word-break: break-word;

  p { margin: 0 0 8px; &:last-child { margin-bottom: 0; } }
  strong { font-weight: 600; }
  em { font-style: italic; }
  ul, ol { padding-inline-start: 20px; margin: 6px 0; }
  li { margin: 2px 0; }

  code {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 1px 5px;
    font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 12px;
  }

  pre {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 12px;
    overflow-x: auto;
    margin: 8px 0;

    code {
      background: none;
      border: none;
      padding: 0;
      font-size: 12px;
    }
  }
}

:host-context([dir="rtl"]) .bubble-markdown {
  font-family: var(--f-arabic);
  border-radius: 14px 4px 14px 14px;
}

.bubble-time {
  font-size: 10px;
  color: var(--color-text-subtle);
  align-self: flex-end;
  font-family: var(--f-body);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/chat/message-bubble/message-bubble.component.scss
git commit -m "style: apply Nocturne theme to message bubbles — gold user, card AI"
```

---

## Task 10: Chat Input SCSS

**Files:**
- Modify: `src/app/features/chat/chat-input/chat-input.component.scss`

- [ ] **Step 1: Replace the entire file**

```scss
.input-wrap {
  padding: 12px 20px 10px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
}

.input-bar {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 10px 12px;
  transition: border-color 0.18s, box-shadow 0.18s;

  &:focus-within {
    border-color: var(--color-accent-border);
    box-shadow: 0 0 0 3px rgba(200, 147, 76, 0.10);
  }
}

.input-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text);
  font-size: 14px;
  font-family: var(--f-body);
  line-height: 1.5;
  resize: none;
  min-height: 22px;
  max-height: 120px;
  overflow-y: auto;

  &::placeholder {
    color: var(--color-text-subtle);
  }
}

:host-context([dir="rtl"]) .input-textarea {
  font-family: var(--f-arabic);
}

.send-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--gradient-accent);
  border: none;
  color: #0c0a06;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: box-shadow 0.18s, transform 0.15s, opacity 0.15s;

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  &:hover:not(:disabled) {
    box-shadow: 0 3px 14px rgba(200, 147, 76, 0.38);
    transform: scale(1.06);
  }
}

:host-context([dir="rtl"]) .send-btn svg {
  transform: scaleX(-1);
}

.input-hint {
  font-size: 10px;
  color: var(--color-text-subtle);
  text-align: center;
  margin-top: 6px;
  font-family: var(--f-body);
}

:host-context([dir="rtl"]) .input-hint {
  font-family: var(--f-arabic);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/chat/chat-input/chat-input.component.scss
git commit -m "style: apply Nocturne theme to chat input — gold focus ring, dark-text send"
```

---

## Task 11: Dashboard SCSS

**Files:**
- Modify: `src/app/features/dashboard/dashboard.component.scss`

- [ ] **Step 1: Replace the entire file**

```scss
.dashboard {
  max-width: 900px;
}

.page-header {
  margin-bottom: 28px;
}

.page-title {
  font-family: var(--f-display);
  font-size: clamp(26px, 3vw, 34px);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.1;
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

:host-context([dir="rtl"]) .page-subtitle {
  font-family: var(--f-arabic);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px 16px 16px;
  position: relative;
  overflow: hidden;
  transition: transform 0.15s ease, border-color 0.15s ease;

  /* Gold top accent bar */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--gradient-accent);
    opacity: 0.7;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: var(--color-accent-border);
  }
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

  /* Second card variant — slightly different gold shade */
  &--purple {
    background: rgba(200, 147, 76, 0.07);
    color: var(--color-accent-hi);
  }
}

.stat-value {
  font-family: var(--f-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 2px;
  letter-spacing: -0.02em;
  line-height: 1;
}

:host-context([dir="rtl"]) .stat-value {
  font-family: var(--f-arabic);
}

.stat-label {
  font-size: 11px;
  font-family: var(--f-body);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

:host-context([dir="rtl"]) .stat-label {
  font-family: var(--f-arabic);
  letter-spacing: 0;
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
  font-family: var(--f-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

:host-context([dir="rtl"]) .card-title {
  font-family: var(--f-arabic);
}

.card-text {
  font-size: 13px;
  font-family: var(--f-body);
  color: var(--color-text-muted);
  margin-top: 8px;
}

:host-context([dir="rtl"]) .card-text {
  font-family: var(--f-arabic);
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
  font-family: var(--f-body);
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

:host-context([dir="rtl"]) .table-header {
  font-family: var(--f-arabic);
  letter-spacing: 0;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
  align-items: center;
  transition: background 0.1s;

  &:hover {
    background: rgba(200, 147, 76, 0.03);
  }

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
  color: #0c0a06;
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
  font-family: var(--f-body);
  color: var(--color-text);
}

:host-context([dir="rtl"]) .user-name {
  font-family: var(--f-arabic);
}

.user-email {
  font-size: 12px;
  font-family: var(--f-body);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  font-family: var(--f-body);
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &.admin {
    background: rgba(200, 147, 76, 0.18);
    color: var(--color-accent-hi);
  }

  &.moderator {
    background: rgba(200, 147, 76, 0.10);
    color: var(--color-accent);
  }

  &.user {
    background: rgba(255, 255, 255, 0.06);
    color: var(--color-text-muted);
  }
}

.welcome-card {
  padding: 20px 16px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/dashboard/dashboard.component.scss
git commit -m "style: apply Nocturne theme to dashboard — display font, gold role badges"
```

---

## Task 12: Profile SCSS

**Files:**
- Modify: `src/app/features/profile/profile.component.scss`

- [ ] **Step 1: Replace the entire file**

```scss
.profile-page {
  max-width: 600px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-family: var(--f-display);
  font-size: clamp(26px, 3vw, 34px);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

:host-context([dir="rtl"]) .page-title {
  font-family: var(--f-arabic);
}

.alert-error,
.alert-success {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-family: var(--f-body);
  margin-bottom: 16px;
}

:host-context([dir="rtl"]) .alert-error,
:host-context([dir="rtl"]) .alert-success {
  font-family: var(--f-arabic);
}

.alert-error {
  background: rgba(224, 96, 96, 0.1);
  border: 1px solid rgba(224, 96, 96, 0.22);
  color: var(--color-danger);
}

.alert-success {
  background: rgba(90, 170, 122, 0.1);
  border: 1px solid rgba(90, 170, 122, 0.22);
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
  border: 2px solid var(--color-accent-border);
}

.avatar-initials {
  background: var(--gradient-accent);
  color: #0c0a06;
  font-family: var(--f-display);
  font-size: 26px;
  font-weight: 700;
  border: 2px solid var(--color-accent-border);
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
  font-family: var(--f-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

:host-context([dir="rtl"]) .profile-username {
  font-family: var(--f-arabic);
}

.role-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  font-family: var(--f-body);
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  width: fit-content;

  &.admin    { background: rgba(200, 147, 76, 0.18); color: var(--color-accent-hi); }
  &.moderator { background: rgba(200, 147, 76, 0.10); color: var(--color-accent); }
  &.user     { background: rgba(255, 255, 255, 0.06); color: var(--color-text-muted); }
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
  font-size: 11px;
  font-weight: 500;
  font-family: var(--f-body);
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  min-width: 80px;
}

:host-context([dir="rtl"]) .info-label {
  font-family: var(--f-arabic);
  letter-spacing: 0;
}

.info-value {
  font-size: 13px;
  font-family: var(--f-body);
  color: var(--color-text);
}

:host-context([dir="rtl"]) .info-value {
  font-family: var(--f-arabic);
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

.field-input {
  height: 42px;
  padding: 0 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 14px;
  font-family: var(--f-body);
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;

  &::placeholder { color: var(--color-text-subtle); }

  &:focus {
    border-color: var(--color-accent-border);
    box-shadow: 0 0 0 3px rgba(200, 147, 76, 0.10);
  }
}

:host-context([dir="rtl"]) .field-input {
  font-family: var(--f-arabic);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
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
    box-shadow: 0 4px 16px rgba(200, 147, 76, 0.32);
    transform: translateY(-1px);
  }
}

:host-context([dir="rtl"]) .btn-primary {
  font-family: var(--f-arabic);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/profile/profile.component.scss
git commit -m "style: apply Nocturne theme to profile page"
```

---

## Task 13: Users SCSS

**Files:**
- Modify: `src/app/features/users/users.component.scss`

- [ ] **Step 1: Replace the entire file**

```scss
.users-page {
  max-width: 900px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.page-title {
  font-family: var(--f-display);
  font-size: clamp(26px, 3vw, 34px);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.1;
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

:host-context([dir="rtl"]) .page-subtitle {
  font-family: var(--f-arabic);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  background: var(--gradient-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: #0c0a06;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--f-body);
  cursor: pointer;
  white-space: nowrap;
  transition: box-shadow 0.18s, transform 0.15s;

  &:hover {
    box-shadow: 0 4px 16px rgba(200, 147, 76, 0.32);
    transform: translateY(-1px);
  }
}

:host-context([dir="rtl"]) .btn-primary {
  font-family: var(--f-arabic);
}

.alert-error {
  background: rgba(224, 96, 96, 0.1);
  border: 1px solid rgba(224, 96, 96, 0.22);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 13px;
  font-family: var(--f-body);
  color: var(--color-danger);
  margin-bottom: 16px;
}

.loading-state {
  color: var(--color-text-muted);
  font-size: 13px;
  padding: 32px 0;
  text-align: center;
}

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
    font-family: var(--f-body);
    color: var(--color-text-subtle);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: start;
    border-bottom: 1px solid var(--color-border);
  }

  td {
    padding: 10px 16px;
    border-bottom: 1px solid var(--color-border);
    font-size: 13px;
    font-family: var(--f-body);
    color: var(--color-text);

    &:last-child {
      text-align: end;
      width: 48px;
    }
  }

  tr:hover td {
    background: rgba(200, 147, 76, 0.03);
  }

  tr:last-child td {
    border-bottom: none;
  }
}

:host-context([dir="rtl"]) .desktop-table th,
:host-context([dir="rtl"]) .desktop-table td {
  font-family: var(--f-arabic);
  letter-spacing: 0;
}

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
  color: #0c0a06;
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
  color: #0c0a06;
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
  font-family: var(--f-body);
  color: var(--color-text);
}

:host-context([dir="rtl"]) .user-name {
  font-family: var(--f-arabic);
}

.user-email {
  font-size: 12px;
  font-family: var(--f-body);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  font-family: var(--f-body);
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &.admin    { background: rgba(200, 147, 76, 0.18); color: var(--color-accent-hi); }
  &.moderator { background: rgba(200, 147, 76, 0.10); color: var(--color-accent); }
  &.user     { background: rgba(255, 255, 255, 0.06); color: var(--color-text-muted); }
}

.actions-cell {
  text-align: end;
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
  margin-inline-start: auto;

  &:hover {
    color: var(--color-danger);
    background: rgba(224, 96, 96, 0.1);
    border-color: rgba(224, 96, 96, 0.2);
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
  font-family: var(--f-body);
  cursor: pointer;
  transition: border-color 0.15s;

  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { border-color: var(--color-accent-border); }
}

.page-info {
  font-size: 13px;
  font-family: var(--f-body);
  color: var(--color-text-muted);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/users/users.component.scss
git commit -m "style: apply Nocturne theme to users page"
```

---

## Task 14: Create User Dialog SCSS

**Files:**
- Modify: `src/app/features/users/create-user-dialog/create-user-dialog.component.scss`

- [ ] **Step 1: Replace the entire file**

```scss
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
    max-width: 480px;
    border-radius: var(--radius-xl);
  }
}

@keyframes dialog-rise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dialog-header {
  display: flex;
  align-items: center;
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

.field-input {
  height: 42px;
  padding: 0 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 14px;
  font-family: var(--f-body);
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;

  &::placeholder { color: var(--color-text-subtle); }

  &:focus {
    border-color: var(--color-accent-border);
    box-shadow: 0 0 0 3px rgba(200, 147, 76, 0.10);
  }

  option {
    background: var(--color-card);
    color: var(--color-text);
  }
}

:host-context([dir="rtl"]) .field-input {
  font-family: var(--f-arabic);
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
    box-shadow: 0 4px 16px rgba(200, 147, 76, 0.32);
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

- [ ] **Step 2: Commit**

```bash
git add src/app/features/users/create-user-dialog/create-user-dialog.component.scss
git commit -m "style: apply Nocturne theme to create user dialog — glassmorphism card"
```

---

## Task 15: Change Password SCSS

**Files:**
- Modify: `src/app/features/change-password/change-password.component.scss`

- [ ] **Step 1: Replace the entire file**

```scss
.change-password-page {
  max-width: 440px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-family: var(--f-display);
  font-size: clamp(26px, 3vw, 34px);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.1;
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

:host-context([dir="rtl"]) .page-subtitle {
  font-family: var(--f-arabic);
}

.card {
  background: var(--color-card);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-xl);
  padding: 28px 24px;
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.22);
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

.field-input {
  height: 44px;
  padding: 0 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 14px;
  font-family: var(--f-body);
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;

  &::placeholder { color: var(--color-text-subtle); }

  &:focus {
    border-color: var(--color-accent-border);
    box-shadow: 0 0 0 3px rgba(200, 147, 76, 0.10);
  }
}

:host-context([dir="rtl"]) .field-input {
  font-family: var(--f-arabic);
}

.field-error {
  font-size: 12px;
  font-family: var(--f-body);
  color: var(--color-danger);
}

.alert-error {
  padding: 9px 12px;
  background: rgba(224, 96, 96, 0.1);
  border: 1px solid rgba(224, 96, 96, 0.22);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-family: var(--f-body);
  color: var(--color-danger);
}

:host-context([dir="rtl"]) .alert-error {
  font-family: var(--f-arabic);
}

.btn-primary {
  height: 46px;
  background: var(--gradient-accent);
  border: none;
  border-radius: var(--radius-sm);
  color: #0c0a06;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--f-body);
  cursor: pointer;
  margin-top: 4px;
  transition: box-shadow 0.18s, transform 0.15s;

  &:disabled { opacity: 0.55; cursor: not-allowed; }

  &:hover:not(:disabled) {
    box-shadow: 0 4px 18px rgba(200, 147, 76, 0.34);
    transform: translateY(-1px);
  }
}

:host-context([dir="rtl"]) .btn-primary {
  font-family: var(--f-arabic);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/change-password/change-password.component.scss
git commit -m "style: apply Nocturne theme to change password page"
```

---

## Task 16: Final Visual Verification

- [ ] **Step 1: Build and verify no SCSS errors**

```bash
cd ai-chat-frontend && npx ng build --configuration development 2>&1 | grep -E "(Error|Warning|Build at)"
```
Expected: Only `Build at:` line(s), no `Error:` lines.

- [ ] **Step 2: Start dev server and navigate to each route**

```bash
cd ai-chat-frontend && npx ng serve --port 4201 --open
```

Visit each route and confirm Nocturne theme is applied:
- `/login` — already done, unchanged
- `/dashboard` — Cormorant Garamond title, gold stat cards
- `/chat` — dark conv panel, gold active state, gold user bubbles
- `/profile` — gold avatar ring, display font username
- `/users` — gold role badges, gold "Create User" button
- `/change-password` — glassmorphism card, gold submit

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "style: complete Nocturne theme rollout across all components"
```
