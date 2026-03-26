import { TestBed } from '@angular/core/testing';
import { ChatHistoryService } from './chat-history.service';

describe('ChatHistoryService', () => {
  let service: ChatHistoryService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatHistoryService);
  });

  it('returns empty array for a new user', () => {
    expect(service.getConversations('alice')).toEqual([]);
  });

  it('createConversation() creates a conversation with a welcome message', () => {
    const conv = service.createConversation('alice');
    expect(conv.title).toBe('New Chat');
    expect(conv.messages.length).toBe(1);
    expect(conv.messages[0].role).toBe('assistant');
    expect(conv.id).toBeTruthy();
  });

  it('createConversation() persists to localStorage', () => {
    service.createConversation('alice');
    expect(service.getConversations('alice').length).toBe(1);
  });

  it('addMessage() appends a message and derives title from first user message', () => {
    const conv = service.createConversation('alice');
    service.addMessage('alice', conv.id, 'user', 'Write me a poem');
    const updated = service.getConversation('alice', conv.id)!;
    expect(updated.messages.length).toBe(2);
    expect(updated.title).toBe('Write me a poem');
  });

  it('addMessage() truncates title at 40 chars', () => {
    const conv = service.createConversation('alice');
    service.addMessage('alice', conv.id, 'user', 'A'.repeat(50));
    const updated = service.getConversation('alice', conv.id)!;
    expect(updated.title).toBe('A'.repeat(40) + '...');
  });

  it('addMessage() does not override title if already set', () => {
    const conv = service.createConversation('alice');
    service.addMessage('alice', conv.id, 'user', 'First message');
    service.addMessage('alice', conv.id, 'user', 'Second message');
    const updated = service.getConversation('alice', conv.id)!;
    expect(updated.title).toBe('First message');
  });

  it('deleteConversation() removes conversation by id', () => {
    const conv = service.createConversation('alice');
    service.deleteConversation('alice', conv.id);
    expect(service.getConversations('alice').length).toBe(0);
  });

  it('getConversations() returns results sorted by updatedAt descending', () => {
    const c1 = service.createConversation('alice');
    const c2 = service.createConversation('alice');
    const list = service.getConversations('alice');
    expect(list[0].id).toBe(c2.id); // newest first
  });
});
