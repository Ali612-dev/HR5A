import { Component, EventEmitter, Output, Input, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  template: `
    <div class="language-switcher">
      <button class="current-lang-btn" (click)="toggleDropdown()">{{ currentLang?.toUpperCase() }} ▼</button>
      <ul *ngIf="isOpen" class="lang-dropdown">
        <li *ngFor="let lang of availableLangs" (click)="selectLanguage(lang)">
          {{ lang.toUpperCase() }}
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .language-switcher {
      position: relative;
      display: inline-block;
      cursor: pointer;
    }
    .current-lang-btn {
      /* Inherit base button styles */
      padding: 0.7rem 1.8rem;
      border: none;
      border-radius: 30px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      text-transform: uppercase;
      letter-spacing: 0.03em;

      /* Login button specific styles */
      background-color: rgba(255,255,255,0.1);
      color: white;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .current-lang-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.25);
      background-color: rgba(255,255,255,0.2);
      border-color: rgba(255,255,255,0.4);
    }
    .lang-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background-color: rgba(0, 0, 0, 0.7);
      border-radius: 5px;
      list-style: none;
      padding: 0.5rem 0;
      margin: 0.5rem 0 0 0;
      min-width: 120px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      z-index: 1001;
      /* Water effect styles */
      backdrop-filter: blur(8px); /* Frosted glass effect */
      -webkit-backdrop-filter: blur(8px); /* For Safari */
      opacity: 1; /* Ensure it's visible when rendered */
      transform: translateY(0); /* Ensure it's in position when rendered */
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .lang-dropdown li {
      padding: 0.7rem 1rem;
      color: white;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    .lang-dropdown li:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class LanguageSwitcherComponent implements OnInit {
  @Input() currentLang: string | null = 'en';
  @Input() availableLangs: string[] = ['en', 'ar', 'it'];
  @Output() langChange = new EventEmitter<string>();

  isOpen: boolean = false;

  constructor(
    private translate: TranslateService, 
    private languageService: LanguageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Get current language from the language service
    this.currentLang = this.languageService.getCurrentLanguage();
    console.log('🌐 LanguageSwitcher: Initialized with language:', this.currentLang);
    
    // Debug localStorage directly
    if (isPlatformBrowser(this.platformId)) {
      const directCheck = localStorage.getItem('selectedLanguage');
      console.log('🌐 LanguageSwitcher: Direct localStorage check:', directCheck);
    }
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectLanguage(lang: string): void {
    // Use language service to change and persist language
    this.languageService.changeLanguage(lang);
    this.currentLang = lang;
    this.langChange.emit(lang);
    this.isOpen = false;
  }
}