
import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMapMarkerAlt, faUsers, faBuilding, faCalendar, faSearch, faEye, faChevronDown, faChevronUp, faFilter } from '@fortawesome/free-solid-svg-icons';
import { AttendanceService } from '../../../../core/attendance.service';
import { GetDailyAttendanceDto, AttendanceViewModel, PaginatedAttendanceResponseDto, GetEmployeeAttendanceHistoryDto, PaginatedEmployeeAttendanceHistoryResponseDto } from '../../../../core/interfaces/attendance.interface';
import { ApiResponse } from '../../../../core/interfaces/dashboard.interface';

interface DepartmentStat {
  key: string;
  presentCount: number;
  totalCount: number;
  percentage: number;
}

@Component({
  selector: 'app-attendance-map',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './attendance-map.component.html',
  styleUrls: ['./attendance-map.component.css']
})
export class AttendanceMapComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private attendanceService = inject(AttendanceService);

  @ViewChild('mapContainer') mapContainer!: ElementRef;
  map: any = null;
  markers: any = null;

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

  attendancePoints: AttendanceViewModel[] = [];
  totalEmployees: number = 0;
  presentCount: number = 0;
  absentCount: number = 0;
  attendancePercent: number = 0;
  departmentStats: DepartmentStat[] = [];
  departments: string[] = [];
  allEmployees: AttendanceViewModel[] = [];
  isMobile: boolean = false;
  isPanelExpanded: boolean = false;
  isFilterExpanded: boolean = false;
  isStatsPanelExpanded: boolean = false;
  isLegendDetailsOpen: boolean = false;
  filterForm!: FormGroup;

  ngOnInit(): void {
    this.isMobile = window.innerWidth < 992;
    
    this.filterForm = this.fb.group({
      date: [''],
      department: [''],
      employeeId: ['']
    });
    
    // Add window resize listener for map compatibility
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 992;
      // Trigger map resize if map exists (important for Vercel)
      if (this.map) {
        setTimeout(() => {
          this.map.invalidateSize();
        }, 100);
      }
    });
    
    // Don't load data yet - wait for map to be ready
  }

  ngAfterViewInit(): void {
    // Check if we're on Vercel
    const isVercel = window.location.hostname.includes('vercel.app');
    console.log('🌐 Environment check - Vercel:', isVercel, 'Hostname:', window.location.hostname);
    
    // Add a small delay to ensure DOM is fully ready (important for Vercel)
    setTimeout(() => {
      this.initializeMap().then(() => {
      console.log('🗺️ Map initialization promise resolved');
      // After map is initialized, load the attendance data
      this.route.queryParams.subscribe(params => {
        console.log('Query params received:', params);
        const employeeId = params['employeeId'];
        const date = params['date'];
        
        if (date) {
          console.log('Loading data for date:', date, 'employeeId:', employeeId);
          this.getAttendanceData(employeeId, date);
        } else {
          // Fallback: load today's data if no date parameter
          const today = new Date().toISOString().split('T')[0];
          console.log('No date parameter, loading today\'s data:', today);
          this.getAttendanceData(undefined, today);
        }
      });
      
      // Also check snapshot for immediate loading
      const snapshotParams = this.route.snapshot.queryParams;
      console.log('Snapshot params:', snapshotParams);
      if (snapshotParams['date']) {
        console.log('Loading from snapshot - date:', snapshotParams['date']);
        this.getAttendanceData(snapshotParams['employeeId'], snapshotParams['date']);
      } else {
        // Fallback: load today's data if no parameters at all
        const today = new Date().toISOString().split('T')[0];
        console.log('No snapshot params, loading today\'s data:', today);
        this.getAttendanceData(undefined, today);
      }
      }).catch((error) => {
        console.error('❌ Map initialization failed:', error);
        this.showMapError('Failed to initialize map. Please check your internet connection and refresh the page.');
      });
    }, 100); // Small delay to ensure DOM is ready
  }

  private async initializeMap(): Promise<void> {
    try {
      console.log('🗺️ Starting map initialization...');
      
      // Ensure Leaflet CSS is loaded (critical for Vercel)
      this.ensureLeafletCSS();
      
      // Import Leaflet and marker cluster dynamically (Vercel-safe approach)
      let L: any;
      try {
        const leafletModule = await import('leaflet');
        L = leafletModule.default || leafletModule;
        console.log('✅ Leaflet imported successfully:', L);
        console.log('Leaflet type:', typeof L);
        console.log('Leaflet has map method:', typeof L.map);
        
        // Validate that L has the required methods
        if (!L || typeof L.map !== 'function') {
          throw new Error('Leaflet import is invalid - missing map method');
        }
      } catch (leafletError) {
        console.error('❌ Failed to import Leaflet from module:', leafletError);
        console.log('🔄 Falling back to CDN loading...');
        
        // Try loading from CDN as fallback
        try {
          L = await this.loadLeafletFromCDN();
          console.log('✅ Leaflet loaded from CDN:', L);
          console.log('Leaflet has map method:', typeof L.map);
          
          if (!L || typeof L.map !== 'function') {
            throw new Error('Leaflet from CDN is invalid - missing map method');
          }
        } catch (cdnError) {
          console.error('❌ Failed to load Leaflet from CDN:', cdnError);
          throw new Error('Leaflet library could not be loaded from any source');
        }
      }
      
      // Import marker cluster with error handling
      try {
        await import('leaflet.markercluster');
        console.log('✅ Leaflet marker cluster imported successfully');
      } catch (clusterError) {
        console.warn('⚠️ Leaflet marker cluster import failed:', clusterError);
        // Continue without clustering
      }
      
      // Wait a bit for the plugin to be fully loaded
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Store markerClusterGroup reference without modifying L object (Vercel compatibility)
      let MarkerClusterGroup: any = null;
      
      try {
        // Try to get markerClusterGroup from the imported module
        const markerClusterModule = await import('leaflet.markercluster');
        MarkerClusterGroup = markerClusterModule.default || markerClusterModule;
        console.log('✅ MarkerClusterGroup imported from module:', MarkerClusterGroup);
      } catch (moduleError) {
        console.warn('⚠️ Failed to import markerClusterGroup from module:', moduleError);
        
        // Try alternative methods without modifying L object
        try {
          MarkerClusterGroup = (window as any).L?.markerClusterGroup || 
                              (window as any).L?.MarkerClusterGroup ||
                              (L as any).markerClusterGroup;
          console.log('✅ MarkerClusterGroup found from window/L:', MarkerClusterGroup);
        } catch (windowError) {
          console.warn('⚠️ MarkerClusterGroup not available anywhere, continuing without clustering');
        }
      }
    
      // Fix default marker icons with fallback URLs (Vercel-safe approach)
      try {
        // Try to delete the problematic method if it exists
        if ((L.Icon.Default.prototype as any)._getIconUrl) {
          try {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
          } catch (deleteError) {
            console.warn('⚠️ Could not delete _getIconUrl (object may be frozen):', deleteError);
          }
        }
        
        // Configure marker icons
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
        console.log('✅ Leaflet marker icons configured');
      } catch (iconError) {
        console.warn('⚠️ Failed to configure Leaflet marker icons:', iconError);
        // Continue without custom icons - Leaflet will use defaults
      }
      
      // Clear any existing map
      if (this.map) {
        this.map.remove();
      }

      // Initialize the map with saved state or default coordinates
      const savedState = this.getSavedMapState();
      // Use much higher zoom level for mobile devices (much closer view)
      const defaultZoom = this.isMobile ? 16 : 10;
      const initialView = savedState || [31.7683, 35.2137, defaultZoom];
      
      console.log('🗺️ Initializing map with view:', initialView);
      
      // Ensure map container has proper dimensions
      const container = this.mapContainer.nativeElement;
      console.log('📐 Map container dimensions:', {
        width: container.offsetWidth,
        height: container.offsetHeight,
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight
      });
      
      // Force container to have dimensions if they're 0 (Vercel issue)
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.log('⚠️ Map container has zero dimensions, setting fallback dimensions');
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.minHeight = '400px';
      }
      
      this.map = L.map(container).setView([initialView[0], initialView[1]], initialView[2]);
    
      // Ensure map is fully rendered before proceeding
      setTimeout(() => {
        if (savedState) {
          console.log('🔄 Restoring saved map state after delay');
          this.map.setView([savedState[0], savedState[1]], savedState[2]);
        }
      }, 100);

      // Add tile layer with error handling
      try {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }).addTo(this.map);
        console.log('✅ Tile layer added successfully');
      } catch (tileError) {
        console.error('❌ Failed to add tile layer:', tileError);
        // Try fallback tile layer
        try {
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(this.map);
          console.log('✅ Fallback tile layer added');
        } catch (fallbackError) {
          console.error('❌ Fallback tile layer also failed:', fallbackError);
        }
      }

      // Create marker cluster group or fallback to layer group
      try {
        console.log('🔧 Creating marker cluster group');
        console.log('MarkerClusterGroup available:', !!MarkerClusterGroup);
        
        if (MarkerClusterGroup) {
          this.markers = new MarkerClusterGroup({
            maxClusterRadius: 80, // Increase radius for better clustering
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            disableClusteringAtZoom: 16, // Disable clustering at zoom 16 and above (close zoom)
            removeOutsideVisibleBounds: false,
            animate: true,
            animateAddingMarkers: true,
            chunkedLoading: true
          });
          console.log('✅ Marker cluster group created successfully:', this.markers);
          console.log('Marker cluster group type:', this.markers.constructor.name);
        } else {
          console.log('⚠️ MarkerClusterGroup not available, using LayerGroup as fallback');
          this.markers = L.layerGroup();
        }
      } catch (error) {
        console.error('❌ Error creating marker cluster group:', error);
        console.log('🔄 Falling back to layer group');
        this.markers = L.layerGroup();
      }

      this.map.addLayer(this.markers);
      console.log('✅ Marker layer added to map');

      // Add event listeners to save map state and handle clustering
      this.map.on('moveend', () => this.saveMapState());
      this.map.on('zoomend', () => {
        this.saveMapState();
        this.handleZoomLevelChange();
      });

      // Force map resize to ensure proper rendering (critical for Vercel)
      setTimeout(() => {
        if (this.map) {
          console.log('🔄 Triggering map resize for Vercel compatibility');
          this.map.invalidateSize();
        }
      }, 500);

      // Map is now ready for markers
      console.log('🎉 Map initialization completed successfully');
      
    } catch (error) {
      console.error('❌ Critical error during map initialization:', error);
      // Show user-friendly error message
      this.showMapError('Failed to initialize map. Please refresh the page.');
    }
  }

  private showMapError(message: string): void {
    console.error('🗺️ Map Error:', message);
    // You can implement a user-friendly error display here
    // For now, we'll just log it
  }

  private ensureLeafletCSS(): void {
    // Check if Leaflet CSS is already loaded
    const existingLeafletCSS = document.querySelector('link[href*="leaflet.css"]');
    if (existingLeafletCSS) {
      console.log('✅ Leaflet CSS already loaded');
      return;
    }

    // Dynamically load Leaflet CSS for Vercel compatibility
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    leafletCSS.crossOrigin = 'anonymous';
    
    // Also load marker cluster CSS
    const clusterCSS = document.createElement('link');
    clusterCSS.rel = 'stylesheet';
    clusterCSS.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
    clusterCSS.crossOrigin = 'anonymous';
    
    const clusterDefaultCSS = document.createElement('link');
    clusterDefaultCSS.rel = 'stylesheet';
    clusterDefaultCSS.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
    clusterDefaultCSS.crossOrigin = 'anonymous';

    document.head.appendChild(leafletCSS);
    document.head.appendChild(clusterCSS);
    document.head.appendChild(clusterDefaultCSS);
    
    console.log('✅ Leaflet CSS files loaded dynamically for Vercel compatibility');
  }

  private async loadLeafletFromCDN(): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check if Leaflet is already loaded
      if ((window as any).L) {
        console.log('✅ Leaflet already available on window');
        resolve((window as any).L);
        return;
      }

      // Load Leaflet JS from CDN
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log('✅ Leaflet loaded from CDN');
        // Load marker cluster plugin
        const clusterScript = document.createElement('script');
        clusterScript.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
        clusterScript.crossOrigin = 'anonymous';
        
        clusterScript.onload = () => {
          console.log('✅ Leaflet marker cluster loaded from CDN');
          resolve((window as any).L);
        };
        
        clusterScript.onerror = () => {
          console.warn('⚠️ Failed to load marker cluster from CDN, continuing without clustering');
          resolve((window as any).L);
        };
        
        document.head.appendChild(clusterScript);
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load Leaflet from CDN');
        reject(new Error('Failed to load Leaflet from CDN'));
      };
      
      document.head.appendChild(script);
    });
  }

  private async updateMapMarkers(): Promise<void> {
    if (!this.map || !this.markers) {
      console.log('Cannot update markers - missing map or markers');
      return;
    }

    if (!this.attendancePoints || this.attendancePoints.length === 0) {
      console.log('No attendance points to display');
      return;
    }

    const L = await import('leaflet');

    console.log('Updating map markers with', this.attendancePoints.length, 'points');
    console.log('Markers object type:', this.markers.constructor.name);
    console.log('Has clearLayers method:', typeof this.markers.clearLayers);
    console.log('Has addLayer method:', typeof this.markers.addLayer);
    console.log('Is MarkerClusterGroup:', this.markers.constructor.name === 'MarkerClusterGroup');

    // Clear existing markers from cluster group
    this.markers.clearLayers();

    // Create custom icons for check-in (green) and check-out (red)
    const checkInIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path fill="#4CAF50" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0zm0 17c-2.485 0-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5 4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5z"/>
        </svg>
      `),
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: this.isMobile ? [0, -20] : [1, -34]
    });

    const checkOutIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path fill="#f44336" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0zm0 17c-2.485 0-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5 4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5z"/>
        </svg>
      `),
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: this.isMobile ? [0, -20] : [1, -34]
    });

    const bounds = L.latLngBounds([]);
    let hasValidPoints = false;

    // Define mobile-responsive popup styling variables
    const popupWidth = this.isMobile ? '120px' : '200px';
    const fontSize = this.isMobile ? '0.7rem' : '1rem';
    const titleFontSize = this.isMobile ? '0.8rem' : '1.1rem';

    // Create custom icon for mixed attendance (purple)
    const mixedAttendanceIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path fill="#9C27B0" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0zm0 17c-2.485 0-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5 4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5z"/>
        </svg>
      `),
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: this.isMobile ? [0, -20] : [1, -34]
    });

    // Group attendance by location (latitude, longitude) only
    // This allows same employee to have multiple markers at different locations
    const locationGroups = new Map<string, any[]>();
    
    this.attendancePoints.forEach(point => {
      if (point.latitude && point.longitude) {
        // Group only by location, not by employee
        const locationKey = `${point.latitude.toFixed(6)}_${point.longitude.toFixed(6)}`;
        
        if (!locationGroups.has(locationKey)) {
          locationGroups.set(locationKey, []);
        }
        locationGroups.get(locationKey)!.push(point);
      }
    });

    console.log(`Grouped ${this.attendancePoints.length} points into ${locationGroups.size} location groups`);
    
    // Debug: Log each group to see what we have
    locationGroups.forEach((points, key) => {
      console.log(`Group ${key}: ${points.length} records`, points.map(p => ({
        name: p.employeeName,
        timeIn: p.timeIn,
        timeOut: p.timeOut,
        lat: p.latitude,
        lng: p.longitude
      })));
    });

    // Create markers for each location group
    let markerCount = 0;
    locationGroups.forEach((points, locationKey) => {
      const firstPoint = points[0];
      hasValidPoints = true;
      bounds.extend([firstPoint.latitude, firstPoint.longitude]);
      
      console.log(`Creating marker for group: ${locationKey} with ${points.length} records`);
      
      let icon = mixedAttendanceIcon; // Default to mixed (purple) for multiple records
      let popupContent = '';
      
      if (points.length === 1) {
        // Single attendance record
        const point = points[0];
        
        // Determine correct icon and time label for single record
        if (point.timeIn && point.timeOut) {
          // Complete attendance record
          icon = mixedAttendanceIcon; // Use purple for complete records
          const timeLabel = 'Complete Attendance';
          const timeValue = `${point.timeIn} - ${point.timeOut}`;
          
          console.log(`Single complete record: ${timeLabel} for ${point.employeeName}`);
          
          popupContent = `
                       <div style="min-width: ${popupWidth}; font-size: ${fontSize};">
                         <h4 style="margin: 0 0 ${this.isMobile ? '3px' : '6px'} 0; color: #2c3e50; font-size: ${titleFontSize}; font-weight: 600;">${point.employeeName}</h4>
                         <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
                           <strong>${timeLabel}:</strong> ${timeValue}
                         </p>
                         <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
                           <strong>Dept:</strong> ${point.department || 'N/A'}
                         </p>
                         <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
                           <strong>Status:</strong> ${point.status || 'N/A'}
                         </p>
                         <small style="color: #6c757d; font-size: ${this.isMobile ? '0.6rem' : '0.8rem'};">ID: ${point.employeeId}</small>
                       </div>
                     `;
        } else if (point.timeIn && !point.timeOut) {
          // Check-in only
          icon = checkInIcon;
          const timeLabel = 'Check In Only';
          
          console.log(`Single check-in record: ${timeLabel} for ${point.employeeName}`);
          
          popupContent = `
            <div style="min-width: ${popupWidth}; font-size: ${fontSize};">
              <h4 style="margin: 0 0 ${this.isMobile ? '3px' : '6px'} 0; color: #2c3e50; font-size: ${titleFontSize}; font-weight: 600;">${point.employeeName}</h4>
              <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
                <strong>${timeLabel}:</strong> ${point.timeIn}
              </p>
              <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
                <strong>Dept:</strong> ${point.department || 'N/A'}
              </p>
              <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
                <strong>Status:</strong> ${point.status || 'N/A'}
              </p>
              <small style="color: #6c757d; font-size: ${this.isMobile ? '0.6rem' : '0.8rem'};">ID: ${point.employeeId}</small>
            </div>
          `;
        } else if (!point.timeIn && point.timeOut) {
          // Check-out only
          icon = checkOutIcon;
          const timeLabel = 'Check Out Only';
          
          console.log(`Single check-out record: ${timeLabel} for ${point.employeeName}`);
          
          popupContent = `
            <div style="min-width: ${popupWidth}; font-size: ${fontSize};">
              <h4 style="margin: 0 0 ${this.isMobile ? '3px' : '6px'} 0; color: #2c3e50; font-size: ${titleFontSize}; font-weight: 600;">${point.employeeName}</h4>
              <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
                <strong>${timeLabel}:</strong> ${point.timeOut}
              </p>
              <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
                <strong>Dept:</strong> ${point.department || 'N/A'}
              </p>
              <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
                <strong>Status:</strong> ${point.status || 'N/A'}
              </p>
              <small style="color: #6c757d; font-size: ${this.isMobile ? '0.6rem' : '0.8rem'};">ID: ${point.employeeId}</small>
            </div>
          `;
        } else {
          // No time data
          icon = mixedAttendanceIcon;
          const timeLabel = 'No Time Data';
          
          console.log(`Single record with no time data: ${timeLabel} for ${point.employeeName}`);
          
          popupContent = `
            <div style="min-width: ${popupWidth}; font-size: ${fontSize};">
              <h4 style="margin: 0 0 ${this.isMobile ? '3px' : '6px'} 0; color: #2c3e50; font-size: ${titleFontSize}; font-weight: 600;">${point.employeeName}</h4>
              <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
                <strong>${timeLabel}:</strong> N/A
              </p>
              <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
                <strong>Dept:</strong> ${point.department || 'N/A'}
              </p>
              <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
                <strong>Status:</strong> ${point.status || 'N/A'}
              </p>
              <small style="color: #6c757d; font-size: ${this.isMobile ? '0.6rem' : '0.8rem'};">ID: ${point.employeeId}</small>
            </div>
          `;
        }
      } else {
        // Multiple attendance records at same location
        // Check if all records are from the same employee
        const uniqueEmployees = [...new Set(points.map(p => p.employeeId))];
        const isSameEmployee = uniqueEmployees.length === 1;
        
        if (isSameEmployee) {
          console.log(`Multiple records marker: ${points.length} records for ${firstPoint.employeeName} at same location`);
          
                     const multiPopupWidth = this.isMobile ? '140px' : '250px';
                     const multiFontSize = this.isMobile ? '0.65rem' : '0.9rem';
                     const multiTitleFontSize = this.isMobile ? '0.75rem' : '1rem';
                     
                     popupContent = `
                       <div style="min-width: ${multiPopupWidth}; font-size: ${multiFontSize};">
                         <h4 style="margin: 0 0 8px 0; color: #2c3e50; font-size: ${multiTitleFontSize}; font-weight: 600;">${firstPoint.employeeName}</h4>
                         <p style="margin: 3px 0; color: #495057; font-weight: bold; line-height: 1.3;">
                           Multiple Records (${points.length})
                         </p>
          `;
        } else {
          console.log(`Multiple records marker: ${points.length} records from ${uniqueEmployees.length} employees at same location`);
          
          popupContent = `
            <div style="min-width: 280px;">
              <h4 style="margin: 0 0 12px 0; color: #2c3e50;">Multiple Employees at Same Location</h4>
              <p style="margin: 4px 0; color: #495057; font-weight: bold;">
                ${points.length} Records from ${uniqueEmployees.length} Employees
              </p>
          `;
        }
        
        points.forEach((point, index) => {
          // Determine the correct time label and value for each individual record
          let timeLabel = '';
          let timeValue = '';
          let statusColor = '';
          
          if (point.timeIn && point.timeOut) {
            // This record has both check-in and check-out
            timeLabel = 'Check In & Out';
            timeValue = `${point.timeIn} - ${point.timeOut}`;
            statusColor = '#FF9800'; // Orange for complete attendance
          } else if (point.timeIn && !point.timeOut) {
            // This record has only check-in
            timeLabel = 'Check In Only';
            timeValue = point.timeIn;
            statusColor = '#4CAF50'; // Green for check-in
          } else if (!point.timeIn && point.timeOut) {
            // This record has only check-out
            timeLabel = 'Check Out Only';
            timeValue = point.timeOut;
            statusColor = '#f44336'; // Red for check-out
          } else {
            // This record has no time data
            timeLabel = 'No Time Data';
            timeValue = 'N/A';
            statusColor = '#9E9E9E'; // Gray for no data
          }
          
          console.log(`  Record ${index + 1}: ${timeLabel} at ${timeValue}`);
          
          // Show employee name if there are multiple employees at this location
          const showEmployeeName = !isSameEmployee;
          
          popupContent += `
            <div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid ${statusColor};">
              ${showEmployeeName ? `<p style="margin: 2px 0; font-weight: bold; color: #2c3e50;">${point.employeeName} (ID: ${point.employeeId})</p>` : ''}
              <p style="margin: 2px 0; font-weight: bold; color: ${statusColor};">${timeLabel}</p>
              <p style="margin: 2px 0; color: #495057;">Time: ${timeValue}</p>
              <p style="margin: 2px 0; color: #495057;">Status: ${point.status || 'N/A'}</p>
            </div>
          `;
        });
        
        if (isSameEmployee) {
          popupContent += `
              <p style="margin: 8px 0 4px 0; color: #495057;">
                <strong>Department:</strong> ${firstPoint.department || 'N/A'}
              </p>
              <small>ID: ${firstPoint.employeeId}</small>
            </div>
          `;
        } else {
          // For multiple employees, show unique departments
          const uniqueDepartments = [...new Set(points.map(p => p.department || 'N/A'))];
          popupContent += `
              <p style="margin: 8px 0 4px 0; color: #495057;">
                <strong>Departments:</strong> ${uniqueDepartments.join(', ')}
              </p>
              <small>Location: ${firstPoint.latitude.toFixed(4)}, ${firstPoint.longitude.toFixed(4)}</small>
            </div>
          `;
        }
      }
      
      const marker = L.marker([firstPoint.latitude, firstPoint.longitude], { icon })
        .bindPopup(popupContent);
      
      this.markers.addLayer(marker);
      markerCount++;
      console.log(`✅ Added marker ${markerCount} (${points.length} records, icon: ${icon === mixedAttendanceIcon ? 'purple' : icon === checkInIcon ? 'green' : 'red'}) to cluster group`);
    });

    // Focus map on attendance points if we have valid data and no saved state
    if (hasValidPoints && bounds.isValid()) {
      const savedState = this.getSavedMapState();
      if (!savedState) {
        console.log('No saved state, fitting bounds to attendance points');
        // Use different padding for mobile vs desktop
        const padding = this.isMobile ? [10, 10] : [20, 20];
        this.map.fitBounds(bounds, { padding });
      } else {
        console.log('Saved state exists, keeping current view');
      }
    }
  }

  getAttendanceData(employeeId?: number, date?: string): void {
    console.log('getAttendanceData called with:', { employeeId, date });
    
    if (employeeId && date) {
      console.log('Loading employee attendance history...');
      const request: GetEmployeeAttendanceHistoryDto = {
        employeeId: +employeeId,
        startDate: date,
        endDate: date,
        pageNumber: 1,
        pageSize: 1000
      };

      this.attendanceService.getEmployeeAttendanceHistory(request)
        .subscribe((response: ApiResponse<PaginatedEmployeeAttendanceHistoryResponseDto>) => {
          console.log('Employee attendance response:', response);
          if (response.isSuccess && response.data) {
            this.attendancePoints = response.data.attendances;
            console.log('Loaded attendance points:', this.attendancePoints.length);
            this.calculateStats();
          }
        });
    } else if (date) {
      console.log('Loading daily attendance...');
      const request: GetDailyAttendanceDto = {
        date: date,
        pageNumber: 1,
        pageSize: 1000 // Fetch all for the day to calculate stats
      };

      this.attendanceService.getDailyAttendance(request)
        .subscribe((response: ApiResponse<PaginatedAttendanceResponseDto>) => {
          console.log('Daily attendance response:', response);
          if (response.isSuccess && response.data) {
            this.attendancePoints = response.data.attendances;
            console.log('Loaded attendance points:', this.attendancePoints.length);
            this.calculateStats();
          }
        });
    } else {
      console.log('No valid parameters provided to getAttendanceData');
    }
  }

  private calculateStats(): void {
    this.allEmployees = this.attendancePoints.filter((value, index, self) =>
      self.findIndex(emp => emp.employeeId === value.employeeId) === index
    );
    this.totalEmployees = this.allEmployees.length;
    this.presentCount = this.allEmployees.filter(emp => emp.status === 'Present' || emp.status === 'checked_in').length;
    this.absentCount = this.totalEmployees - this.presentCount;
    this.attendancePercent = this.totalEmployees > 0 ? Math.round((this.presentCount * 100) / this.totalEmployees) : 0;

    const departmentMap = new Map<string, { presentCount: number, totalCount: number }>();
    this.allEmployees.forEach(emp => {
      const deptName = emp.department || 'Unknown';
      if (!departmentMap.has(deptName)) {
        departmentMap.set(deptName, { presentCount: 0, totalCount: 0 });
      }
      const stats = departmentMap.get(deptName)!;
      stats.totalCount++;
      if (emp.status === 'Present' || emp.status === 'checked_in') {
        stats.presentCount++;
      }
    });

    this.departmentStats = Array.from(departmentMap.entries()).map(([key, value]) => ({
      key,
      presentCount: value.presentCount,
      totalCount: value.totalCount,
      percentage: value.totalCount > 0 ? Math.round((value.presentCount * 100) / value.totalCount) : 0
    }));

    this.departments = Array.from(new Set(this.allEmployees.map(emp => emp.department || 'Unknown')));
    
    // Update map markers with new data
    // Delay to ensure data is fully processed and marker cluster plugin is loaded
    setTimeout(() => {
      console.log('Updating markers after stats calculation');
      this.updateMapMarkers();
    }, 100);
  }


  getDepartmentPercentage(dept: string): number {
    const stat = this.departmentStats.find(s => s.key === dept);
    return stat ? stat.percentage : 0;
  }

  getDepartmentProgressWidth(dept: string): string {
    return `${this.getDepartmentPercentage(dept)}%`;
  }

  // Placeholder properties for template compatibility
  get uniqueEmployees() {
    return this.allEmployees;
  }

  get isLoading() {
    return false; // Add loading state if needed
  }

  getDepartmentPresentCount(dept: string): number {
    const stat = this.departmentStats.find(s => s.key === dept);
    return stat ? stat.presentCount : 0;
  }

  getDepartmentTotalCount(dept: string): number {
    const stat = this.departmentStats.find(s => s.key === dept);
    return stat ? stat.totalCount : 0;
  }

  goBack(): void {
    window.history.back();
  }

  goToAttendanceTable(): void {
    this.router.navigate(['/attendance']);
  }

  togglePanel(): void {
    this.isPanelExpanded = !this.isPanelExpanded;
  }

  toggleFilter(): void {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  toggleStatsPanel(): void {
    this.isStatsPanelExpanded = !this.isStatsPanelExpanded;
    console.log('📊 Toggle stats panel:', this.isStatsPanelExpanded);
  }

  closeStatsPanel(): void {
    this.isStatsPanelExpanded = false;
    console.log('❌ Close stats panel');
  }

  toggleLegendDetails(): void {
    this.isLegendDetailsOpen = !this.isLegendDetailsOpen;
    console.log('📋 Toggle legend details:', this.isLegendDetailsOpen);
  }

  focusOnEmployee(employeeId: number): void {
    // Find employee attendance points and focus map on them
    const employeePoints = this.attendancePoints.filter(point => point.employeeId === employeeId);
    if (employeePoints.length > 0) {
      // TODO: Implement map focus functionality when map component is available
      console.log('Focusing on employee:', employeeId, employeePoints[0]);
    }
  }

  onSearchChange(searchTerm: string): void {
    // Filter employees based on search term
    // This would typically filter the uniqueEmployees array
  }

  private saveMapState(): void {
    if (!this.map) return;
    
    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const mapState = {
      lat: center.lat,
      lng: center.lng,
      zoom: zoom
    };
    
    console.log('Saving map state:', mapState);
    localStorage.setItem('attendance-map-state', JSON.stringify(mapState));
  }

  private getSavedMapState(): [number, number, number] | null {
    try {
      const savedState = localStorage.getItem('attendance-map-state');
      console.log('Retrieved saved state from localStorage:', savedState);
      if (savedState) {
        const state = JSON.parse(savedState);
        console.log('Parsed saved state:', state);
        return [state.lat, state.lng, state.zoom];
      }
    } catch (error) {
      console.warn('Failed to restore map state:', error);
    }
    console.log('No saved state found, using default');
    return null;
  }

  handleZoomLevelChange(): void {
    if (!this.map || !this.markers) return;
    
    const currentZoom = this.map.getZoom();
    console.log(`🔍 Zoom level changed to: ${currentZoom}`);
    
    // Dynamic cluster radius based on zoom level
    let newRadius = 80; // Default radius
    
    if (currentZoom >= 16) {
      // Very close zoom - no clustering
      newRadius = 0;
      console.log('🔍 At close zoom level - disabling clustering');
    } else if (currentZoom >= 14) {
      // Close zoom - small clusters
      newRadius = 30;
      console.log('🔍 At medium-close zoom level - small clusters');
    } else if (currentZoom >= 12) {
      // Medium zoom - medium clusters
      newRadius = 60;
      console.log('🔍 At medium zoom level - medium clusters');
    } else {
      // Far zoom - large clusters
      newRadius = 100;
      console.log('🔍 At far zoom level - large clusters');
    }
    
    // Update cluster options if the marker cluster group supports it
    if (this.markers.options && this.markers.options.maxClusterRadius !== newRadius) {
      this.markers.options.maxClusterRadius = newRadius;
      console.log(`🔍 Updated cluster radius to: ${newRadius}`);
      
      // Force refresh clustering
      if (this.markers.refreshClusters) {
        this.markers.refreshClusters();
      }
    }
    
    // Trigger a re-clustering after a short delay to ensure smooth transition
    setTimeout(() => {
      if (this.markers && this.markers.refreshClusters) {
        this.markers.refreshClusters();
      }
    }, 150);
  }

}
