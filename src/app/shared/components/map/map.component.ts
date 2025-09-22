import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { Component, AfterViewInit, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { AttendanceViewModel } from '../../../core/interfaces/attendance.interface';

// Extend HTMLElement to include Leaflet ID
declare global {
  interface HTMLElement {
    _leaflet_id?: number;
  }
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private map: L.Map | null = null;
  private markers: L.MarkerClusterGroup | null = null;
  private isInitialized = false;

  @Input() attendancePoints: AttendanceViewModel[] = [];
  @Input() totalEmployees: number = 0;
  @Input() presentCount: number = 0;
  @Input() absentCount: number = 0;
  @Input() attendancePercent: number = 0;
  @Input() departmentStats: any[] = [];
  @Input() departments: string[] = [];
  uniqueEmployees: AttendanceViewModel[] = [];
  isSidePanelExpanded = false;

  constructor() { }

  ngAfterViewInit(): void {
    if (!this.isInitialized) {
      this.initMap();
      this.isInitialized = true;
    }
    this.addMarkers();
    this.updateUniqueEmployees();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attendancePoints'] && this.map) {
      this.addMarkers();
      this.updateUniqueEmployees();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markers = null;
      this.isInitialized = false;
    }
  }

  toggleSidePanel() {
    this.isSidePanelExpanded = !this.isSidePanelExpanded;
    const sidePanel = document.getElementById('sidePanel');
    if (sidePanel) {
      sidePanel.classList.toggle('expanded', this.isSidePanelExpanded);
    }
  }

  private initMap(): void {
    // Check if map container exists and is not already initialized
    const mapContainer = document.getElementById('map');
    if (!mapContainer || mapContainer._leaflet_id) {
      console.warn('Map container already initialized or not found');
      return;
    }

    this.map = L.map('map').setView([24.7136, 46.6753], 12); // Default to Riyadh

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.markers = L.markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function (cluster) {
        const childCount = cluster.getChildCount();
        let c = ' marker-cluster-';
        if (childCount < 10) {
          c += 'small';
        } else if (childCount < 100) {
          c += 'medium';
        } else {
          c += 'large';
        }
        return new L.DivIcon({
          html: '<div><span>' + childCount + '</span></div>',
          className: 'marker-cluster' + c,
          iconSize: new L.Point(40, 40)
        });
      }
    });

    this.map.addLayer(this.markers);

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 0);
  }

  private addMarkers(): void {
    if (!this.markers || !this.map) return;

    this.markers.clearLayers();

    this.attendancePoints.forEach(point => {
      if ((point.checkInLat && point.checkInLng) || (point.latitude && point.longitude)) {
        const checkInMarker = this.createMarker(point, 'check-in');
        if (this.markers) {
          this.markers.addLayer(checkInMarker);
        }
      }

      if ((point.checkOutLat && point.checkOutLng) || (point.outLatitude && point.outLongitude)) {
        const checkOutMarker = this.createMarker(point, 'check-out');
        if (this.markers) {
          this.markers.addLayer(checkOutMarker);
        }
      }
    });

    if (this.attendancePoints.length > 0 && this.markers.getLayers().length > 0 && this.map) {
      this.map.fitBounds(this.markers.getBounds(), { padding: [50, 50] });
    }
  }

  private createMarker(point: AttendanceViewModel, type: 'check-in' | 'check-out'): L.Marker {
    const lat = (type === 'check-in' ? point.checkInLat : point.checkOutLat) || (type === 'check-in' ? point.latitude : point.outLatitude);
    const lng = (type === 'check-in' ? point.checkInLng : point.checkOutLng) || (type === 'check-in' ? point.longitude : point.outLongitude);
    const time = type === 'check-in' ? point.timeIn : point.timeOut;

    const color = type === 'check-in' ? '#2ecc71' : '#e74c3c';
    const pulseColor = type === 'check-in' ? '#2ecc71' : '#e74c3c';
    const iconSvg = `
      <div class="marker-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="${color}" width="30" height="42"><path d="${(faMapMarkerAlt.icon as any)[4]}"/></svg>
        <div class="pulse-ring" style="border-color: ${pulseColor};"></div>
      </div>
    `;

    const icon = L.divIcon({
      html: iconSvg,
      className: 'custom-div-icon',
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    });

    const marker = L.marker([lat!, lng!], { icon, attribution: point.employeeId.toString() });

    marker.bindPopup(`
      <strong>${point.employeeName}</strong><br>
      <strong>Department:</strong> ${point.department || 'N/A'}<br>
      <strong>${type === 'check-in' ? 'Check-In' : 'Check-Out'}:</strong> ${new Date(time!).toLocaleString()}<br>
      <strong>Location:</strong> ${lat!.toFixed(6)}, ${lng!.toFixed(6)}
    `);

    return marker;
  }

  private updateUniqueEmployees(): void {
    const employeeMap = new Map<number, AttendanceViewModel>();
    this.attendancePoints.forEach(point => {
      if (!employeeMap.has(point.employeeId)) {
        employeeMap.set(point.employeeId, point);
      }
    });
    this.uniqueEmployees = Array.from(employeeMap.values());
  }

  focusOnEmployee(employee: AttendanceViewModel): void {
    if (employee.checkInLat && employee.checkInLng) {
      this.flyTo(employee.checkInLat, employee.checkInLng);
      this.highlightEmployeeMarker(employee.employeeId);
    }
  }

  public flyTo(lat: number, lng: number, zoom: number = 17): void {
    if (this.map) {
      this.map.flyTo([lat, lng], zoom, {
        duration: 1,
        easeLinearity: 0.25
      });
    }
  }

  public highlightEmployeeMarker(employeeId: number): void {
    if (!this.markers) return;
    
    this.markers.eachLayer(layer => {
      const marker = layer as L.Marker;
      if (marker.options.attribution === employeeId.toString()) {
        if ((marker as any)['_icon']) {
          // Reset all markers
          if (this.markers) {
            this.markers.eachLayer(l => {
              const m = l as L.Marker;
              if ((m as any)['_icon']) {
                (m as any)['_icon'].style.transform = '';
                (m as any)['_icon'].style.transition = 'transform 0.3s';
              }
            });
          }

          // Add bounce effect
          (marker as any)['_icon'].style.transform = 'translateY(-10px)';
          setTimeout(() => {
            if ((marker as any)['_icon']) {
              (marker as any)['_icon'].style.transform = '';
            }
          }, 1000);
        }
      }
    });
  }

  toggleFilterPanel(): void {
    const content = document.getElementById('filterContent');
    const icon = document.getElementById('filterToggleIcon');

    if (content && icon) {
      if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.remove('bi-chevron-left');
        icon.classList.add('bi-chevron-down');
      } else {
        content.style.display = 'none';
        icon.classList.remove('bi-chevron-down');
        icon.classList.add('bi-chevron-left');
      }
    }
  }
}