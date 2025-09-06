import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClientService } from './http-client.service';
import { API_BASE_URL, API_ENDPOINTS } from './constants';
import { AuthStore } from '../store/auth.store';
import { ApiResponse } from './interfaces/dashboard.interface'; // Re-using ApiResponse
import {RequestDto, GetRequestsDto, RequestStatus, LatestRequestsResponseData} from './interfaces/request.interface';
import { HttpParams } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private authStore = inject(AuthStore);

  constructor(private http: HttpClientService) { }

  getRequests(dto: GetRequestsDto): Observable<ApiResponse<LatestRequestsResponseData>> {
    this.authStore.setLoading(true);
    const url = `${API_BASE_URL}${API_ENDPOINTS.REQUESTS}`;

    let params = new HttpParams();
    if (dto.status) {
      let statusInt: number;
      switch (dto.status) {
        case RequestStatus.Pending:
          statusInt = 0;
          break;
        case RequestStatus.Approved:
          statusInt = 1;
          break;
        case RequestStatus.Rejected:
          statusInt = 2;
          break;
        default:
          statusInt = -1; // Should not happen with defined enum values
      }
      params = params.set('status', statusInt.toString());
    }
    if (dto.pageNumber) {
      params = params.set('pageNumber', dto.pageNumber.toString());
    }
    if (dto.pageSize) {
      params = params.set('pageSize', dto.pageSize.toString());
    }
    if (dto.sortField) {
      params = params.set('sortField', dto.sortField);
    }
    if (dto.sortOrder) {
      params = params.set('sortOrder', dto.sortOrder);
    }

    return this.http.get<ApiResponse<LatestRequestsResponseData>>(url, { params });
  }

  getLatestApprovedRequests(status: RequestStatus): Observable<ApiResponse<LatestRequestsResponseData>> {
    this.authStore.setLoading(true);
    const url = `${API_BASE_URL}${API_ENDPOINTS.LatestRequestsDashboard}`;

    let statusInt: number;
    switch (status) {
      case RequestStatus.Pending:
        statusInt = 0;
        break;
      case RequestStatus.Approved:
        statusInt = 1;
        break;
      case RequestStatus.Rejected:
        statusInt = 2;
        break;
      default:
        statusInt = -1; // Or throw an error for unknown status
    }

    const params = new HttpParams().set('status', statusInt.toString());

    return this.http.get<ApiResponse<LatestRequestsResponseData>>(url, { params }).pipe(
      tap(response => console.log('Latest approved requests API response:', response)),
      catchError(error => {
        console.error('Error fetching latest approved requests:', error);
        return throwError(() => error);
      })
    );
  }

        processRequest(requestId: number, status: RequestStatus, rejectionReason?: string): Observable<ApiResponse<any>> {
    this.authStore.setLoading(true);
    const url = `${API_BASE_URL}${API_ENDPOINTS.UPDATE_REQUEST_STATUS}`;

    let statusInt: number;
    switch (status) {
      case RequestStatus.Pending:
        statusInt = 0;
        break;
      case RequestStatus.Approved:
        statusInt = 1;
        break;
      case RequestStatus.Rejected:
        statusInt = 2;
        break;
      default:
        statusInt = -1; // Should not happen with defined enum values
    }

    const body: any = { requestId, status: statusInt };
    if (rejectionReason) {
      body.rejectionReason = rejectionReason;
    }

    return this.http.put<ApiResponse<any>>(url, body);
  }
}
