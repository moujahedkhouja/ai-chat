import { Component, input, computed, inject } from '@angular/core';
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
export class MessageBubbleComponent {
  message = input.required<Message>();

  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  readonly renderedHtml = computed<SafeHtml>(() => {
    const html = String(marked.parse(this.message().content));
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  readonly userAvatar = computed(() => {
    const user = this.authService.currentUser();
    return this.authService.getAvatarUrl(user?.userId, user?.hasAvatar);
  });

  readonly username = computed(() => {
    return this.authService.currentUser()?.username ?? 'User';
  });
}
