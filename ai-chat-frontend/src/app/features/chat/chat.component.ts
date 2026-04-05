import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { ChatHistoryService } from '../../core/chat-history.service';
import { ChatService } from '../../core/chat.service';
import { Conversation } from '../../models/chat.model';
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
  private readonly authService = inject(AuthService);
  private readonly historyService = inject(ChatHistoryService);
  private readonly chatService = inject(ChatService);

  readonly username = computed(() => this.authService.username() ?? '');
  readonly conversations = this.historyService.conversations;
  readonly activeConversation = signal<Conversation | null>(null);
  readonly isTyping = signal(false);
  readonly showDrawer = signal(false);

  constructor() {
    // When username changes, load conversations
    effect(() => {
      const user = this.username();
      if (!user) return;
      this.historyService.loadConversations(user);
      const convs = this.conversations();
      if (convs.length > 0) {
        if (!this.activeConversation()) this.activeConversation.set(convs[0]);
      } else {
        this.startNewChat();
      }
    }, { allowSignalWrites: true });
  }

  startNewChat(): void {
    const user = this.username();
    if (!user) return;
    const conv = this.historyService.createConversation(user);
    this.activeConversation.set(conv);
    this.showDrawer.set(false);
  }

  selectConversation(id: string): void {
    const user = this.username();
    if (!user) return;
    this.activeConversation.set(this.historyService.getConversation(user, id) ?? null);
    this.showDrawer.set(false);
  }

  deleteConversation(id: string): void {
    const user = this.username();
    if (!user) return;
    const wasActive = this.activeConversation()?.id === id;
    this.historyService.deleteConversation(user, id);
    if (wasActive) {
      const current = this.conversations();
      this.activeConversation.set(current[0] ?? null);
      if (!this.activeConversation()) this.startNewChat();
    }
  }

  sendMessage(content: string): void {
    const user = this.username();
    const active = this.activeConversation();
    if (!user || !active || this.isTyping()) return;
    const convId = active.id;

    this.historyService.addMessage(user, convId, 'user', content);
    const updatedConv = this.historyService.getConversation(user, convId)!;
    this.activeConversation.set(updatedConv);
    this.isTyping.set(true);

    // Pass conversation history (excluding the system greeting) for context
    const history = updatedConv.messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }));

    this.chatService.sendMessage(convId, content, history).subscribe({
      next: reply => {
        this.historyService.addMessage(user, convId, 'assistant', reply);
        this.activeConversation.set(this.historyService.getConversation(user, convId)!);
        this.isTyping.set(false);
      },
      error: () => {
        this.historyService.addMessage(user, convId, 'assistant', '⚠️ The AI service is unavailable. Make sure LM Studio is running on port 1234.');
        this.activeConversation.set(this.historyService.getConversation(user, convId)!);
        this.isTyping.set(false);
      }
    });
  }
}
