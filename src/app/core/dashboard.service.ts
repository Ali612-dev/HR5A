import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '../core/http-client.service';
import { API_BASE_URL, API_ENDPOINTS } from '../core/constants';
import { AuthStore } from '../store/auth.store';
import { ApiResponse, DashboardStatsResponseData } from '../core/interfaces/dashboard.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private authStore = inject(AuthStore);

  constructor(private http: HttpClientService) { }

  getDashboardStats(): Observable<ApiResponse<DashboardStatsResponseData>> {
    this.authStore.setLoading(true);
    const url = `${API_BASE_URL}${API_ENDPOINTS.DASHBOARD_STATS}`;
    return this.http.get<ApiResponse<DashboardStatsResponseData>>(url);
  }
}
