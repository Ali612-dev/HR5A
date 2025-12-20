
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
      // Use much closer zoom levels for better initial view
      const defaultZoom = this.isMobile ? 18 : 15;
      
      // Ensure minimum zoom level even if saved state exists
      let initialZoom = defaultZoom;
      if (savedState) {
        // Use saved zoom only if it's close enough, otherwise use default
        initialZoom = savedState[2] >= 12 ? savedState[2] : defaultZoom;
        console.log(`Using zoom level: ${initialZoom} (saved: ${savedState[2]}, default: ${defaultZoom})`);
      }
      
      const initialView = savedState ? [savedState[0], savedState[1], initialZoom] : [31.7683, 35.2137, defaultZoom];
      
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
      
      // Always start with default view - we'll fit bounds to markers after data loads
      this.map = L.map(container).setView([initialView[0], initialView[1]], initialView[2]);
      console.log('🗺️ Map initialized with default view. Will fit bounds to markers when data loads.');

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

    // Use the Leaflet instance that was already loaded during map initialization
    // We need to get it from the global scope or re-import it safely
    let L: any;
    try {
      const leafletModule = await import('leaflet');
      L = leafletModule.default || leafletModule;
      
      // Check if essential Leaflet functions are available (Vercel compatibility)
      if (!L.marker || typeof L.marker !== 'function') {
        console.error('❌ L.marker is not available, cannot create markers');
        console.log('Available L methods:', Object.keys(L).filter(key => typeof L[key] === 'function'));
        return;
      }
      
      console.log('✅ L.marker is available for marker creation');
    } catch (importError) {
      console.error('❌ Failed to import Leaflet for markers:', importError);
      return;
    }

    console.log('Updating map markers with', this.attendancePoints.length, 'points');
    console.log('Markers object type:', this.markers.constructor.name);
    console.log('Has clearLayers method:', typeof this.markers.clearLayers);
    console.log('Has addLayer method:', typeof this.markers.addLayer);
    console.log('Is MarkerClusterGroup:', this.markers.constructor.name === 'MarkerClusterGroup');

    // Clear existing markers from cluster group
    this.markers.clearLayers();

    // Check if L.icon and L.Icon are available (Vercel compatibility)
    let checkInIcon: any;
    let checkOutIcon: any;
    let mixedAttendanceIcon: any;
    
    if (!L.icon || typeof L.icon !== 'function' || !L.Icon || !L.Icon.Default) {
      console.error('❌ L.icon or L.Icon.Default is not available, using fallback markers');
      console.log('L.icon available:', !!L.icon);
      console.log('L.Icon available:', !!L.Icon);
      console.log('L.Icon.Default available:', !!(L.Icon && L.Icon.Default));
      
      // Create simple fallback markers using basic Leaflet functionality
      try {
        // Try to create basic markers without custom icons
        checkInIcon = null; // Will use default marker
        checkOutIcon = null; // Will use default marker
        mixedAttendanceIcon = null; // Will use default marker
        console.log('✅ Using null icons - Leaflet will use default markers');
      } catch (fallbackError) {
        console.error('❌ Even fallback markers failed:', fallbackError);
        // Last resort - try to create basic markers
        checkInIcon = {};
        checkOutIcon = {};
        mixedAttendanceIcon = {};
      }
    } else {
      console.log('✅ L.icon is available, creating custom icons');
      
      try {
        // Create custom icons for check-in (green) and check-out (red)
        checkInIcon = L.icon({
          iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4CAF50" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0zm0 17c-2.485 0-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5 4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5z"/>
            </svg>
          `),
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: this.isMobile ? [0, -20] : [1, -34]
        });

        checkOutIcon = L.icon({
          iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
              <path fill="#f44336" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0zm0 17c-2.485 0-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5 4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5z"/>
            </svg>
          `),
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: this.isMobile ? [0, -20] : [1, -34]
        });

        // Create custom icon for mixed attendance (purple)
        mixedAttendanceIcon = L.icon({
          iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
              <path fill="#9C27B0" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0zm0 17c-2.485 0-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5 4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5z"/>
            </svg>
          `),
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: this.isMobile ? [0, -20] : [1, -34]
        });
        
        console.log('✅ Custom icons created successfully');
      } catch (iconError) {
        console.error('❌ Failed to create custom icons:', iconError);
        console.log('🔄 Falling back to default icons');
        checkInIcon = L.Icon.Default;
        checkOutIcon = L.Icon.Default;
        mixedAttendanceIcon = L.Icon.Default;
      }
    }

    // Check if L.latLngBounds is available (Vercel compatibility)
    let bounds: any = null;
    let hasValidPoints = false;
    
    if (L.latLngBounds && typeof L.latLngBounds === 'function') {
      bounds = L.latLngBounds([]);
      console.log('✅ L.latLngBounds is available');
    } else {
      console.warn('⚠️ L.latLngBounds is not available, skipping bounds calculation');
    }

    // Define mobile-responsive popup styling variables
    const popupWidth = this.isMobile ? '120px' : '200px';
    const fontSize = this.isMobile ? '0.7rem' : '1rem';
    const titleFontSize = this.isMobile ? '0.8rem' : '1.1rem';

    // Create separate markers for attendance (green) and departure (red)
    // We'll process each attendance record and create markers based on timeIn and timeOut locations
    const markerData: Array<{
      point: AttendanceViewModel;
      lat: number;
      lng: number;
      type: 'attendance' | 'departure';
    }> = [];
    
    this.attendancePoints.forEach(point => {
      // Add green marker for attendance (timeIn) if location exists
      const attendanceLat = point.checkInLat || point.latitude;
      const attendanceLng = point.checkInLng || point.longitude;
      
      if (point.timeIn && attendanceLat && attendanceLng) {
        markerData.push({
          point: point,
          lat: attendanceLat,
          lng: attendanceLng,
          type: 'attendance'
        });
      }
      
      // Add red marker for departure (timeOut) if location exists
      const departureLat = point.checkOutLat || point.outLatitude;
      const departureLng = point.checkOutLng || point.outLongitude;
      
      if (point.timeOut && departureLat && departureLng) {
        markerData.push({
          point: point,
          lat: departureLat,
          lng: departureLng,
          type: 'departure'
        });
      }
    });

    console.log(`Created ${markerData.length} markers from ${this.attendancePoints.length} attendance records`);
    
    // Create markers for each attendance/departure record
    let markerCount = 0;
    markerData.forEach((markerInfo, index) => {
      const { point, lat, lng, type } = markerInfo;
      
      hasValidPoints = true;
      if (bounds && bounds.extend) {
        bounds.extend([lat, lng]);
      }
      
      // Use green icon for attendance, red icon for departure
      let icon = type === 'attendance' ? checkInIcon : checkOutIcon;
      const typeLabel = type === 'attendance' ? 'Attendance' : 'Departure';
      const timeValue = type === 'attendance' ? point.timeIn : point.timeOut;
      const typeColor = type === 'attendance' ? '#4CAF50' : '#f44336';
      
      console.log(`Creating ${type} marker for ${point.employeeName} at ${lat}, ${lng}`);
      
      // Create popup content
      const popupContent = `
        <div style="min-width: ${popupWidth}; font-size: ${fontSize};">
          <h4 style="margin: 0 0 ${this.isMobile ? '3px' : '6px'} 0; color: #2c3e50; font-size: ${titleFontSize}; font-weight: 600;">${point.employeeName}</h4>
          <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: ${typeColor}; font-weight: bold; line-height: ${this.isMobile ? '1.2' : '1.3'};">
            <strong>${typeLabel}:</strong> ${timeValue ? new Date(timeValue).toLocaleString() : 'N/A'}
          </p>
          ${point.date ? `<p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
            <strong>Date:</strong> ${new Date(point.date).toLocaleDateString()}
          </p>` : ''}
          <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
            <strong>Dept:</strong> ${point.department || 'N/A'}
          </p>
          <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #495057; line-height: ${this.isMobile ? '1.2' : '1.3'};">
            <strong>Status:</strong> ${point.status || 'N/A'}
          </p>
          <p style="margin: ${this.isMobile ? '1px' : '3px'} 0; color: #6c757d; line-height: ${this.isMobile ? '1.2' : '1.3'}; font-size: ${this.isMobile ? '0.65rem' : '0.8rem'};">
            <strong>Location:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}
          </p>
          <small style="color: #6c757d; font-size: ${this.isMobile ? '0.6rem' : '0.8rem'};">ID: ${point.employeeId}</small>
        </div>
      `;
      
      // Create marker with custom icon
      const markerOptions: any = {};
      if (icon) {
        markerOptions.icon = icon;
      }
      
      const marker = L.marker([lat, lng], markerOptions)
        .bindPopup(popupContent);
      
      this.markers.addLayer(marker);
      markerCount++;
      console.log(`✅ Added ${type} marker ${markerCount} (${point.employeeName}) - ${typeColor}`);
    });

    // Focus map on attendance points if we have valid data
    // Always fit bounds to show all attendance markers when data is loaded
    if (hasValidPoints && bounds && bounds.isValid && bounds.isValid()) {
      console.log('Fitting bounds to attendance points to show all markers');
      // Use different padding for mobile vs desktop
      const padding = this.isMobile ? [30, 30] : [50, 50];
      
      // Use a small delay to ensure map is fully rendered
      setTimeout(() => {
        if (this.map && bounds.isValid()) {
          this.map.fitBounds(bounds, { 
            padding: padding,
            maxZoom: 18 // Don't zoom in too close
          });
          console.log('✅ Map bounds fitted to attendance points');
        }
      }, 200);
    } else if (hasValidPoints && markerData.length > 0) {
      console.log('Has valid points but bounds are invalid, using default view with first marker');
      // Set a default view if we have points but no bounds
      const firstMarker = markerData[0];
      const fallbackZoom = this.isMobile ? 15 : 13; // Zoom out more to show more area
      
      // Use a small delay to ensure map is fully rendered
      setTimeout(() => {
        if (this.map) {
          this.map.setView([firstMarker.lat, firstMarker.lng], fallbackZoom);
          console.log(`✅ Set default view to first marker (${firstMarker.type}) with zoom ${fallbackZoom}`);
        }
      }, 200);
    } else {
      console.log('No valid attendance points found');
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
