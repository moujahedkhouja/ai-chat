import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Conversation } from '../models/chat.model';

/** Shape returned by GET /api/chat/conversations (summary — no messages). */
export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChatHistoryService {

  /** Reactive list of conversation summaries, ordered by updatedAt desc. */
  readonly conversations = signal<ConversationSummary[]>([]);

  constructor(private http: HttpClient) {
    // Discard any legacy localStorage data from the old implementation
    Object.keys(localStorage)
      .filter(k => k.startsWith('chat_history_'))
      .forEach(k => localStorage.removeItem(k));
  }

  // ── Load list ──────────────────────────────────────────────────────────────

  loadConversations(): void {
    this.http.get<ConversationSummary[]>('/api/chat/conversations').subscribe({
      next: list => this.conversations.set(list),
      error: () => this.conversations.set([])
    });
  }

  // ── Get detail (with messages) ─────────────────────────────────────────────

  getConversation(id: string): Observable<Conversation> {
    return this.http.get<Conversation>(`/api/chat/conversations/${id}`);
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  createConversation(): Observable<Conversation> {
    return this.http.post<Conversation>('/api/chat/conversations', {}).pipe(
      tap(conv => {
        const summary: ConversationSummary = {
          id: conv.id, title: conv.title,
          createdAt: conv.createdAt, updatedAt: conv.updatedAt
        };
        this.conversations.update(list => [summary, ...list]);
      })
    );
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  deleteConversation(id: string): Observable<void> {
    return this.http.delete<void>(`/api/chat/conversations/${id}`).pipe(
      tap(() => this.conversations.update(list => list.filter(c => c.id !== id)))
    );
  }

  // ── Refresh summary after a message is sent ────────────────────────────────
  // Called by ChatComponent to keep the title / updatedAt in the list current.

  refreshSummary(id: string, title: string, updatedAt: string): void {
    this.conversations.update(list =>
      list
        .map(c => c.id === id ? { ...c, title, updatedAt } : c)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
  }
}
