import { Component, Input, OnChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { Message } from '../../../models/chat.model';

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

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    if (this.message.role === 'assistant') {
      const html = String(marked.parse(this.message.content));
      this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(html);
    }
  }
}
