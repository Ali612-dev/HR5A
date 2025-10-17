import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';

import {
  ApiResponse,
  WorkRuleDto,
  CreateWorkRuleDto,
  UpdateWorkRuleDto,
  EmployeeSalaryDto,
  EmployeeSalaryResponse,
  CreateEmployeeSalaryDto,
  UpdateEmployeeSalaryDto,
  SalaryReportDto,
  DetailedSalaryReportDto,
  CreateSalaryReportDto,
  BonusDto,
  CreateBonusDto,
  DeductionDto,
  CreateDeductionDto,
  FinancialStatsDto,
  FinancialRequest,
  FinancialResponse,
  AssignWorkRuleDto,
  WorkRuleDetailsDto
} from '../interfaces/financial.interface';

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private http = inject(HttpClient);
  private translate = inject(TranslateService);
  
  private readonly baseUrl = API_BASE_URL;

  private getHeaders(): HttpHeaders {
    const currentLang = this.translate.currentLang || 'en';
    const token = localStorage.getItem('authToken');
    let localeCode = 'en-US';
    
    switch (currentLang) {
      case 'en': localeCode = 'en-US'; break;
      case 'ar': localeCode = 'ar-SA'; break;
      case 'it': localeCode = 'it-IT'; break;
      default: localeCode = 'en-US';
    }

    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept-Language': localeCode
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private getHeadersWithoutAuth(): HttpHeaders {
    const currentLang = this.translate.currentLang || 'en';
    let localeCode = 'en-US';
    
    switch (currentLang) {
      case 'en': localeCode = 'en-US'; break;
      case 'ar': localeCode = 'ar-SA'; break;
      case 'it': localeCode = 'it-IT'; break;
      default: localeCode = 'en-US';
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept-Language': localeCode
    });
  }

  private buildParams(request?: FinancialRequest): HttpParams {
    let params = new HttpParams();
    
    if (request) {
      if (request.pageNumber) params = params.set('pageNumber', request.pageNumber.toString());
      if (request.pageSize) params = params.set('pageSize', request.pageSize.toString());
      if (request.sortField) params = params.set('sortField', request.sortField);
      if (request.sortOrder) params = params.set('sortOrder', request.sortOrder);
      if (request.searchTerm) params = params.set('employeeName', request.searchTerm);
      if (request.employeeId) params = params.set('employeeId', request.employeeId.toString());
      if (request.month) params = params.set('month', request.month.toString());
      if (request.year) params = params.set('year', request.year.toString());
      if (request.isPaid !== undefined) params = params.set('isPaid', request.isPaid.toString());
      if (request.startDate) params = params.set('startDate', request.startDate);
      if (request.endDate) params = params.set('endDate', request.endDate);
    }
    
    return params;
  }

  // ==================== WORK RULES ====================

  getWorkRules(request?: FinancialRequest): Observable<ApiResponse<WorkRuleDto[]>> {
    const params = this.buildParams(request);
    return this.http.get<ApiResponse<WorkRuleDto[]>>(`${this.baseUrl}${API_ENDPOINTS.WORK_RULES}`, {
      headers: this.getHeaders(),
      params
    });
  }

  getActiveWorkRules(): Observable<ApiResponse<WorkRuleDto[]>> {
    return this.http.get<ApiResponse<WorkRuleDto[]>>(`${this.baseUrl}${API_ENDPOINTS.WORK_RULES}/active`, {
      headers: this.getHeaders()
    });
  }

  getWorkRuleById(id: number): Observable<ApiResponse<WorkRuleDto>> {
    return this.http.get<ApiResponse<WorkRuleDto>>(`${this.baseUrl}${API_ENDPOINTS.WORK_RULES}/${id}`, {
      headers: this.getHeaders()
    });
  }

  getWorkRuleDetails(id: number): Observable<ApiResponse<WorkRuleDetailsDto>> {
    return this.http.get<ApiResponse<WorkRuleDetailsDto>>(`${this.baseUrl}${API_ENDPOINTS.WORK_RULES}/${id}/details`, {
      headers: this.getHeaders()
    });
  }

  createWorkRule(workRule: CreateWorkRuleDto): Observable<ApiResponse<WorkRuleDto>> {
    return this.http.post<ApiResponse<WorkRuleDto>>(`${this.baseUrl}${API_ENDPOINTS.WORK_RULES}`, workRule, {
      headers: this.getHeaders()
    });
  }

  updateWorkRule(id: number, workRule: UpdateWorkRuleDto): Observable<ApiResponse<WorkRuleDto>> {
    return this.http.put<ApiResponse<WorkRuleDto>>(`${this.baseUrl}${API_ENDPOINTS.WORK_RULES}/${id}`, workRule, {
      headers: this.getHeaders()
    });
  }

  deleteWorkRule(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}${API_ENDPOINTS.WORK_RULES}/${id}`, {
      headers: this.getHeaders()
    });
  }

  assignWorkRule(workRuleId: number, payload: AssignWorkRuleDto): Observable<ApiResponse<void>> {
    const url = `${this.baseUrl}${API_ENDPOINTS.WORK_RULES}/${workRuleId}/assign`;
    return this.http.post<ApiResponse<void>>(url, payload, {
      headers: this.getHeaders()
    });
  }

  unassignWorkRule(workRuleId: number, payload: AssignWorkRuleDto): Observable<ApiResponse<void>> {
    const url = `${this.baseUrl}${API_ENDPOINTS.WORK_RULES}/${workRuleId}/unassign`;
    return this.http.post<ApiResponse<void>>(url, payload, {
      headers: this.getHeaders()
    });
  }

  // ==================== EMPLOYEE SALARIES ====================

  getEmployeeSalaries(request?: FinancialRequest): Observable<ApiResponse<EmployeeSalaryResponse>> {
    const params = this.buildParams(request);
    console.log('🔄 FinancialService: getEmployeeSalaries called with params:', params);
    return this.http.get<ApiResponse<EmployeeSalaryResponse>>(`${this.baseUrl}${API_ENDPOINTS.EMPLOYEE_SALARIES}`, {
      headers: this.getHeadersWithoutAuth(),
      params
    });
  }

  getEmployeeSalaryByEmployeeId(employeeId: number): Observable<ApiResponse<EmployeeSalaryDto>> {
    return this.http.get<ApiResponse<EmployeeSalaryDto>>(`${this.baseUrl}${API_ENDPOINTS.EMPLOYEE_SALARIES}/employee/${employeeId}`, {
      headers: this.getHeaders()
    });
  }

  getEmployeeSalaryById(id: number): Observable<ApiResponse<EmployeeSalaryDto>> {
    return this.http.get<ApiResponse<EmployeeSalaryDto>>(`${this.baseUrl}${API_ENDPOINTS.EMPLOYEE_SALARIES}/${id}`, {
      headers: this.getHeaders()
    });
  }

  createEmployeeSalary(salary: CreateEmployeeSalaryDto): Observable<ApiResponse<EmployeeSalaryDto>> {
    return this.http.post<ApiResponse<EmployeeSalaryDto>>(`${this.baseUrl}${API_ENDPOINTS.EMPLOYEE_SALARIES}`, salary, {
      headers: this.getHeaders()
    });
  }

  updateEmployeeSalary(id: number, salary: UpdateEmployeeSalaryDto): Observable<ApiResponse<EmployeeSalaryDto>> {
    return this.http.put<ApiResponse<EmployeeSalaryDto>>(`${this.baseUrl}${API_ENDPOINTS.EMPLOYEE_SALARIES}/${id}`, salary, {
      headers: this.getHeaders()
    });
  }

  deleteEmployeeSalary(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}${API_ENDPOINTS.EMPLOYEE_SALARIES}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== SALARY REPORTS ====================

  getSalaryReports(request?: FinancialRequest): Observable<ApiResponse<SalaryReportDto[]>> {
    const params = this.buildParams(request);
    const fullUrl = `${this.baseUrl}${API_ENDPOINTS.SALARY_REPORTS}`;
    console.log('🌐 FinancialService: Making API call to:', fullUrl);
    console.log('🌐 FinancialService: With params:', params.toString());
    console.log('🌐 FinancialService: Full request object:', request);
    return this.http.get<ApiResponse<SalaryReportDto[]>>(fullUrl, {
      headers: this.getHeaders(),
      params
    });
  }

  getSalaryReportsByEmployee(employeeId: number): Observable<ApiResponse<SalaryReportDto[]>> {
    return this.http.get<ApiResponse<SalaryReportDto[]>>(`${this.baseUrl}/api/SalaryReport/employee/${employeeId}`, {
      headers: this.getHeaders()
    });
  }

  getSalaryReportsByMonth(month: number, year: number): Observable<ApiResponse<SalaryReportDto[]>> {
    return this.http.get<ApiResponse<SalaryReportDto[]>>(`${this.baseUrl}/api/SalaryReport/month/${month}/year/${year}`, {
      headers: this.getHeaders()
    });
  }

  getSalaryReportById(id: number): Observable<ApiResponse<SalaryReportDto>> {
    return this.http.get<ApiResponse<SalaryReportDto>>(`${this.baseUrl}/api/SalaryReport/${id}`, {
      headers: this.getHeaders()
    });
  }

  getDetailedSalaryReportById(id: number): Observable<ApiResponse<DetailedSalaryReportDto>> {
    return this.http.get<ApiResponse<DetailedSalaryReportDto>>(`${this.baseUrl}/api/SalaryReport/${id}/detailed`, {
      headers: this.getHeaders()
    });
  }

  createSalaryReport(report: CreateSalaryReportDto): Observable<ApiResponse<SalaryReportDto>> {
    return this.http.post<ApiResponse<SalaryReportDto>>(`${this.baseUrl}/api/SalaryReport`, report, {
      headers: this.getHeaders()
    });
  }

  calculateSalary(report: CreateSalaryReportDto): Observable<ApiResponse<SalaryReportDto>> {
    const url = `${this.baseUrl}/api/SalaryReport/calculate`;
    const headers = this.getHeaders();
    
    console.log('🔄 FinancialService: calculateSalary called with:', {
      url,
      report,
      headers: headers.keys()
    });
    
    return this.http.post<ApiResponse<SalaryReportDto>>(url, report, {
      headers
    });
  }

  markSalaryReportAsPaid(id: number): Observable<ApiResponse<SalaryReportDto>> {
    return this.http.post<ApiResponse<SalaryReportDto>>(`${this.baseUrl}/api/SalaryReport/${id}/mark-paid`, {}, {
      headers: this.getHeaders()
    });
  }

  deleteSalaryReport(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/api/SalaryReport/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== BONUSES ====================

  getBonuses(request?: FinancialRequest): Observable<ApiResponse<BonusDto[]>> {
    const params = this.buildParams(request);
    return this.http.get<ApiResponse<BonusDto[]>>(`${this.baseUrl}/Bonus`, {
      headers: this.getHeaders(),
      params
    });
  }

  getBonusesByEmployee(employeeId: number): Observable<ApiResponse<BonusDto[]>> {
    return this.http.get<ApiResponse<BonusDto[]>>(`${this.baseUrl}/Bonus/employee/${employeeId}`, {
      headers: this.getHeaders()
    });
  }

  getUnappliedBonuses(): Observable<ApiResponse<BonusDto[]>> {
    return this.http.get<ApiResponse<BonusDto[]>>(`${this.baseUrl}/Bonus/unapplied`, {
      headers: this.getHeaders()
    });
  }

  getBonusById(id: number): Observable<ApiResponse<BonusDto>> {
    return this.http.get<ApiResponse<BonusDto>>(`${this.baseUrl}/Bonus/${id}`, {
      headers: this.getHeaders()
    });
  }

  createBonus(bonus: CreateBonusDto): Observable<ApiResponse<BonusDto>> {
    return this.http.post<ApiResponse<BonusDto>>(`${this.baseUrl}/Bonus`, bonus, {
      headers: this.getHeaders()
    });
  }

  updateBonus(id: number, bonus: CreateBonusDto): Observable<ApiResponse<BonusDto>> {
    return this.http.put<ApiResponse<BonusDto>>(`${this.baseUrl}/Bonus/${id}`, bonus, {
      headers: this.getHeaders()
    });
  }

  deleteBonus(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/Bonus/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== DEDUCTIONS ====================

  getDeductions(request?: FinancialRequest): Observable<ApiResponse<DeductionDto[]>> {
    const params = this.buildParams(request);
    return this.http.get<ApiResponse<DeductionDto[]>>(`${this.baseUrl}/Deduction`, {
      headers: this.getHeaders(),
      params
    });
  }

  getDeductionsByEmployee(employeeId: number): Observable<ApiResponse<DeductionDto[]>> {
    return this.http.get<ApiResponse<DeductionDto[]>>(`${this.baseUrl}/Deduction/employee/${employeeId}`, {
      headers: this.getHeaders()
    });
  }

  getUnappliedDeductions(): Observable<ApiResponse<DeductionDto[]>> {
    return this.http.get<ApiResponse<DeductionDto[]>>(`${this.baseUrl}/Deduction/unapplied`, {
      headers: this.getHeaders()
    });
  }

  getDeductionById(id: number): Observable<ApiResponse<DeductionDto>> {
    return this.http.get<ApiResponse<DeductionDto>>(`${this.baseUrl}/Deduction/${id}`, {
      headers: this.getHeaders()
    });
  }

  createDeduction(deduction: CreateDeductionDto): Observable<ApiResponse<DeductionDto>> {
    return this.http.post<ApiResponse<DeductionDto>>(`${this.baseUrl}/Deduction`, deduction, {
      headers: this.getHeaders()
    });
  }

  updateDeduction(id: number, deduction: CreateDeductionDto): Observable<ApiResponse<DeductionDto>> {
    return this.http.put<ApiResponse<DeductionDto>>(`${this.baseUrl}/Deduction/${id}`, deduction, {
      headers: this.getHeaders()
    });
  }

  deleteDeduction(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/Deduction/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== FINANCIAL STATISTICS ====================

  getFinancialStats(): Observable<ApiResponse<FinancialStatsDto>> {
    return this.http.get<ApiResponse<FinancialStatsDto>>(`${this.baseUrl}${API_ENDPOINTS.FINANCIAL_STATS}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== UTILITY METHODS ====================

  getSalaryTypeOptions(): { value: string; label: string }[] {
    return [
      { value: 'PerDay', label: 'Per Day' },
      { value: 'PerMonth', label: 'Per Month' },
      { value: 'PerHour', label: 'Per Hour' },
      { value: 'Custom', label: 'Custom' }
    ];
  }

  getWorkRuleTypeOptions(): { value: string; label: string }[] {
    return [
      { value: 'Regular', label: this.translate.instant('WorkRuleType.Regular') },
      { value: 'Flexible', label: this.translate.instant('WorkRuleType.Flexible') },
      { value: 'Shift', label: this.translate.instant('WorkRuleType.Shift') }
    ];
  }

  getMonthOptions(): { value: number; label: string }[] {
    return [
      { value: 1, label: 'January' },
      { value: 2, label: 'February' },
      { value: 3, label: 'March' },
      { value: 4, label: 'April' },
      { value: 5, label: 'May' },
      { value: 6, label: 'June' },
      { value: 7, label: 'July' },
      { value: 8, label: 'August' },
      { value: 9, label: 'September' },
      { value: 10, label: 'October' },
      { value: 11, label: 'November' },
      { value: 12, label: 'December' }
    ];
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  getYearOptions(): number[] {
    const currentYear = this.getCurrentYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  }
}
