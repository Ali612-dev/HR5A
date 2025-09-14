import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { LanguageSwitcherComponent } from '../../../../shared/components/language-switcher/language-switcher.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth.service';
import { AuthStore } from '../../../../store/auth.store';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  standalone: true,
  imports: [CommonModule, LanguageSwitcherComponent, TranslateModule, RouterLink],
})
export class HomeComponent implements OnInit {
  showGoToDashboardButton = signal(false);
  public authStore = inject(AuthStore);

  constructor(
    private translate: TranslateService,
    private authService: AuthService
  ) {
    // Set default language with more robust initialization
    // Force Vercel to use latest commit with fallbacks
    this.initializeTranslations();
  }

  ngOnInit(): void {
    this.checkAdminToken();
  }

  private initializeTranslations(): void {
    try {
      this.translate.setDefaultLang('en');
      this.translate.use('en');
      
      // Ensure translations are loaded with fallback
      this.translate.get('headerTitle').subscribe({
        next: (res: string) => {
          console.log('Translations loaded successfully:', res);
        },
        error: (err) => {
          console.warn('Translation loading failed, using fallbacks:', err);
        }
      });
    } catch (error) {
      console.warn('Translation service initialization failed:', error);
    }
  }

  checkAdminToken(): void {
    const token = this.authStore.token();
    console.log('HomeComponent: Token from AuthStore:', token);
    if (token && !this.authService.isTokenExpired(token)) {
      console.log('HomeComponent: Token is valid and not expired.');
      this.showGoToDashboardButton.set(true);
    } else {
      console.log('HomeComponent: Token is either missing or expired.');
      this.showGoToDashboardButton.set(false);
    }
  }

  changeLanguage(lang: string): void {
    this.translate.use(lang);
  }

  scrollToFeatures(): void {
    document.getElementById('features')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  }
}
