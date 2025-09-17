import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMapMarkerAlt, faUsers, faBuilding, faCalendar, faSearch, faEye, faChevronDown, faChevronUp, faFilter } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClientService } from '../../../../core/http-client.service';
import { AttendanceStore } from '../../../../store/attendance.store';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import * as L from 'leaflet';
import 'leaflet.markercluster';

@Component({
  selector: 'app-attendance-map-simple',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FontAwesomeModule,
    ReactiveFormsModule
  ],
  templateUrl: './attendance-map-simple.component.html',
  styleUrls: ['./attendance-map-simple.component.css']
})
export class AttendanceMapSimpleComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();
  private translate = inject(TranslateService);
  private httpClient = inject(HttpClientService);
  private attendanceStore = inject(AttendanceStore);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Icons
  faMapMarkerAlt = faMapMarkerAlt;
  faUsers = faUsers;
  faBuilding = faBuilding;
  faCalendar = faCalendar;
  faSearch = faSearch;
  faEye = faEye;
  faChevronDown = faChevronDown;
  faChevronUp = faChevronUp;
  faFilter = faFilter;

  // Map Properties
  private map: L.Map | null = null;
  private markers: L.MarkerClusterGroup | null = null;

  // Form
  filterForm: FormGroup;
  
  // UI State
  isMobile = false;
  isLoading = true;

  constructor() {
    this.filterForm = this.fb.group({
      date: [new Date().toISOString().split('T')[0]],
      department: [''],
      employeeId: ['']
    });
  }

  ngOnInit(): void {
    this.checkMobileView();
    this.setupFormSubscriptions();
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.map) {
      this.map.remove();
    }
  }

  private checkMobileView(): void {
    this.isMobile = window.innerWidth < 992;
  }

  private initializeMap(): void {
    console.log('Initializing simplified map...');
    
    setTimeout(() => {
      const container = this.mapContainer.nativeElement;
      
      console.log('Map container dimensions:', container.offsetWidth, 'x', container.offsetHeight);
      
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn('Container has no dimensions, retrying...');
        setTimeout(() => this.initializeMap(), 200);
        return;
      }

      try {
        // Initialize map with minimal options
        this.map = L.map(container, {
          zoomControl: true,
          attributionControl: true,
          preferCanvas: false,
          // Remove any conflicting options
          renderer: L.canvas()
        }).setView([24.7136, 46.6753], 12);

        console.log('Map created:', this.map);

        // Add tiles with explicit options
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 1,
          // Force tile loading
          keepBuffer: 2,
          updateWhenZooming: false,
          updateWhenIdle: true
        });

        tileLayer.addTo(this.map);
        console.log('Tile layer added');

        // Create markers
        this.markers = L.markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 50
        });
        this.map.addLayer(this.markers);

        // Ensure map renders properly
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
            console.log('Map invalidated');
          }
        }, 200);

        // Add test markers
        this.addTestMarkers();
        this.isLoading = false;

      } catch (error) {
        console.error('Error initializing map:', error);
        this.isLoading = false;
      }
    }, 100);
  }

  private addTestMarkers(): void {
    if (!this.markers) return;

    // Add some test markers around Riyadh
    const testLocations = [
      { lat: 24.7136, lng: 46.6753, name: 'Riyadh Center' },
      { lat: 24.7236, lng: 46.6853, name: 'Test Location 1' },
      { lat: 24.7036, lng: 46.6653, name: 'Test Location 2' },
      { lat: 24.7336, lng: 46.6953, name: 'Test Location 3' }
    ];

    testLocations.forEach((location, index) => {
      const marker = L.marker([location.lat, location.lng], {
        icon: L.divIcon({
          className: 'location-marker check-in',
          iconSize: [14, 14]
        })
      }).bindPopup(`<strong>${location.name}</strong><br>Test marker ${index + 1}`);
      
      this.markers!.addLayer(marker);
    });

    console.log('Test markers added');
  }

  private setupFormSubscriptions(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((formValue) => {
        console.log('Form changed:', formValue);
        // Simplified - just log changes for now
      });
  }

  focusOnEmployee(employeeId: number): void {
    console.log('Focus on employee:', employeeId);
    // Simplified - just log for now
  }

  goBack(): void {
    this.router.navigate(['/attendance']);
  }
}
