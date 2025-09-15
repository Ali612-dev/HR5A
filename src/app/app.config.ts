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
    console.log('🌐 App Initializer: Starting translation setup...');
    console.log('🔗 Translation loader path: /locale/*.json');
    
    let resolved = false;
    
    const resolveOnce = (reason: string) => {
      if (!resolved) {
        resolved = true;
        console.log(`✅ App Initializer: ${reason}`);
        resolve();
      }
    };
    
    try {
      translate.setDefaultLang('en');
      
      // Test if translation files are accessible
      console.log('🔍 Testing translation file accessibility...');
      
      translate.use('en').subscribe({
        next: (translations) => {
          console.log('📄 Translations loaded:', Object.keys(translations).slice(0, 5));
          resolveOnce('Translations loaded successfully');
        },
        error: (err) => {
          console.error('❌ Translation loading error:', err);
          console.error('📍 Error details:', {
            message: err.message,
            status: err.status,
            url: err.url
          });
          resolveOnce('Translation loading failed, proceeding without translations');
        }
      });
      
      // Optimized timeout - translations do load, just need a bit more time
      setTimeout(() => {
        console.warn('⏰ App Initializer: Translation loading timeout (3s), proceeding with fallbacks');
        resolveOnce('Translation loading timeout - using fallbacks');
      }, 3000);
      
    } catch (error) {
      console.error('🚨 App Initializer: Critical error in translation setup:', error);
      resolveOnce('Critical error in translation setup');
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