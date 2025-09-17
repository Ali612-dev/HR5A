import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-test-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-map-container">
      <h3>Simple Test Map</h3>
      <div #mapContainer id="test-map" class="map"></div>
    </div>
  `,
  styles: [`
    .test-map-container {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .map {
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 400px;
    }
    
    h3 {
      margin: 10px;
      text-align: center;
    }
  `]
})
export class TestMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  
  private map: L.Map | null = null;

  ngOnInit(): void {
    console.log('TestMapComponent initialized');
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap(): void {
    console.log('Initializing test map...');
    
    // Wait for DOM to be ready
    setTimeout(() => {
      const container = this.mapContainer.nativeElement;
      
      console.log('Map container dimensions:', container.offsetWidth, 'x', container.offsetHeight);
      
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn('Container has no dimensions, retrying...');
        setTimeout(() => this.initializeMap(), 200);
        return;
      }

      try {
        // Initialize map
        this.map = L.map(container, {
          zoomControl: true,
          attributionControl: true,
          preferCanvas: false
        }).setView([24.7136, 46.6753], 12);

        console.log('Map created:', this.map);

        // Add tiles
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        });

        tileLayer.addTo(this.map);
        console.log('Tile layer added');

        // Ensure map renders properly
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
            console.log('Map invalidated');
          }
        }, 100);

        // Add a test marker
        const marker = L.marker([24.7136, 46.6753]).addTo(this.map);
        marker.bindPopup('Test marker - Riyadh').openPopup();
        console.log('Test marker added');

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 100);
  }
}
