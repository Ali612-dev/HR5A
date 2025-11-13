import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faDollarSign,
  faUsers,
  faFileInvoice,
  faClock,
  faChartLine,
  faPlus,
  faEye,
  faEdit,
  faTrash,
  faCheck,
  faTimes,
  faCalendarAlt,
  faBuilding,
  faMoneyBillWave,
  faCalculator,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

import { FinancialService } from '../../../../core/services/financial.service';
import { FinancialStatsDto, WorkRuleDto, EmployeeSalaryDto, SalaryReportDto, CreateSalaryReportDto, WorkRuleType, ShiftDto } from '../../../../core/interfaces/financial.interface';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { catchError, of } from 'rxjs';
import { trigger, state, style, animate, transition, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TranslateModule,
    FontAwesomeModule,
    ShimmerComponent
  ],
  templateUrl: './financial-dashboard.component.html',
  styleUrls: ['./financial-dashboard.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerFadeInUp', [
      transition(':enter', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class FinancialDashboardComponent implements OnInit {
  private financialService = inject(FinancialService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  // FontAwesome Icons
  faArrowLeft = faArrowLeft;
  faArrowRight = faArrowRight;
  faDollarSign = faDollarSign;
  faUsers = faUsers;
  faFileInvoice = faFileInvoice;
  faClock = faClock;
  faChartLine = faChartLine;
  faPlus = faPlus;
  faEye = faEye;
  faEdit = faEdit;
  faTrash = faTrash;
  faCheck = faCheck;
  faTimes = faTimes;
  faCalendarAlt = faCalendarAlt;
  faBuilding = faBuilding;
  faMoneyBillWave = faMoneyBillWave;
  faCalculator = faCalculator;
  faSpinner = faSpinner;
  // Shifts icon - using faClock for now, or we can import a different one

  // Data properties
  financialStats: FinancialStatsDto | null = null;
  recentWorkRules: WorkRuleDto[] = [];
  recentSalaries: EmployeeSalaryDto[] = [];
  recentReports: SalaryReportDto[] = [];
  recentShifts: ShiftDto[] = [];
  
  // Loading states
  isLoadingStats = true;
  isLoadingWorkRules = true;
  isLoadingSalaries = true;
  isLoadingReports = true;
  isLoadingShifts = true;
  
  // Error states
  statsError: string | null = null;
  workRulesError: string | null = null;
  salariesError: string | null = null;
  reportsError: string | null = null;
  shiftsError: string | null = null;
  
  // Create Report Dialog
  showCreateReportDialog = false;
  selectedEmployee: EmployeeSalaryDto | null = null;
  creatingReport = false;
  
  createReportForm: {
    reportMonth: number | null;
    reportYear: number | null;
    notes: string;
  } = {
    reportMonth: null,
    reportYear: null,
    notes: ''
  };
  
  monthOptions: { value: number; label: string }[] = [];
  yearOptions: number[] = [];

  ngOnInit(): void {
    this.initializeOptions();
    this.loadDashboardData();
  }
  
  initializeOptions(): void {
    // Initialize month options
    this.monthOptions = this.financialService.getMonthOptions();
    
    // Initialize year options
    this.yearOptions = this.financialService.getYearOptions();
    
    // Set default values to current month and year
    const currentDate = new Date();
    this.createReportForm.reportMonth = currentDate.getMonth() + 1;
    this.createReportForm.reportYear = currentDate.getFullYear();
  }

  loadDashboardData(): void {
    this.loadFinancialStats();
    this.loadRecentWorkRules();
    this.loadRecentSalaries();
    this.loadRecentReports();
    this.loadRecentShifts();
  }

  loadFinancialStats(): void {
    this.isLoadingStats = true;
    this.statsError = null;

    this.financialService.getFinancialStats().pipe(
      catchError(err => {
        this.statsError = this.translate.instant('ERROR.FAILED_TO_LOAD_FINANCIAL_STATS');
        console.error('Error fetching financial stats:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess && response.data) {
        this.financialStats = response.data;
      } else if (!this.statsError) {
        this.statsError = response.message || this.translate.instant('ERROR.UNKNOWN_ERROR_FETCHING_FINANCIAL_STATS');
      }
      this.isLoadingStats = false;
    });
  }

  loadRecentWorkRules(): void {
    this.isLoadingWorkRules = true;
    this.workRulesError = null;

    this.financialService.getWorkRules({ pageNumber: 1, pageSize: 5 }).pipe(
      catchError(err => {
        this.workRulesError = this.translate.instant('ERROR.FAILED_TO_LOAD_WORK_RULES');
        console.error('Error fetching work rules:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess && response.data) {
        this.recentWorkRules = response.data.slice(0, 5);
      } else if (!this.workRulesError) {
        this.workRulesError = response.message || this.translate.instant('ERROR.UNKNOWN_ERROR_FETCHING_WORK_RULES');
      }
      this.isLoadingWorkRules = false;
    });
  }

  loadRecentSalaries(): void {
    this.isLoadingSalaries = true;
    this.salariesError = null;

    this.financialService.getEmployeeSalaries({ pageNumber: 1, pageSize: 5 }).pipe(
      catchError(err => {
        this.salariesError = this.translate.instant('ERROR.FAILED_TO_LOAD_EMPLOYEE_SALARIES');
        console.error('Error fetching employee salaries:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess && response.data) {
        // Handle the new paginated response structure
        if (response.data.items && Array.isArray(response.data.items)) {
          this.recentSalaries = response.data.items.slice(0, 5);
        } else if (Array.isArray(response.data)) {
          this.recentSalaries = response.data.slice(0, 5);
        } else {
          this.recentSalaries = [];
        }
      } else if (!this.salariesError) {
        this.salariesError = response.message || this.translate.instant('ERROR.UNKNOWN_ERROR_FETCHING_EMPLOYEE_SALARIES');
      }
      this.isLoadingSalaries = false;
    });
  }

  loadRecentReports(): void {
    this.isLoadingReports = true;
    this.reportsError = null;

    this.financialService.getSalaryReports({ pageNumber: 1, pageSize: 5 }).pipe(
      catchError(err => {
        this.reportsError = this.translate.instant('ERROR.FAILED_TO_LOAD_SALARY_REPORTS');
        console.error('Error fetching salary reports:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess && response.data) {
        this.recentReports = response.data.slice(0, 5);
      } else if (!this.reportsError) {
        this.reportsError = response.message || this.translate.instant('ERROR.UNKNOWN_ERROR_FETCHING_SALARY_REPORTS');
      }
      this.isLoadingReports = false;
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getSalaryTypeLabel(type: string | number): string {
    // Convert numeric salary types to string format
    let typeString = type;
    if (typeof type === 'number') {
      switch (type) {
        case 0: typeString = 'PerDay'; break;
        case 1: typeString = 'PerMonth'; break;
        case 2: typeString = 'PerHour'; break;
        case 3: typeString = 'Custom'; break;
        default: typeString = 'PerMonth';
      }
    }
    
    const typeMap: { [key: string]: string } = {
      'PerDay': 'Per Day',
      'PerMonth': 'Per Month',
      'PerHour': 'Per Hour',
      'Custom': 'Custom'
    };
    return typeMap[typeString as string] || typeString as string;
  }

  getWorkRuleTypeLabel(type: string | number | WorkRuleType): string {
    if (typeof type === 'number') {
      const types = ['Regular', 'Flexible', 'Shift'];
      return types[type] || type.toString();
    }
    if (typeof type === 'string') {
      const typeMap: { [key: string]: string } = {
        'Regular': 'Regular',
        'Flexible': 'Flexible',
        'Shift': 'Shift'
      };
      return typeMap[type] || type;
    }
    // Handle WorkRuleType enum - cast to string
    return String(type);
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }
  
  // Create Report Dialog Methods
  openCreateReportDialog(salary: EmployeeSalaryDto): void {
    this.selectedEmployee = salary;
    this.resetCreateReportForm();
    this.showCreateReportDialog = true;
  }
  
  closeCreateReportDialog(): void {
    this.showCreateReportDialog = false;
    this.selectedEmployee = null;
    this.creatingReport = false;
    this.resetCreateReportForm();
  }
  
  resetCreateReportForm(): void {
    const currentDate = new Date();
    this.createReportForm = {
      reportMonth: currentDate.getMonth() + 1,
      reportYear: currentDate.getFullYear(),
      notes: ''
    };
  }
  
  createSalaryReport(): void {
    if (!this.selectedEmployee || !this.createReportForm.reportMonth || !this.createReportForm.reportYear) {
      return;
    }
    
    this.creatingReport = true;
    
    // Check if employee has work rule assigned from the salary data
    if (!this.selectedEmployee.workRule) {
      // Employee doesn't have a work rule assigned
      this.creatingReport = false;
      this.showWorkRuleRequiredDialog();
      return;
    }
    
    // Employee has work rule, proceed with salary calculation
    this.proceedWithSalaryCalculation();
  }

  private proceedWithSalaryCalculation(): void {
    if (!this.selectedEmployee) return;

    const createReportDto: CreateSalaryReportDto = {
      employeeId: this.selectedEmployee.employeeId,
      reportMonth: this.createReportForm.reportMonth!,
      reportYear: this.createReportForm.reportYear!,
      notes: this.createReportForm.notes || undefined
    };
    
    console.log('🔄 FinancialDashboard: Creating salary report:', createReportDto);
    
    this.financialService.calculateSalary(createReportDto).subscribe({
      next: (response) => {
        this.creatingReport = false;
        if (response.isSuccess && response.data) {
          // Show success message
          const employeeName = this.selectedEmployee?.employeeName || `Employee #${this.selectedEmployee?.employeeId}`;
          const successMessage = this.translate.instant('ReportCreatedSuccessfully', { employeeName });
          console.log('✅ FinancialDashboard: Salary report created successfully:', response.data);
          
          // Close dialog
          this.closeCreateReportDialog();
          
          // Navigate to salary report details page
          const reportId = response.data.id;
          console.log('🔄 FinancialDashboard: Navigating to report details with ID:', reportId);
          this.router.navigate(['/admin/financial/salary-reports', reportId]);
        } else {
          const errorMessage = response.message || this.translate.instant('ReportCreationFailed', { 
            employeeName: this.selectedEmployee?.employeeName || `Employee #${this.selectedEmployee?.employeeId}` 
          });
          console.error('❌ FinancialDashboard: Failed to create salary report:', errorMessage);
          alert(errorMessage);
        }
      },
      error: (error) => {
        this.creatingReport = false;
        console.error('❌ FinancialDashboard: Error creating salary report:', error);
        const errorMessage = this.translate.instant('ReportCreationFailed', { 
          employeeName: this.selectedEmployee?.employeeName || `Employee #${this.selectedEmployee?.employeeId}` 
        });
        alert(errorMessage);
      }
    });
  }

  private showWorkRuleRequiredDialog(): void {
    const employeeName = this.selectedEmployee?.employeeName || `Employee #${this.selectedEmployee?.employeeId}`;
    const message = this.translate.instant('WorkRuleRequiredMessage', { employeeName });
    
    // Show a dialog or alert asking admin to assign work rule
    if (confirm(message + '\n\n' + this.translate.instant('AssignWorkRuleQuestion'))) {
      // Navigate to work rules page or employee management
      this.router.navigate(['/admin/financial/work-rules']);
    }
  }

  loadRecentShifts(): void {
    this.isLoadingShifts = true;
    this.shiftsError = null;

    this.financialService.getShifts().pipe(
      catchError(err => {
        this.shiftsError = this.translate.instant('ERROR.FAILED_TO_LOAD_SHIFTS');
        console.error('Error fetching shifts:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess && response.data) {
        this.recentShifts = response.data.slice(0, 5);
      } else if (!this.shiftsError) {
        this.shiftsError = response.message || this.translate.instant('ERROR.UNKNOWN_ERROR_FETCHING_SHIFTS');
      }
      this.isLoadingShifts = false;
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    // Convert "HH:mm:ss" to "HH:mm"
    return timeString.substring(0, 5);
  }
}
