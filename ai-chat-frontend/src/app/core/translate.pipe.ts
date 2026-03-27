import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from './language.service';
import { TRANSLATIONS, TranslationKey } from './translations';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  constructor(private lang: LanguageService) {}

  transform(key: TranslationKey): string {
    const entry = TRANSLATIONS[key];
    if (!entry) return key;
    return entry[this.lang.current] ?? entry['en'];
  }
}
