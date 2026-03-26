import { Injectable, RendererFactory2, Renderer2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private renderer: Renderer2;
  private themeSubject = new BehaviorSubject<Theme>(this.loadTheme());

  readonly theme$ = this.themeSubject.asObservable();

  constructor(factory: RendererFactory2) {
    this.renderer = factory.createRenderer(null, null);
  }

  get isDark(): boolean {
    return this.themeSubject.value === 'dark';
  }

  get current(): Theme {
    return this.themeSubject.value;
  }

  private loadTheme(): Theme {
    const stored = localStorage.getItem('theme');
    return stored === 'light' ? 'light' : 'dark';
  }

  apply(): void {
    const theme = this.themeSubject.value;
    this.renderer.removeClass(document.documentElement, 'theme-dark');
    this.renderer.removeClass(document.documentElement, 'theme-light');
    this.renderer.addClass(document.documentElement, `theme-${theme}`);
    this.renderer.setAttribute(document.documentElement, 'data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  toggle(): void {
    const next: Theme = this.themeSubject.value === 'dark' ? 'light' : 'dark';
    this.themeSubject.next(next);
    this.apply();
  }
}
