import {
  Component, AfterViewChecked,
  ViewChild, ElementRef, input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../../models/chat.model';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

@Component({
  selector: 'app-message-thread',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent],
  templateUrl: './message-thread.component.html',
  styleUrl: './message-thread.component.scss'
})
export class MessageThreadComponent implements AfterViewChecked {
  messages = input<Message[]>([]);
  isTyping = input(false);
  @ViewChild('bottom') bottomRef!: ElementRef<HTMLDivElement>;

  private shouldScroll = false;

  constructor() {
    // In Angular version 21+ (and 17.2+), we can use effect to watch signals
    // But since we want to scroll after the view is updated, AfterViewChecked is still relevant
    // or we can use a watcher that sets the flag.
  }

  // We still use OnChanges logic but since it's a signal input,
  // we can use a setter or just keep the logic that triggers scrolling.
  // Actually, we can just check if messages length changed in AfterViewChecked or similar.

  // Let's use a simple approach: whenever the signal input changes, set the flag.
  // We can do this with a computed or just by watching it in ngAfterViewChecked if we compare lengths,
  // but better is to use the effect to set the flag.

  // Wait, I'll just use the fact that it's a signal input.

  private lastCount = 0;

  ngAfterViewChecked(): void {
    if (this.messages().length !== this.lastCount || this.isTyping()) {
      this.lastCount = this.messages().length;
      if (this.bottomRef) {
        this.bottomRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}
