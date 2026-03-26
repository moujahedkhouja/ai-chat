import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatService {
  /**
   * Stub: returns a placeholder reply after 1.5 s.
   * Replace the body of this method with an HTTP call when the backend is ready:
   *   return this.http.post<{reply: string}>('/api/chat/message', { conversationId, content })
   *     .pipe(map(r => r.reply));
   */
  sendMessage(conversationId: string, content: string): Observable<string> {
    const preview = content.length > 50 ? content.slice(0, 50) + '...' : content;
    const reply = `This is a placeholder response to: *"${preview}"*\n\nThe AI backend is not yet connected. Once integrated, real responses will appear here.`;
    return of(reply).pipe(delay(1500));
  }
}
