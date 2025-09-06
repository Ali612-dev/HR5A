import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { API_BASE_URL, API_ENDPOINTS } from './constants';
import { ApiResponse } from './interfaces/dashboard.interface';
import { EmployeeDto, GetEmployeesRequest, GetEmployeesResponseData, CreateEmployeeDto, UpdateEmployeeDto } from './interfaces/employee.interface';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClientService);

  constructor() { }

  getAllEmployees(request: GetEmployeesRequest): Observable<ApiResponse<GetEmployeesResponseData>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.EMPLOYEE}`;
    let params = new HttpParams();

    if (request.pageNumber !== undefined && request.pageNumber !== null) {
      params = params.append('pageNumber', request.pageNumber.toString());
    }
    if (request.pageSize !== undefined && request.pageSize !== null) {
      params = params.append('pageSize', request.pageSize.toString());
    }
    if (request.name !== undefined && request.name !== null && request.name !== '') {
      params = params.append('name', request.name);
    }
    if (request.phone !== undefined && request.phone !== null && request.phone !== '') {
      params = params.append('phone', request.phone);
    }
    if (request.department !== undefined && request.department !== null && request.department !== '') {
      params = params.append('department', request.department);
    }
    if (request.isActive !== undefined && request.isActive !== null) {
      params = params.append('isActive', request.isActive.toString());
    }
    if (request.sortField !== undefined && request.sortField !== null) {
      params = params.append('sortField', request.sortField);
    }
    if (request.sortOrder !== undefined && request.sortOrder !== null) {
      params = params.append('sortOrder', request.sortOrder);
    }

    console.log('EmployeeService: getAllEmployees URL:', url);
    console.log('EmployeeService: getAllEmployees Params:', params.toString());
    return this.http.get<ApiResponse<GetEmployeesResponseData>>(url, { params });
  }

  getEmployeeById(id: number): Observable<ApiResponse<EmployeeDto>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.EMPLOYEE}/${id}`;
    return this.http.get<ApiResponse<EmployeeDto>>(url);
  }

  createEmployee(employee: CreateEmployeeDto): Observable<ApiResponse<EmployeeDto>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.EMPLOYEE}`;
    return this.http.post<ApiResponse<EmployeeDto>>(url, employee);
  }

  updateEmployee(employee: EmployeeDto): Observable<ApiResponse<EmployeeDto>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.EMPLOYEE}/${employee.id}`;
    return this.http.put<ApiResponse<EmployeeDto>>(url, employee);
  }

  deleteEmployee(id: number): Observable<ApiResponse<any>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.EMPLOYEE}/${id}`;
    return this.http.delete<ApiResponse<any>>(url);
  }
}
