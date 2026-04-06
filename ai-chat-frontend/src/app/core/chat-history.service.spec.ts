import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ChatHistoryService, ConversationSummary } from './chat-history.service';
import { Conversation } from '../models/chat.model';

const mockSummary: ConversationSummary = {
  id: 'conv-1',
  title: 'New Chat',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z'
};

const mockConversation: Conversation = {
  id: 'conv-1',
  title: 'New Chat',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
  messages: [{
    id: 'msg-1',
    role: 'assistant',
    content: "Hello! I'm your AI assistant. How can I help you today?",
    createdAt: '2024-01-01T10:00:00Z'
  }]
};

describe('ChatHistoryService', () => {
  let service: ChatHistoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        ChatHistoryService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ChatHistoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loadConversations() calls GET /api/chat/conversations and updates signal', () => {
    service.loadConversations();
    const req = httpMock.expectOne('/api/chat/conversations');
    expect(req.request.method).toBe('GET');
    req.flush([mockSummary]);
    expect(service.conversations()).toEqual([mockSummary]);
  });

  it('loadConversations() sets empty array on error', () => {
    service.loadConversations();
    const req = httpMock.expectOne('/api/chat/conversations');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    expect(service.conversations()).toEqual([]);
  });

  it('getConversation() calls GET /api/chat/conversations/{id}', () => {
    service.getConversation('conv-1').subscribe(conv => {
      expect(conv).toEqual(mockConversation);
    });
    const req = httpMock.expectOne('/api/chat/conversations/conv-1');
    expect(req.request.method).toBe('GET');
    req.flush(mockConversation);
  });

  it('createConversation() calls POST and prepends to conversations signal', () => {
    service.createConversation().subscribe(conv => {
      expect(conv).toEqual(mockConversation);
    });
    const req = httpMock.expectOne('/api/chat/conversations');
    expect(req.request.method).toBe('POST');
    req.flush(mockConversation);
    expect(service.conversations()[0].id).toBe('conv-1');
  });

  it('deleteConversation() calls DELETE and removes from conversations signal', () => {
    service.conversations.set([mockSummary]);
    service.deleteConversation('conv-1').subscribe();
    const req = httpMock.expectOne('/api/chat/conversations/conv-1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(service.conversations().length).toBe(0);
  });

  it('refreshSummary() updates title and re-sorts conversations', () => {
    const older: ConversationSummary = { id: 'conv-2', title: 'Old', createdAt: '2024-01-01T09:00:00Z', updatedAt: '2024-01-01T09:00:00Z' };
    service.conversations.set([mockSummary, older]);
    service.refreshSummary('conv-2', 'Updated', '2024-01-01T12:00:00Z');
    expect(service.conversations()[0].id).toBe('conv-2'); // now newest
    expect(service.conversations()[0].title).toBe('Updated');
  });

  it('constructor clears legacy localStorage keys', () => {
    localStorage.setItem('chat_history_alice', '[]');
    localStorage.setItem('chat_history_bob', '[]');
    localStorage.setItem('other_key', 'keep');
    // Re-create service to trigger constructor
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ChatHistoryService, provideHttpClient(), provideHttpClientTesting()]
    });
    TestBed.inject(ChatHistoryService);
    expect(localStorage.getItem('chat_history_alice')).toBeNull();
    expect(localStorage.getItem('chat_history_bob')).toBeNull();
    expect(localStorage.getItem('other_key')).toBe('keep');
  });
});
