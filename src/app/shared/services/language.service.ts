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
      this.translate.use(savedLanguage);
      console.log('🌐 LanguageService: Language set to:', savedLanguage);
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
    this.translate.use(language);
    this.saveLanguage(language);
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
}
