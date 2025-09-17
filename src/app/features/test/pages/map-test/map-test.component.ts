import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TestMapComponent } from '../../../../shared/components/test-map/test-map.component';

@Component({
  selector: 'app-map-test',
  standalone: true,
  imports: [CommonModule, RouterModule, TestMapComponent],
  template: `
    <div class="map-test-page">
      <div class="header">
        <h1>Map Fragmentation Test</h1>
        <p>This is a simple test to identify map rendering issues</p>
        <a routerLink="/attendance-map" class="back-btn">Back to Attendance Map</a>
      </div>
      
      <app-test-map></app-test-map>
    </div>
  `,
  styles: [`
    .map-test-page {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background: #f8f9fa;
      padding: 20px;
      border-bottom: 1px solid #dee2e6;
    }
    
    .header h1 {
      margin: 0 0 10px 0;
      color: #333;
    }
    
    .header p {
      margin: 0 0 15px 0;
      color: #666;
    }
    
    .back-btn {
      display: inline-block;
      padding: 8px 16px;
      background: #6c5ce7;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .back-btn:hover {
      background: #5a4fcf;
    }
  `]
})
export class MapTestComponent {
}
