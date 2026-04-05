import { Component, input, computed, inject, AfterViewInit, ElementRef, NgZone, OnDestroy, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked, Renderer } from 'marked';
import hljs from 'highlight.js';
import { Message } from '../../../models/chat.model';
import { AuthService } from '../../../auth/auth.service';

// ── Custom marked renderer ────────────────────────────────────────────────────
// Built once and reused for every render call.
const renderer = new Renderer();

renderer.code = ({ text, lang }: { text: string; lang?: string }): string => {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(text, { language }).value;
  const label = language === 'plaintext' ? '' : language;
  return `
<div class="code-block">
  <div class="code-header">
    <span class="code-lang">${label}</span>
    <button class="code-copy" data-code="${encodeURIComponent(text)}" aria-label="Copy code">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      Copy
    </button>
  </div>
  <pre><code class="hljs language-${language}">${highlighted}</code></pre>
</div>`;
};

marked.use({ renderer });
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.scss'
})
export class MessageBubbleComponent implements AfterViewInit, OnDestroy {
  message = input.required<Message>();

  private authService = inject(AuthService);
  private sanitizer   = inject(DomSanitizer);
  private el          = inject(ElementRef);
  private zone        = inject(NgZone);

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

  // Re-bind copy buttons whenever the rendered HTML changes.
  private htmlEffect = effect(() => {
    // Touch the signal to subscribe; actual DOM wiring happens after render.
    this.renderedHtml();
    // setTimeout lets Angular finish writing innerHTML before we query the DOM.
    setTimeout(() => this.bindCopyButtons());
  });

  ngAfterViewInit(): void {
    this.bindCopyButtons();
  }

  ngOnDestroy(): void {
    this.htmlEffect.destroy();
  }

  private bindCopyButtons(): void {
    const host: HTMLElement = this.el.nativeElement;
    host.querySelectorAll<HTMLButtonElement>('button.code-copy').forEach(btn => {
      // Avoid attaching duplicate listeners.
      if (btn.dataset['bound']) return;
      btn.dataset['bound'] = '1';

      btn.addEventListener('click', () => {
        const code = decodeURIComponent(btn.dataset['code'] ?? '');
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = 'Copied!';
          btn.classList.add('code-copy--done');
          setTimeout(() => {
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
            btn.classList.remove('code-copy--done');
          }, 1800);
        });
      });
    });
  }
}
