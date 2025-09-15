import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [
    RouterOutlet
  ],
  styleUrl: './app.css'
})
export class App {
  protected title = 'HR5A';
  
  constructor() {
    // Debug: Log environment info
    console.log('🔧 Environment Info:', {
      production: environment.production,
      apiBaseUrl: environment.apiBaseUrl,
      timestamp: new Date().toISOString()
    });
  }
}
