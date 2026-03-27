import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app_theme';
  readonly theme = signal<Theme>(this.loadTheme());

  readonly isDark = computed(() => this.theme() === 'dark');

  private loadTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored === 'light' ? 'light' : 'dark';
  }

  apply(): void {
    const theme = this.theme();
    document.documentElement.classList.remove('theme-dark', 'theme-light');
    document.documentElement.classList.add(`theme-${theme}`);
  }

  toggle(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem(this.STORAGE_KEY, next);
    this.apply();
  }
}
