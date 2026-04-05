import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Message } from '../models/chat.model';

interface ChatApiResponse {
  reply: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private http: HttpClient) {}

  /**
   * Sends a message to POST /api/chat/message backed by Spring AI → LM Studio.
   * Passes the full conversation history so the model has context.
   */
  sendMessage(
    conversationId: string,
    content: string,
    history: Pick<Message, 'role' | 'content'>[] = []
  ): Observable<string> {
    return this.http
      .post<ChatApiResponse>('/api/chat/message', { conversationId, content, history })
      .pipe(map(r => r.reply));
  }
}
