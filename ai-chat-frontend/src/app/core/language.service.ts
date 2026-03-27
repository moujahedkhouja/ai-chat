import { Injectable, signal, computed } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Lang = 'en' | 'ar';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly KEY = 'app_lang';
  readonly current = signal<Lang>(this.loadLang());

  readonly isArabic = computed(() => this.current() === 'ar');

  constructor(private translate: TranslateService) {}

  private loadLang(): Lang {
    return (localStorage.getItem(this.KEY) as Lang) ?? 'en';
  }

  apply(): void {
    const lang = this.current();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.translate.use(lang);
  }

  toggle(): void {
    const next: Lang = this.current() === 'en' ? 'ar' : 'en';
    localStorage.setItem(this.KEY, next);
    this.current.set(next);
    this.apply();
    window.location.reload();
  }
}
