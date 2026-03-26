import { Component, OnInit } from '@angular/core';
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
  conversations: Conversation[] = [];
  activeConversation: Conversation | null = null;
  isTyping = false;
  showDrawer = false;

  private username = '';

  constructor(
    private authService: AuthService,
    private historyService: ChatHistoryService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername() ?? '';
    this.conversations = this.historyService.getConversations(this.username);
    if (this.conversations.length > 0) {
      this.activeConversation = this.conversations[0];
    } else {
      this.startNewChat();
    }
  }

  startNewChat(): void {
    const conv = this.historyService.createConversation(this.username);
    this.conversations = this.historyService.getConversations(this.username);
    this.activeConversation = conv;
    this.showDrawer = false;
  }

  selectConversation(id: string): void {
    this.activeConversation = this.historyService.getConversation(this.username, id) ?? null;
    this.showDrawer = false;
  }

  deleteConversation(id: string): void {
    const wasActive = this.activeConversation?.id === id;
    this.historyService.deleteConversation(this.username, id);
    this.conversations = this.historyService.getConversations(this.username);
    if (wasActive) {
      this.activeConversation = this.conversations[0] ?? null;
      if (!this.activeConversation) this.startNewChat();
    }
  }

  sendMessage(content: string): void {
    if (!this.activeConversation || this.isTyping) return;
    const convId = this.activeConversation.id;

    this.historyService.addMessage(this.username, convId, 'user', content);
    this.activeConversation = this.historyService.getConversation(this.username, convId)!;
    this.conversations = this.historyService.getConversations(this.username);
    this.isTyping = true;

    this.chatService.sendMessage(convId, content).subscribe(reply => {
      this.historyService.addMessage(this.username, convId, 'assistant', reply);
      this.activeConversation = this.historyService.getConversation(this.username, convId)!;
      this.conversations = this.historyService.getConversations(this.username);
      this.isTyping = false;
    });
  }
}
