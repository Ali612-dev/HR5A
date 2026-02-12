import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Chart, registerables } from 'chart.js';
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

Chart.register(...registerables);

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TranslateModule,
    FontAwesomeModule
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
export class FinancialDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('workRulesChart') workRulesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salaryReportsChart') salaryReportsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('employeeSalariesChart') employeeSalariesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyTrendsChart') monthlyTrendsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salaryDistributionChart') salaryDistributionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('reportsStatusChart') reportsStatusChartRef!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];
  private financialService = inject(FinancialService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

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
    fromDate: string;
    toDate: string;
    notes: string;
  } = {
      reportMonth: null,
      reportYear: null,
      fromDate: '',
      toDate: '',
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
      // Reinitialize charts after data is loaded
      setTimeout(() => {
        this.initializeCharts();
      }, 300);
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
      currency: 'EUR'
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
    // Reinitialize charts after refresh
    setTimeout(() => {
      this.initializeCharts();
    }, 500);
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
      fromDate: '',
      toDate: '',
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
      fromDate: this.createReportForm.fromDate ? new Date(this.createReportForm.fromDate).toISOString() : undefined,
      toDate: this.createReportForm.toDate ? new Date(this.createReportForm.toDate).toISOString() : undefined,
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

  ngAfterViewInit(): void {
    // Wait for view to be fully initialized
    this.cdr.detectChanges();
    // Try multiple times to ensure canvas elements are ready
    let attempts = 0;
    const maxAttempts = 10;
    const tryInit = () => {
      attempts++;
      if (this.workRulesChartRef?.nativeElement &&
        this.salaryReportsChartRef?.nativeElement &&
        this.employeeSalariesChartRef?.nativeElement &&
        this.monthlyTrendsChartRef?.nativeElement &&
        this.salaryDistributionChartRef?.nativeElement &&
        this.reportsStatusChartRef?.nativeElement) {
        this.initializeCharts();
      } else if (attempts < maxAttempts) {
        setTimeout(tryInit, 150);
      } else {
        console.warn('Charts initialization failed after multiple attempts');
        // Try to initialize anyway with available charts
        this.initializeCharts();
      }
    };
    setTimeout(tryInit, 500);
  }

  initializeCharts(): void {
    // Destroy existing charts first
    this.charts.forEach(chart => {
      try {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      } catch (e) {
        console.warn('Error destroying chart:', e);
      }
    });
    this.charts = [];

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Initialize all charts
      this.createWorkRulesChart();
      this.createSalaryReportsChart();
      this.createEmployeeSalariesChart();
      this.createMonthlyTrendsChart();
      this.createSalaryDistributionChart();
      this.createReportsStatusChart();
    });
  }

  createWorkRulesChart(): void {
    if (!this.workRulesChartRef?.nativeElement) {
      console.warn('Work Rules Chart canvas not found');
      return;
    }

    // Check if chart already exists on this canvas
    const existingChart = Chart.getChart(this.workRulesChartRef.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }

    const ctx = this.workRulesChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2d context for Work Rules Chart');
      return;
    }

    try {
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: this.translate.instant('WorkRules'),
            data: [12, 19, 15, 25, 22, 30],
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      this.charts.push(chart);
    } catch (error) {
      console.error('Error creating Work Rules Chart:', error);
    }
  }

  createSalaryReportsChart(): void {
    if (!this.salaryReportsChartRef?.nativeElement) {
      console.warn('Salary Reports Chart canvas not found');
      return;
    }

    // Check if chart already exists on this canvas
    const existingChart = Chart.getChart(this.salaryReportsChartRef.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }

    const ctx = this.salaryReportsChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2d context for Salary Reports Chart');
      return;
    }

    try {
      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [
            this.translate.instant('New'),
            this.translate.instant('InProgress'),
            this.translate.instant('Completed'),
            this.translate.instant('Cancelled')
          ],
          datasets: [{
            data: [15, 20, 45, 5],
            backgroundColor: [
              '#f97316',
              '#ea580c',
              '#fb923c',
              '#fdba74'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'left'
            }
          }
        }
      });
      this.charts.push(chart);
    } catch (error) {
      console.error('Error creating Salary Reports Chart:', error);
    }
  }

  createEmployeeSalariesChart(): void {
    if (!this.employeeSalariesChartRef?.nativeElement) {
      console.warn('Employee Salaries Chart canvas not found');
      return;
    }

    // Check if chart already exists on this canvas
    const existingChart = Chart.getChart(this.employeeSalariesChartRef.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }

    const ctx = this.employeeSalariesChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2d context for Employee Salaries Chart');
      return;
    }

    try {
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Dept A', 'Dept B', 'Dept C', 'Dept D', 'Dept E', 'Dept F'],
          datasets: [{
            label: this.translate.instant('EmployeeSalaries'),
            data: [450, 520, 480, 600, 550, 580],
            backgroundColor: [
              '#f97316',
              '#ea580c',
              '#fb923c',
              '#fdba74',
              '#fed7aa',
              '#ffedd5'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      this.charts.push(chart);
    } catch (error) {
      console.error('Error creating Employee Salaries Chart:', error);
    }
  }

  createMonthlyTrendsChart(): void {
    if (!this.monthlyTrendsChartRef?.nativeElement) {
      console.warn('Monthly Trends Chart canvas not found');
      return;
    }

    // Check if chart already exists on this canvas
    const existingChart = Chart.getChart(this.monthlyTrendsChartRef.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }

    const ctx = this.monthlyTrendsChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2d context for Monthly Trends Chart');
      return;
    }

    try {
      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [
            this.translate.instant('Review'),
            this.translate.instant('InProcess'),
            this.translate.instant('Completed')
          ],
          datasets: [{
            data: [30, 50, 20],
            backgroundColor: [
              '#f97316',
              '#ea580c',
              '#fb923c'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
      this.charts.push(chart);
    } catch (error) {
      console.error('Error creating Monthly Trends Chart:', error);
    }
  }

  createSalaryDistributionChart(): void {
    if (!this.salaryDistributionChartRef?.nativeElement) {
      console.warn('Salary Distribution Chart canvas not found');
      return;
    }

    // Check if chart already exists on this canvas
    const existingChart = Chart.getChart(this.salaryDistributionChartRef.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }

    const ctx = this.salaryDistributionChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2d context for Salary Distribution Chart');
      return;
    }

    try {
      const chart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: [
            this.translate.instant('PerDay'),
            this.translate.instant('PerMonth'),
            this.translate.instant('PerHour'),
            this.translate.instant('Custom'),
            this.translate.instant('Other')
          ],
          datasets: [{
            label: this.translate.instant('Distribution'),
            data: [65, 80, 70, 60, 75],
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
            borderColor: '#f97316',
            borderWidth: 2,
            pointBackgroundColor: '#f97316',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ea580c',
            pointHoverBorderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            r: {
              beginAtZero: true
            }
          }
        }
      });
      this.charts.push(chart);
    } catch (error) {
      console.error('Error creating Salary Distribution Chart:', error);
    }
  }

  createReportsStatusChart(): void {
    if (!this.reportsStatusChartRef?.nativeElement) {
      console.warn('Reports Status Chart canvas not found');
      return;
    }

    // Check if chart already exists on this canvas
    const existingChart = Chart.getChart(this.reportsStatusChartRef.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }

    const ctx = this.reportsStatusChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2d context for Reports Status Chart');
      return;
    }

    try {
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [
            this.translate.instant('Registered'),
            this.translate.instant('FromMinistry'),
            this.translate.instant('Returned'),
            this.translate.instant('Other')
          ],
          datasets: [{
            label: this.translate.instant('SalaryReports'),
            data: [1200, 800, 600, 250],
            backgroundColor: [
              '#f97316',
              '#ea580c',
              '#fb923c',
              '#fdba74'
            ]
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              beginAtZero: true
            }
          }
        }
      });
      this.charts.push(chart);
    } catch (error) {
      console.error('Error creating Reports Status Chart:', error);
    }
  }

  ngOnDestroy(): void {
    // Destroy all charts on component destroy
    this.charts.forEach(chart => chart.destroy());
  }
}
