import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DatePipe } from '@angular/common';

import { routes } from './app.routes';
import { ErrorInterceptor } from './core/error.interceptor';

import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { tap } from 'rxjs/operators';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './locale/', '.json');
}

function appInitializer(translate: TranslateService) {
  return () => new Promise<void>(resolve => {
    translate.use('en').subscribe({
      next: () => {
        console.log('App Initializer: Translations loaded successfully.');
        resolve();
      },
      error: (err) => {
        console.error('Error loading translations in APP_INITIALIZER:', err);
        resolve(); // Resolve even on error to prevent app from crashing
      }
    });
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    DatePipe, // Add DatePipe here
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }).providers!,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializer,
      deps: [TranslateService],
      multi: true,
    },
  ]
};