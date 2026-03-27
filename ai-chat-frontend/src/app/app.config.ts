import { ApplicationConfig, provideZoneChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { switchMap } from 'rxjs/operators';

import { routes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';
import { AuthService } from './auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService(),
    ...provideTranslateHttpLoader(),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.loadCurrentUser();
    }),
    provideAppInitializer(() => {
      const translate = inject(TranslateService);
      const lang = (localStorage.getItem('app_lang') ?? 'en') as 'en' | 'ar';
      translate.addLangs(['en', 'ar']);
      // setDefaultLang returns an Observable in v17 – we must wait for it.
      return translate.setFallbackLang('en').pipe(
        switchMap(() => translate.use(lang))
      );
    })
  ]
};
