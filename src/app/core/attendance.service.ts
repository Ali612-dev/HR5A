import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { API_BASE_URL, API_ENDPOINTS } from './constants';
import { ApiResponse } from './interfaces/dashboard.interface';
import { HttpParams } from '@angular/common/http';
import {
  AddAttendanceDto,
  AttendanceViewModel,
  GetDailyAttendanceDto,
  GetEmployeeAttendanceHistoryDto,
  PaginatedAttendanceResponseDto,
  PaginatedEmployeeAttendanceHistoryResponseDto,
  UpdateAttendanceDto,
  MonthlyWorkedHoursResponse
} from './interfaces/attendance.interface';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClientService);

  constructor() { }

  getDailyAttendance(request: GetDailyAttendanceDto): Observable<ApiResponse<PaginatedAttendanceResponseDto>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.DailyGroupedAttendances}`;
    let params = new HttpParams();

    if (request.date) {
      params = params.append('date', request.date);
    }
    if (request.searchName) {
      params = params.append('SearchName', request.searchName);
    }
    if (request.pageNumber !== undefined && request.pageNumber !== null) {
      params = params.append('pageNumber', request.pageNumber.toString());
    }
    if (request.pageSize !== undefined && request.pageSize !== null) {
      params = params.append('pageSize', request.pageSize.toString());
    }
    if (request.sortField) {
      params = params.append('sortField', request.sortField);
    }
    if (request.sortOrder) {
      params = params.append('sortOrder', request.sortOrder);
    }

    return this.http.get<ApiResponse<PaginatedAttendanceResponseDto>>(url, { params });
  }

  getEmployeeAttendanceHistory(request: GetEmployeeAttendanceHistoryDto): Observable<ApiResponse<PaginatedEmployeeAttendanceHistoryResponseDto>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.EmployeeAttendanceHistory}`;
    let params = new HttpParams();

    params = params.append('employeeId', request.employeeId.toString());
    if (request.startDate) {
      params = params.append('startDate', request.startDate);
    }
    if (request.endDate) {
      params = params.append('endDate', request.endDate);
    }
    if (request.pageNumber !== undefined && request.pageNumber !== null) {
      params = params.append('pageNumber', request.pageNumber.toString());
    }
    if (request.pageSize !== undefined && request.pageSize !== null) {
      params = params.append('pageSize', request.pageSize.toString());
    }
    if (request.sortField) {
      params = params.append('sortField', request.sortField);
    }
    if (request.sortOrder) {
      params = params.append('sortOrder', request.sortOrder);
    }

    return this.http.get<ApiResponse<PaginatedEmployeeAttendanceHistoryResponseDto>>(url, { params });
  }

  getAttendanceById(id: number): Observable<ApiResponse<AttendanceViewModel>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.UpdateEmployeeAttendance}/${id}`;
    return this.http.get<ApiResponse<AttendanceViewModel>>(url);
  }

  addAttendance(attendance: AddAttendanceDto): Observable<ApiResponse<AttendanceViewModel>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.AddEmployeeAttendance}`;
    return this.http.post<ApiResponse<AttendanceViewModel>>(url, attendance);
  }

  updateAttendance(attendance: UpdateAttendanceDto): Observable<ApiResponse<AttendanceViewModel>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.UpdateEmployeeAttendance}`;
    return this.http.put<ApiResponse<AttendanceViewModel>>(url, attendance);
  }

  deleteAttendance(id: number): Observable<ApiResponse<any>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.DeleteEmployeeAttendance}/${id}`;
    return this.http.delete<ApiResponse<any>>(url);
  }

  getMonthlyWorkedHours(employeeId: number): Observable<ApiResponse<MonthlyWorkedHoursResponse>> {
    const url = `${API_BASE_URL}/api/Attendance/monthly-worked-hours/${employeeId}`;
    return this.http.get<ApiResponse<MonthlyWorkedHoursResponse>>(url);
  }
}
