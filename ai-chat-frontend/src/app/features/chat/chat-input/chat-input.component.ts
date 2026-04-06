import { Component, output, ViewChild, ElementRef, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { LanguageService } from '../../../core/language.service';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss'
})
export class ChatInputComponent {
  @ViewChild('textarea') textareaRef?: ElementRef<HTMLTextAreaElement>;
  send = output<string>();
  private sanitizer = inject(DomSanitizer);
  private langService = inject(LanguageService);

  readonly isArabic = this.langService.isArabic;
  readonly textDir   = computed(() => this.isArabic() ? 'rtl' : 'ltr');

  value = signal('');
  richMode = signal(true);
  previewMode = signal(false);
  isFocused = signal(false);

  previewHtml = computed<SafeHtml>(() => {
    const html = String(marked.parse(this.value() || ''));
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  onKeydown(event: KeyboardEvent): void {
    if (this.previewMode()) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }

  onInput(): void {
    const el = this.textareaRef?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  submit(): void {
    const trimmed = this.value().trim();
    if (!trimmed) return;
    this.send.emit(trimmed);
    this.value.set('');
    this.previewMode.set(false);
    // Reset textarea height on next tick
    setTimeout(() => {
      const el = this.getTextarea();
      if (el) el.style.height = 'auto';
    });
  }

  togglePreview(): void {
    this.previewMode.set(!this.previewMode());
  }

  toggleInputMode(): void {
    this.richMode.set(!this.richMode());
    if (!this.richMode()) {
      this.previewMode.set(false);
    }
  }

  applyFormat(type: 'bold' | 'italic' | 'code' | 'quote' | 'link' | 'ul' | 'h2'): void {
    if (!this.richMode()) return;
    if (this.previewMode()) return;
    const textarea = this.getTextarea();
    if (!textarea) return;
    textarea.focus();

    switch (type) {
      case 'bold':
        this.wrapSelection('**', '**', 'bold text');
        break;
      case 'italic':
        this.wrapSelection('*', '*', 'italic text');
        break;
      case 'code':
        this.wrapSelection('`', '`', 'code');
        break;
      case 'quote':
        this.prefixLines('> ');
        break;
      case 'link':
        this.wrapSelection('[', '](https://example.com)', 'link text');
        break;
      case 'ul':
        this.prefixLines('- ');
        break;
      case 'h2':
        this.prefixLines('## ');
        break;
    }
    this.onInput();
  }

  private wrapSelection(prefix: string, suffix: string, placeholder: string): void {
    const textarea = this.getTextarea();
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.value();
    const selected = text.slice(start, end) || placeholder;
    const next = `${text.slice(0, start)}${prefix}${selected}${suffix}${text.slice(end)}`;
    this.value.set(next);

    const cursorStart = start + prefix.length;
    const cursorEnd = cursorStart + selected.length;
    setTimeout(() => textarea.setSelectionRange(cursorStart, cursorEnd));
  }

  private prefixLines(prefix: string): void {
    const textarea = this.getTextarea();
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.value();
    const before = text.slice(0, start);
    const selected = text.slice(start, end) || 'text';
    const after = text.slice(end);
    const lines = selected.split('\n').map((line) => `${prefix}${line}`).join('\n');
    this.value.set(`${before}${lines}${after}`);
    const nextPos = before.length + lines.length;
    setTimeout(() => textarea.setSelectionRange(nextPos, nextPos));
  }

  private getTextarea(): HTMLTextAreaElement | null {
    return this.textareaRef?.nativeElement ?? null;
  }
}
