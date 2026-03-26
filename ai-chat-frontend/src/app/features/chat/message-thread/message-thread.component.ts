import {
  Component, Input, OnChanges, AfterViewChecked,
  ViewChild, ElementRef
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
export class MessageThreadComponent implements OnChanges, AfterViewChecked {
  @Input() messages: Message[] = [];
  @Input() isTyping = false;
  @ViewChild('bottom') bottomRef!: ElementRef<HTMLDivElement>;

  private shouldScroll = false;

  ngOnChanges(): void {
    this.shouldScroll = true;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.bottomRef) {
      this.bottomRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }
}
