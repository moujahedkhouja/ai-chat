import { Component, OnInit, signal, computed, effect } from '@angular/core';
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
export class ChatComponent implements OnInit {
  readonly conversations = this.historyService.conversations;
  readonly activeConversation = signal<Conversation | null>(null);
  readonly isTyping = signal(false);
  readonly showDrawer = signal(false);

  readonly username = computed(() => this.authService.username() ?? '');

  constructor(
    private authService: AuthService,
    private historyService: ChatHistoryService,
    private chatService: ChatService
  ) {
    // When username changes, load conversations
    effect(() => {
      const user = this.username();
      if (user) {
        this.historyService.loadConversations(user);
        const current = this.conversations();
        if (current.length > 0 && !this.activeConversation()) {
          this.activeConversation.set(current[0]);
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    const user = this.username();
    if (user) {
      this.historyService.loadConversations(user);
      const convs = this.conversations();
      if (convs.length > 0) {
        this.activeConversation.set(convs[0]);
      } else {
        this.startNewChat();
      }
    }
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
    this.activeConversation.set(this.historyService.getConversation(user, convId)!);
    this.isTyping.set(true);

    this.chatService.sendMessage(convId, content).subscribe(reply => {
      this.historyService.addMessage(user, convId, 'assistant', reply);
      this.activeConversation.set(this.historyService.getConversation(user, convId)!);
      this.isTyping.set(false);
    });
  }
}
