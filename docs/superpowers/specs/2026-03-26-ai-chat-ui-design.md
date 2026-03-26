# AI Chat UI — Design Spec
**Date:** 2026-03-26
**Scope:** Frontend only (Angular 21). Backend chat API is out of scope — a stub service is used.

---

## Overview

Add an AI Chat page to the existing Angular frontend. Users can create conversations, send messages, and see AI responses. All conversation history is persisted in `localStorage` keyed per user. A light/dark theme toggle is added app-wide with the **Indigo + Warm Cream** palette.

---

## 1. Chat Page — Layout & Navigation

**Route:** `/chat` — added as a child of `ShellComponent` (protected by `authGuard` and `forcePasswordChangeGuard`).

The chat page uses a **two-panel layout**:

- **Left panel (220px, fixed):** Conversation list with search bar, "New Chat" button, and conversations grouped by date (Today, Yesterday, Older). Each item shows title + message preview. Active conversation is highlighted with the indigo accent.
- **Right panel (flex-grow):** Active chat view with message thread, auto-expanding input textarea, and send button.

On **mobile** (< 768px): the conversation list becomes a slide-in drawer triggered by a hamburger button in the top bar. The chat takes full width.

A **Chat** nav icon is added to the existing `SidebarComponent` and `BottomTabBarComponent`.

---

## 2. Chat Messages

Each message in the thread has:
- **Role:** `user` or `assistant`
- **User messages:** right-aligned bubble with indigo gradient background.
- **Assistant messages:** left-aligned bubble with surface background, AI avatar (indigo gradient square with "A").
- **Markdown rendering:** using the `marked` library (already in many Angular projects — we add it). Supports bold, italic, lists, inline code, fenced code blocks with language label.
- **Typing indicator:** three animated dots shown while awaiting a response.
- **Timestamps:** shown on hover per message.

---

## 3. Conversation History — Data Model

Stored in `localStorage` under key `chat_history_{username}`.

```ts
interface Conversation {
  id: string;           // uuid
  title: string;        // first user message, truncated to 40 chars
  createdAt: string;    // ISO timestamp
  updatedAt: string;
  messages: Message[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;      // raw markdown string
  timestamp: string;
}
```

Operations:
- **Create** — new `Conversation` with a welcome assistant message.
- **Append message** — push to `messages[]`, update `updatedAt`, derive title from first user message.
- **Delete** — remove by `id`, switch to next conversation or create new.
- **List** — sorted by `updatedAt` descending, grouped by date.

---

## 4. Chat Service (Stub)

`ChatService` exposes:

```ts
sendMessage(conversationId: string, content: string): Observable<string>
```

The stub implementation returns a simulated streaming response after a 1–2 second delay using `of(mockReply).pipe(delay(1500))`. The mock reply is a contextual placeholder string.

The service interface is designed so the real API call (POST `/api/chat/message`) can replace the stub with no changes to consumers.

---

## 5. Light / Dark Theming

**ThemeService** manages the active theme and persists it to `localStorage` under `app_theme`.

Two CSS class sets applied to `<html>`:
- `.theme-dark` — existing Dark Pro tokens (no change to current values)
- `.theme-light` — new Indigo + Warm Cream tokens:

| Token | Dark value | Light value |
|---|---|---|
| `--color-bg` | `#0f1117` | `#faf9f7` |
| `--color-surface` | `#13151f` | `#ffffff` |
| `--color-card` | `#1a1d27` | `#ffffff` |
| `--color-border` | `#1e2235` | `#e8e6e0` |
| `--color-text` | `#e2e8f0` | `#1e1b4b` |
| `--color-text-muted` | `#64748b` | `#64748b` |
| `--color-text-subtle` | `#475569` | `#94a3b8` |
| `--color-accent` | `#6366f1` | `#6366f1` |
| `--color-accent-muted` | `rgba(99,102,241,0.15)` | `#eef2ff` |
| `--color-accent-border` | `rgba(99,102,241,0.3)` | `#c7d2fe` |

Accent (`#6366f1` / `#8b5cf6` gradient) is identical in both themes.

**Toggle:** A sun/moon icon button at the bottom of `SidebarComponent`. On mobile, placed in the top bar.

All existing pages (login, dashboard, profile, users, change-password) use only the existing CSS variables — they will adapt automatically when light tokens are applied.

---

## 6. Component Structure

```
features/
  chat/
    chat.component.ts          # page host, manages active conversation
    chat.component.html
    chat.component.scss
    conversation-list/
      conversation-list.component.ts
      conversation-list.component.html
      conversation-list.component.scss
    message-thread/
      message-thread.component.ts
      message-thread.component.html
      message-thread.component.scss
    message-bubble/
      message-bubble.component.ts   # renders single message with markdown
      message-bubble.component.html
      message-bubble.component.scss
    chat-input/
      chat-input.component.ts       # auto-expanding textarea, send on Enter
      chat-input.component.html
      chat-input.component.scss
core/
  chat-history.service.ts      # localStorage CRUD for conversations
  chat.service.ts              # stub API service
  theme.service.ts             # light/dark toggle + persistence
```

---

## 7. Routing Update

```ts
{ path: 'chat', loadComponent: () => import('./features/chat/chat.component')
    .then(m => m.ChatComponent), canActivate: [forcePasswordChangeGuard] }
```

Default redirect stays at `dashboard`. The sidebar Chat icon links to `/chat`.

---

## 8. Dependencies

- **`marked`** — markdown-to-HTML parser. Added via `npm install marked`.
- **`DomSanitizer`** — used with `bypassSecurityTrustHtml` to render parsed markdown safely (assistant messages only; user input is never rendered as HTML).

No UI component library. All UI is custom CSS using the existing design token system.

---

## 9. Out of Scope

- Backend chat API implementation (stub only)
- Real-time streaming responses (simulated with delay)
- File/image attachments
- Message editing or regeneration
- User registration / password reset
