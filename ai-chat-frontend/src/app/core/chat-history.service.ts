import { Injectable, signal } from '@angular/core';
import { Conversation, Message } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatHistoryService {
  private readonly PREFIX = 'chat_history_';
  readonly conversations = signal<Conversation[]>([]);

  private key(username: string): string {
    return `${this.PREFIX}${username}`;
  }

  loadConversations(username: string): void {
    const raw = localStorage.getItem(this.key(username));
    const list: Conversation[] = raw ? JSON.parse(raw) : [];
    const sorted = list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    this.conversations.set(sorted);
  }

  getConversations(username: string): Conversation[] {
    this.loadConversations(username);
    return this.conversations();
  }

  getConversation(username: string, id: string): Conversation | undefined {
    return this.getConversations(username).find(c => c.id === id);
  }

  createConversation(username: string): Conversation {
    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      createdAt: now,
      updatedAt: now,
      messages: [{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: now
      }]
    };
    const all = [conversation, ...this.conversations()];
    this.save(username, all);
    return conversation;
  }

  addMessage(
    username: string,
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Message {
    const all = [...this.conversations()];
    const conv = all.find(c => c.id === conversationId);
    if (!conv) throw new Error(`Conversation not found: ${conversationId}`);

    const message: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString()
    };
    conv.messages = [...conv.messages, message];
    conv.updatedAt = message.timestamp;

    if (role === 'user' && conv.title === 'New Chat') {
      conv.title = content.length > 40 ? content.slice(0, 40) + '...' : content;
    }

    this.save(username, all);
    return message;
  }

  deleteConversation(username: string, id: string): void {
    const filtered = this.conversations().filter(c => c.id !== id);
    this.save(username, filtered);
  }

  private save(username: string, conversations: Conversation[]): void {
    localStorage.setItem(this.key(username), JSON.stringify(conversations));
    this.conversations.set(conversations);
  }
}
