import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Lang = 'en' | 'ar';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly KEY = 'app_lang';

  constructor(private translate: TranslateService) {}

  get current(): Lang {
    return (localStorage.getItem(this.KEY) as Lang) ?? 'en';
  }

  get isArabic(): boolean {
    return this.current === 'ar';
  }

  apply(): void {
    const lang = this.current;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.translate.use(lang);
  }

  toggle(): void {
    const next: Lang = this.current === 'en' ? 'ar' : 'en';
    localStorage.setItem(this.KEY, next);
    this.apply();
    window.location.reload();
  }
}
