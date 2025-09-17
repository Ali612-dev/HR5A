import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMapMarkerAlt, faUsers, faBuilding, faCalendar, faSearch, faEye, faChevronDown, faChevronUp, faFilter } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClientService } from '../../../../core/http-client.service';
import { AttendanceStore } from '../../../../store/attendance.store';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import * as L from 'leaflet';
import 'leaflet.markercluster';

interface AttendancePoint {
  employeeId: number;
  employeeName: string;
  cardNumber: string;
  department: string;
  checkInLat: number;
  checkInLng: number;
  checkInTime: string;
  checkOutLat?: number;
  checkOutLng?: number;
  checkOutTime?: string;
}

interface AttendanceMapData {
  attendancePoints: AttendancePoint[];
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  departmentStats: { [key: string]: { totalCount: number; presentCount: number } };
  departments: string[];
}

@Component({
  selector: 'app-attendance-map',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FontAwesomeModule,
    ReactiveFormsModule
  ],
  templateUrl: './attendance-map.component.html',
  styleUrls: ['./attendance-map.component.css']
})
export class AttendanceMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();
  private translate = inject(TranslateService);
  private httpClient = inject(HttpClientService);
  private attendanceStore = inject(AttendanceStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
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

  // Map and data
  attendanceData: AttendanceMapData = {
    attendancePoints: [],
    totalEmployees: 0,
    presentCount: 0,
    absentCount: 0,
    departmentStats: {},
    departments: []
  };

  // Form
  filterForm: FormGroup;
  
  // UI State
  isMobile = false;
  isPanelExpanded = false;
  isFilterExpanded = true;
  isLoading = true;
  searchTerm = '';

  // Map Properties
  private map: L.Map | null = null;
  private markers: L.MarkerClusterGroup | null = null;

  constructor() {
    this.filterForm = this.fb.group({
      date: [new Date().toISOString().split('T')[0]],
      department: [''],
      employeeId: ['']
    });

    // Listen for attendance data changes
    effect(() => {
      const attendances = this.attendanceStore.attendances();
      if (attendances && attendances.length > 0 && this.markers) {
        this.transformAttendanceData(attendances);
        this.updateMapMarkers();
        this.isLoading = false;
      }
    });
  }

  ngOnInit(): void {
    this.checkMobileView();
    this.setupFormSubscriptions();
    // Data will be loaded after map initialization
  }

  ngAfterViewInit(): void {
    // Use setTimeout to ensure the view is fully rendered before initializing the map
    setTimeout(() => this.initializeMap(), 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up map
    if (this.map) {
      this.map.remove();
    }
  }

  private checkMobileView(): void {
    this.isMobile = window.innerWidth < 992;
  }

  private initializeMap(): void {
    const container = this.mapContainer.nativeElement;

    if (!container || container.offsetWidth === 0 || container.offsetHeight === 0) {
      // If the container is not ready, wait for the next animation frame
      requestAnimationFrame(() => this.initializeMap());
      return;
    }

    // Initialize map
    this.map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true // Use canvas rendering for better performance
    }).setView([24.7136, 46.6753], 12);

    // Add tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Create markers
    this.markers = L.markerClusterGroup();
    this.map.addLayer(this.markers);

    // Invalidate size to ensure map renders correctly
    this.map.invalidateSize();

    // Load data now that the map is ready
    this.loadAttendanceData();
  }

  private setupFormSubscriptions(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((formValue) => {
        // Update the store request with the new date if it changed
        if (formValue.date) {
          this.attendanceStore.updateRequest({ date: formValue.date });
        }
        // For other filters, just reload the data
        this.loadAttendanceData();
      });
  }

  loadAttendanceData(): void {
    this.isLoading = true;
    
    // Get attendance data from the store
    const attendances = this.attendanceStore.attendances();
    
    if (attendances && attendances.length > 0) {
      // Transform attendance data to map format
      this.transformAttendanceData(attendances);
      this.updateMapMarkers();
      this.isLoading = false;
    } else {
      // If no data in store, try to load it
      this.attendanceStore.loadDailyAttendances();
      
      // Listen for data changes
      this.attendanceStore.attendances().length > 0 ? 
        this.transformAttendanceData(this.attendanceStore.attendances()) : 
        this.isLoading = false;
    }
  }

  private transformAttendanceData(attendanceList: any[]): void {
    const formValue = this.filterForm.value;
    
    // Apply filters
    let filteredList = attendanceList;
    
    if (formValue.department) {
      filteredList = filteredList.filter(att => 
        att.department && att.department.toLowerCase().includes(formValue.department.toLowerCase())
      );
    }
    
    if (formValue.employeeId) {
      filteredList = filteredList.filter(att => 
        att.employeeId.toString().includes(formValue.employeeId) ||
        (att.employeeName && att.employeeName.toLowerCase().includes(formValue.employeeId.toLowerCase()))
      );
    }
    
    // Filter attendance records that have location data
    const attendanceWithLocation = filteredList.filter(att => 
      (att.latitude && att.longitude) || (att.outLatitude && att.outLongitude)
    );

    // Transform to map format
    const attendancePoints: AttendancePoint[] = attendanceWithLocation.map(att => ({
      employeeId: att.employeeId,
      employeeName: att.employeeName || `Employee ${att.employeeId}`,
      cardNumber: att.cardNumber || `CARD${att.employeeId}`,
      department: att.department || 'Unknown',
      checkInLat: att.latitude,
      checkInLng: att.longitude,
      checkInTime: att.checkInTime,
      checkOutLat: att.outLatitude,
      checkOutLng: att.outLongitude,
      checkOutTime: att.checkOutTime
    }));

    // Calculate statistics
    const totalEmployees = attendanceList.length;
    const presentCount = attendanceWithLocation.length;
    const absentCount = totalEmployees - presentCount;

    // Group by department
    const departmentStats: { [key: string]: { totalCount: number; presentCount: number } } = {};
    const departments = [...new Set(attendanceList.map(att => att.department).filter(Boolean))];

    departments.forEach(dept => {
      const deptAttendance = attendanceList.filter(att => att.department === dept);
      const deptPresent = deptAttendance.filter(att => 
        (att.latitude && att.longitude) || (att.outLatitude && att.outLongitude)
      );
      
      departmentStats[dept] = {
        totalCount: deptAttendance.length,
        presentCount: deptPresent.length
      };
    });

    this.attendanceData = {
      attendancePoints,
      totalEmployees,
      presentCount,
      absentCount,
      departmentStats,
      departments
    };

    // Update map markers
    this.updateMapMarkers();
  }

  private updateMapMarkers(): void {
    if (!this.markers || !this.attendanceData) return;

    // Clear existing markers
    this.markers.clearLayers();

    // Add markers for each attendance point
    this.attendanceData.attendancePoints.forEach(point => {
      // Add check-in marker if available
      if (point.checkInLat && point.checkInLng) {
        const checkInMarker = L.marker([point.checkInLat, point.checkInLng], {
          icon: L.divIcon({
            className: 'location-marker check-in',
            iconSize: [14, 14]
          })
        }).bindPopup(this.createPopupContent(point, 'checkin'));
        this.markers!.addLayer(checkInMarker);
      }

      // Add check-out marker if available
      if (point.checkOutLat && point.checkOutLng) {
        const checkOutMarker = L.marker([point.checkOutLat, point.checkOutLng], {
          icon: L.divIcon({
            className: 'location-marker check-out',
            iconSize: [14, 14]
          })
        }).bindPopup(this.createPopupContent(point, 'checkout'));
        this.markers!.addLayer(checkOutMarker);
      }
    });
  }

  private createPopupContent(point: AttendancePoint, type: 'checkin' | 'checkout'): string {
    const time = type === 'checkin' ? point.checkInTime : point.checkOutTime;
    const lat = type === 'checkin' ? point.checkInLat : point.checkOutLat;
    const lng = type === 'checkin' ? point.checkInLng : point.checkOutLng;
    const action = type === 'checkin' ? 'CheckIn' : 'CheckOut';

    return `
      <strong>${point.employeeName}</strong><br>
      <strong>${this.translate.instant('ID')}:</strong> ${point.employeeId}<br>
      <strong>${this.translate.instant('Card')}:</strong> ${point.cardNumber}<br>
      <strong>${this.translate.instant('Department')}:</strong> ${point.department || this.translate.instant('NA')}<br>
      <strong>${this.translate.instant(action)}:</strong> ${time ? new Date(time).toLocaleString() : 'N/A'}<br>
      <strong>${this.translate.instant('Location')}:</strong> ${lat?.toFixed(6)}, ${lng?.toFixed(6)}
    `;
  }

  togglePanel(): void {
    if (this.isMobile) {
      this.isPanelExpanded = !this.isPanelExpanded;
    }
  }

  toggleFilter(): void {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  focusOnEmployee(employeeId: number): void {
    const point = this.attendanceData.attendancePoints.find(p => p.employeeId === employeeId);
    if (point && point.checkInLat && point.checkInLng && this.map) {
      this.map.flyTo([point.checkInLat, point.checkInLng], 17, {
        duration: 1,
        easeLinearity: 0.25
      });
      this.highlightEmployeeMarker(employeeId);
    }
  }

  private highlightEmployeeMarker(employeeId: number): void {
    if (!this.markers) return;

    // Reset all markers
    this.markers.eachLayer((layer: any) => {
      if (layer._icon) {
        layer._icon.style.transform = '';
        layer._icon.style.transition = 'transform 0.3s';
      }
    });

    // Find and highlight the selected marker
    let selectedMarker: any = null;
    this.markers.eachLayer((layer: any) => {
      if (layer.options && layer.options.employeeId == employeeId) {
        selectedMarker = layer;
      }
    });

    if (selectedMarker && selectedMarker._icon) {
      selectedMarker._icon.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (selectedMarker._icon) {
          selectedMarker._icon.style.transform = '';
        }
      }, 1000);
    }
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm.toLowerCase();
  }

  get filteredEmployees(): AttendancePoint[] {
    if (!this.searchTerm) {
      return this.attendanceData.attendancePoints;
    }
    
    return this.attendanceData.attendancePoints.filter(point =>
      point.employeeName.toLowerCase().includes(this.searchTerm) ||
      point.department?.toLowerCase().includes(this.searchTerm) ||
      point.cardNumber.includes(this.searchTerm)
    );
  }

  get uniqueEmployees(): AttendancePoint[] {
    const unique = new Map<number, AttendancePoint>();
    this.filteredEmployees.forEach(point => {
      if (!unique.has(point.employeeId)) {
        unique.set(point.employeeId, point);
      }
    });
    return Array.from(unique.values());
  }

  get attendancePercentage(): number {
    return this.attendanceData.totalEmployees > 0 
      ? Math.round((this.attendanceData.presentCount * 100) / this.attendanceData.totalEmployees)
      : 0;
  }

  goToAttendanceTable(): void {
    const formValue = this.filterForm.value;
    const queryParams: any = {};
    
    if (formValue.date) queryParams.date = formValue.date;
    if (formValue.department) queryParams.department = formValue.department;
    if (formValue.employeeId) queryParams.employeeId = formValue.employeeId;

    this.router.navigate(['/attendance'], { queryParams });
  }

  goBack(): void {
    this.router.navigate(['/attendance']);
  }

  getDepartmentPercentage(dept: string): number {
    const stats = this.attendanceData.departmentStats[dept];
    return stats ? Math.round((stats.presentCount * 100) / stats.totalCount) : 0;
  }

  getDepartmentProgressWidth(dept: string): string {
    return `${this.getDepartmentPercentage(dept)}%`;
  }
}