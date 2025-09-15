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
  return new TranslateHttpLoader(http, '/locale/', '.json');
}

function appInitializer(translate: TranslateService) {
  return () => new Promise<void>(resolve => {
    let resolved = false;
    
    const resolveOnce = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
    
    try {
      translate.setDefaultLang('en');
      
      translate.use('en').subscribe({
        next: () => {
          resolveOnce();
        },
        error: () => {
          resolveOnce(); // Continue even if translations fail
        }
      });
      
      // Fallback timeout to ensure app never blocks
      setTimeout(() => {
        resolveOnce();
      }, 3000);
      
    } catch (error) {
      resolveOnce();
    }
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