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
    // Set default language
    translate.setDefaultLang('en');
    // Use a language
    translate.use('en');
  }

  ngOnInit(): void {
    this.checkAdminToken();
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
