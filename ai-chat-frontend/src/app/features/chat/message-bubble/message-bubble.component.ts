import { Component, Input, OnChanges, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { Message } from '../../../models/chat.model';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.scss'
})
export class MessageBubbleComponent implements OnChanges {
  @Input() message!: Message;

  renderedHtml: SafeHtml = '';
  private authService = inject(AuthService);

  constructor(private sanitizer: DomSanitizer) {}

  get userAvatar(): string | null {
    const user = this.authService.getCurrentUser();
    return this.authService.getAvatarUrl(user?.userId, user?.profilePicturePath);
  }

  get username(): string {
    return this.authService.getUsername() ?? 'User';
  }

  ngOnChanges(): void {
    if (this.message.role === 'assistant') {
      const html = String(marked.parse(this.message.content));
      this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(html);
    }
  }
}
