import { Injectable, RendererFactory2, Renderer2 } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private renderer: Renderer2;
  current: Theme = 'dark';

  constructor(factory: RendererFactory2) {
    this.renderer = factory.createRenderer(null, null);
    const saved = localStorage.getItem('theme') as Theme;
    this.apply(saved === 'light' ? 'light' : 'dark');
  }

  toggle(): void {
    this.apply(this.current === 'dark' ? 'light' : 'dark');
  }

  get isDark(): boolean {
    return this.current === 'dark';
  }

  private apply(theme: Theme): void {
    this.current = theme;
    this.renderer.setAttribute(document.documentElement, 'data-theme', theme);
    localStorage.setItem('theme', theme);
  }
}
