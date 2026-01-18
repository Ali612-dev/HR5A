import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import localeIt from '@angular/common/locales/it';

registerLocaleData(localeAr, 'ar');
registerLocaleData(localeIt, 'it');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
