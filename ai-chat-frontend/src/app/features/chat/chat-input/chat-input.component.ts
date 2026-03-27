import { Component, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss'
})
export class ChatInputComponent {
  @ViewChild('textarea') textareaRef!: ElementRef<HTMLTextAreaElement>;
  @Output() send = new EventEmitter<string>();

  value = '';

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }

  onInput(): void {
    const el = this.textareaRef.nativeElement;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  submit(): void {
    const trimmed = this.value.trim();
    if (!trimmed) return;
    this.send.emit(trimmed);
    this.value = '';
    // Reset textarea height on next tick
    setTimeout(() => {
      if (this.textareaRef?.nativeElement) {
        this.textareaRef.nativeElement.style.height = 'auto';
      }
    });
  }
}
