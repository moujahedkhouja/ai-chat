import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { ChatHistoryService } from '../../core/chat-history.service';
import { ChatService } from '../../core/chat.service';
import { Conversation, Message } from '../../models/chat.model';
import { ConversationListComponent } from './conversation-list/conversation-list.component';
import { MessageThreadComponent } from './message-thread/message-thread.component';
import { ChatInputComponent } from './chat-input/chat-input.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ConversationListComponent, MessageThreadComponent, ChatInputComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  private readonly authService    = inject(AuthService);
  readonly historyService         = inject(ChatHistoryService);
  private readonly chatService    = inject(ChatService);

  readonly conversations          = this.historyService.conversations;
  readonly activeConversation     = signal<Conversation | null>(null);
  readonly isTyping               = signal(false);
  readonly showDrawer             = signal(false);

  constructor() {
    // Load conversations once the user is known, then auto-select or create.
    // We do this imperatively (HTTP subscribe) rather than with a nested effect
    // to avoid the race where the conversations signal updates before
    // activeConversation is set, causing a duplicate load.
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) return;

      this.historyService.listConversations().subscribe({
        next: list => {
          if (list.length > 0) {
            this._loadConversation(list[0].id);
          } else {
            this.startNewChat();
          }
        }
      });
    }, { allowSignalWrites: true });
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  startNewChat(): void {
    this.historyService.createConversation().subscribe({
      next: conv => {
        this.activeConversation.set(conv);
        this.showDrawer.set(false);
      }
    });
  }

  selectConversation(id: string): void {
    this._loadConversation(id);
    this.showDrawer.set(false);
  }

  deleteConversation(id: string): void {
    const wasActive = this.activeConversation()?.id === id;
    this.historyService.deleteConversation(id).subscribe({
      next: () => {
        if (!wasActive) return;
        const remaining = this.conversations();
        if (remaining.length > 0) {
          this._loadConversation(remaining[0].id);
        } else {
          this.startNewChat();
        }
      }
    });
  }

  sendMessage(content: string): void {
    const active = this.activeConversation();
    if (!active || this.isTyping()) return;

    const convId = active.id;

    // Optimistically append the user message locally so the UI is instant
    const optimisticMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    };
    this.activeConversation.set({
      ...active,
      messages: [...active.messages, optimisticMsg]
    });
    this.isTyping.set(true);

    // Build history for AI context (all messages including the one just appended)
    const history = this.activeConversation()!.messages
      .map(m => ({ role: m.role, content: m.content }));

    this.chatService.sendMessage(convId, content, history).subscribe({
      next: () => {
        // Reload the full conversation from the server to get authoritative
        // IDs, timestamps, and the persisted assistant reply
        this._loadConversation(convId);
        this.isTyping.set(false);
      },
      error: () => {
        // Server already persisted the error message — reload to show it
        this._loadConversation(convId);
        this.isTyping.set(false);
      }
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _loadConversation(id: string): void {
    this.historyService.getConversation(id).subscribe({
      next: conv => {
        this.activeConversation.set(conv);
        // Keep the summary list title / updatedAt in sync
        this.historyService.refreshSummary(conv.id, conv.title, conv.updatedAt);
      }
    });
  }
}
