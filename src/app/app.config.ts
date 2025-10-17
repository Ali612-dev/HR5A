import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { routes } from './app.routes';
import { ErrorInterceptor } from './core/error.interceptor';
import { AuthInterceptor } from './core/auth.interceptor';

import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { tap } from 'rxjs/operators';
import { LanguageService } from './shared/services/language.service';

export function HttpLoaderFactory(http: HttpClient) {
  console.log('🌐 HttpLoaderFactory: Creating translation loader for /locale/');
  return new TranslateHttpLoader(http, '/locale/', '.json');
}

function appInitializer(languageService: LanguageService, translate: TranslateService) {
  return () => new Promise<void>(resolve => {
    let resolved = false;
    
    const resolveOnce = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
    
    try {
      console.log('🌐 App Initializer: Starting language initialization...');
      
      // Initialize language service (sets default and restores saved language)
      languageService.initializeLanguage();
      
      // Get the language that was set by the language service
      const currentLanguage = languageService.getCurrentLanguage();
      console.log('🌐 App Initializer: Current language after initialization:', currentLanguage);
      
      // Double-check what's in localStorage
      if (typeof localStorage !== 'undefined') {
        const storedLang = localStorage.getItem('selectedLanguage');
        console.log('🌐 App Initializer: Direct localStorage check:', storedLang);
      }
      
      translate.use(currentLanguage).subscribe({
        next: () => {
          console.log('🌐 App Initializer: TranslateService successfully loaded language:', currentLanguage);
          console.log('🌐 App Initializer: Final current language:', translate.currentLang);
          resolveOnce();
        },
        error: (err) => {
          console.error('🌐 App Initializer: TranslateService error:', err);
          console.error('🌐 App Initializer: Error details:', err);
          
          // If there's an error loading the language, fallback to English
          if (currentLanguage !== 'en') {
            console.log('🌐 App Initializer: Falling back to English due to error');
            translate.use('en').subscribe({
              next: () => {
                console.log('🌐 App Initializer: Fallback to English successful');
                resolveOnce();
              },
              error: (fallbackErr) => {
                console.error('🌐 App Initializer: Even English fallback failed:', fallbackErr);
                resolveOnce();
              }
            });
          } else {
            resolveOnce(); // Continue even if translations fail
          }
        }
      });
      
      // Fallback timeout to ensure app never blocks
      setTimeout(() => {
        resolveOnce();
      }, 3000);
      
    } catch (error) {
      console.error('🌐 App Initializer: Error initializing language:', error);
      resolveOnce();
    }
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    DatePipe, // Add DatePipe here
    MatDialog, // Add MatDialog provider
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }).providers!,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializer,
      deps: [LanguageService, TranslateService],
      multi: true,
    },
  ]
};