import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANGUAGE_KEY = 'selectedLanguage';
  private readonly AVAILABLE_LANGUAGES = ['en', 'ar', 'it'];
  private readonly DEFAULT_LANGUAGE = 'en';

  constructor(
    private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Initialize the language service by setting up the default language
   * and restoring any saved language preference
   */
  initializeLanguage(): void {
    console.log('🌐 LanguageService: Starting initialization...');
    console.log('🌐 LanguageService: Platform browser?', isPlatformBrowser(this.platformId));
    
    this.translate.setDefaultLang(this.DEFAULT_LANGUAGE);
    console.log('🌐 LanguageService: Default language set to:', this.DEFAULT_LANGUAGE);
    
    const savedLanguage = this.getSavedLanguage();
    console.log('🌐 LanguageService: Saved language from localStorage:', savedLanguage);
    
    if (savedLanguage) {
      console.log('🌐 LanguageService: Restoring saved language:', savedLanguage);
      this.translate.use(savedLanguage).subscribe({
        next: () => {
          console.log('🌐 LanguageService: Language successfully restored to:', savedLanguage);
        },
        error: (error) => {
          console.error('🌐 LanguageService: Error restoring saved language:', error);
          console.log('🌐 LanguageService: Falling back to default language');
          this.translate.use(this.DEFAULT_LANGUAGE);
        }
      });
    } else {
      console.log('🌐 LanguageService: No saved language found, using default:', this.DEFAULT_LANGUAGE);
      this.translate.use(this.DEFAULT_LANGUAGE);
    }
    
    // Verify current language after initialization
    setTimeout(() => {
      console.log('🌐 LanguageService: Current language after initialization:', this.translate.currentLang);
    }, 100);
  }

  /**
   * Change the current language and save it to localStorage
   */
  changeLanguage(language: string): void {
    if (!this.AVAILABLE_LANGUAGES.includes(language)) {
      console.warn('🌐 LanguageService: Invalid language:', language);
      return;
    }

    console.log('🌐 LanguageService: Changing language to:', language);
    console.log('🌐 LanguageService: Available languages:', this.AVAILABLE_LANGUAGES);
    
    // Save to localStorage first
    this.saveLanguage(language);
    
    // Then update the translate service
    this.translate.use(language).subscribe({
      next: () => {
        console.log('🌐 LanguageService: Language successfully changed to:', language);
        console.log('🌐 LanguageService: Current language after change:', this.translate.currentLang);
        
        // Double-check that the language was actually set
        if (this.translate.currentLang !== language) {
          console.error('🌐 LanguageService: Language mismatch! Expected:', language, 'Got:', this.translate.currentLang);
          // Force the language again
          this.translate.use(language);
        }
      },
      error: (error) => {
        console.error('🌐 LanguageService: Error changing language:', error);
        console.error('🌐 LanguageService: Error details:', error);
        
        // If there's an error, try to fallback to English
        console.log('🌐 LanguageService: Falling back to English due to error');
        this.translate.use('en');
        this.saveLanguage('en');
      }
    });
  }

  /**
   * Get the currently saved language from localStorage
   */
  getSavedLanguage(): string | null {
    console.log('🌐 LanguageService: Checking for saved language...');
    
    if (!isPlatformBrowser(this.platformId)) {
      console.log('🌐 LanguageService: Not in browser, returning null');
      return null;
    }

    try {
      const savedLanguage = localStorage.getItem(this.LANGUAGE_KEY);
      console.log('🌐 LanguageService: Raw value from localStorage:', savedLanguage);
      
      if (savedLanguage && this.AVAILABLE_LANGUAGES.includes(savedLanguage)) {
        console.log('🌐 LanguageService: Valid saved language found:', savedLanguage);
        return savedLanguage;
      } else {
        console.log('🌐 LanguageService: Invalid or no saved language. Available:', this.AVAILABLE_LANGUAGES);
      }
    } catch (error) {
      console.warn('🌐 LanguageService: Error reading from localStorage:', error);
    }

    return null;
  }

  /**
   * Save the language preference to localStorage
   */
  private saveLanguage(language: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(this.LANGUAGE_KEY, language);
      console.log('🌐 LanguageService: Language saved to localStorage:', language);
    } catch (error) {
      console.warn('🌐 LanguageService: Error saving to localStorage:', error);
    }
  }

  /**
   * Get the current language from the translate service
   */
  getCurrentLanguage(): string {
    return this.translate.currentLang || this.DEFAULT_LANGUAGE;
  }

  /**
   * Get the list of available languages
   */
  getAvailableLanguages(): string[] {
    return [...this.AVAILABLE_LANGUAGES];
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    return this.AVAILABLE_LANGUAGES.includes(language);
  }

  /**
   * Test if a translation file can be loaded
   */
  testTranslationLoading(language: string): void {
    console.log('🌐 LanguageService: Testing translation loading for:', language);
    
    // Use the translate service to test loading
    this.translate.use(language).subscribe({
      next: () => {
        console.log('🌐 LanguageService: Successfully loaded translations for:', language);
        // Test a simple translation to verify it's working
        const testTranslation = this.translate.instant('NAV.HOME');
        console.log('🌐 LanguageService: Test translation (NAV.HOME):', testTranslation);
      },
      error: (error: any) => {
        console.error('🌐 LanguageService: Failed to load translations for:', language);
        console.error('🌐 LanguageService: Error details:', error);
      }
    });
  }
}
