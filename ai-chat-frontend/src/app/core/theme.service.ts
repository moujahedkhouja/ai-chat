import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app_theme';
  private themeSubject = new BehaviorSubject<Theme>(this.loadTheme());

  readonly theme$ = this.themeSubject.asObservable();

  get isDark(): boolean {
    return this.themeSubject.value === 'dark';
  }

  private loadTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored === 'light' ? 'light' : 'dark';
  }

  apply(): void {
    const theme = this.themeSubject.value;
    document.documentElement.classList.remove('theme-dark', 'theme-light');
    document.documentElement.classList.add(`theme-${theme}`);
  }

  toggle(): void {
    const next: Theme = this.themeSubject.value === 'dark' ? 'light' : 'dark';
    this.themeSubject.next(next);
    localStorage.setItem(this.STORAGE_KEY, next);
    this.apply();
  }
}
