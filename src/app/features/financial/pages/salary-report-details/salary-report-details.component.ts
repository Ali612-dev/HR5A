import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faFileInvoice, faDownload, faPrint, faCheckCircle, faTimesCircle, faExclamationTriangle, faClock, faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import { FinancialService } from '../../../../core/services/financial.service';
import { DetailedSalaryReportDto, DailyDetailDto } from '../../../../core/interfaces/financial.interface';

interface DailyReportRow {
  date: string;
  dayName: string;
  attendanceAt: string;
  departureAt: string;
  workHours: string;
  hourlyRate: number;
  dailySalary: number;
  timeInDate?: string;
  timeOutDate?: string;
  isMultipleDates?: boolean;
}

@Component({
  selector: 'app-salary-report-details',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, FontAwesomeModule],
  template: `
    <div class="report-details-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button class="btn btn-ghost" (click)="goBack()">
            <fa-icon [icon]="faArrowLeft" class="me-2"></fa-icon>
            {{ 'Back' | translate }}
          </button>
          <div class="page-title">
            <fa-icon [icon]="faFileInvoice" class="me-2"></fa-icon>
            {{ 'SalaryReportDetails' | translate }}
          </div>
        </div>
        <div class="header-actions" *ngIf="report">
          <button 
            class="btn btn-ghost btn-pay" 
            (click)="markReportAsPaid()"
            *ngIf="!report.isPaid"
            [disabled]="isProcessingPayment">
            <fa-icon [icon]="faCheckCircle" class="me-2"></fa-icon>
            <span *ngIf="!isProcessingPayment">{{ 'PayThisReport' | translate }}</span>
            <span *ngIf="isProcessingPayment">{{ 'Processing' | translate }}...</span>
          </button>
          <button class="btn btn-ghost" (click)="downloadReport()">
            <fa-icon [icon]="faDownload" class="me-2"></fa-icon>
            {{ 'Download' | translate }}
          </button>
          <button class="btn btn-ghost" (click)="printReport()">
            <fa-icon [icon]="faPrint" class="me-2"></fa-icon>
            {{ 'Print' | translate }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'Loading' | translate }}...</span>
        </div>
        <p class="mt-3 text-muted">{{ 'LoadingReportDetails' | translate }}...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !isLoading" class="error-container">
        <div class="glass-card error-card">
          <div class="card-body text-center">
            <fa-icon [icon]="faTimesCircle" class="display-1 text-danger mb-3"></fa-icon>
            <h4 class="text-white mb-3">{{ 'Error' | translate }}</h4>
            <p class="text-muted mb-4">{{ getErrorMessage(error) }}</p>
            <button class="btn btn-primary" (click)="loadReportDetails()">
              {{ 'Retry' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Report Table -->
      <div *ngIf="report && !isLoading && !error" class="report-content">
        <!-- New Design: One Card with a Table -->
        <div class="glass-card table-card">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table report-table mb-0">
                <thead>
                  <tr>
                    <th>{{ 'Date' | translate }}</th>
                    <th>{{ 'Day' | translate }}</th>
                    <th>{{ 'AttendanceAt' | translate }}</th>
                    <th>{{ 'DepartureAt' | translate }}</th>
                    <th>{{ 'WorkHours' | translate }}</th>
                    <th>{{ 'HourlyRate' | translate }}</th>
                    <th class="text-end">{{ 'Salary' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of dailyRows">
                    <td>
                      <div *ngIf="!isMultipleDates(row.attendanceAt, row.departureAt)">
                        {{ row.date }}
                      </div>
                      <div *ngIf="isMultipleDates(row.attendanceAt, row.departureAt)" style="line-height: 1.5;">
                        <div style="font-size: 0.9em; margin-bottom: 4px; white-space: nowrap;">
                          <span style="color: #666; font-weight: 500;">{{ 'Attendance' | translate }}:</span> {{ formatDateOnly(row.attendanceAt) }}
                        </div>
                        <div style="font-size: 0.9em; white-space: nowrap;">
                          <span style="color: #666; font-weight: 500;">{{ 'Departure' | translate }}:</span> {{ formatDateOnly(row.departureAt) }}
                        </div>
                      </div>
                    </td>
                    <td>{{ row.dayName }}</td>
                    <td dir="ltr" class="text-start">{{ formatTimeOnly(row.attendanceAt) }}</td>
                    <td dir="ltr" class="text-start">{{ formatTimeOnly(row.departureAt) }}</td>
                    <td dir="ltr" class="text-start">{{ row.workHours }}</td>
                    <td class="text-end">{{ row.hourlyRate ? formatCurrency(row.hourlyRate) : '-' }}</td>
                    <td class="text-end font-weight-bold">{{ formatCurrency(row.dailySalary) }}</td>
                  </tr>
                </tbody>
                <!-- Footer with Totals -->
                <tfoot>
                  <tr class="total-row">
                    <td colspan="4" class="text-end font-weight-bold">{{ 'Total' | translate }}</td>
                    <td dir="ltr" class="text-start font-weight-bold">{{ formatHoursToTime(report.totalWorkedHours) }}</td>
                    <td></td>
                    <td class="text-end font-weight-bold highlight-value">{{ formatCurrency(report.netCalculatedSalary) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .report-details-container {
      min-height: 100vh;
      background: #f8fafc; /* Lighter background as requested */
      padding: 2rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .glass-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); /* Softer shadow */
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
    }

    .report-table th {
      background-color: #f8fafc;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.85rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      text-align: inherit; /* Respect RTL/LTR */
    }

    .report-table td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      vertical-align: middle;
      font-size: 0.95rem;
    }

    .report-table tr:hover td {
      background-color: #f8fafc;
    }
    
    .report-table tr:last-child td {
      border-bottom: none;
    }

    .report-table tfoot .total-row td {
      background-color: #f1f5f9;
      border-top: 2px solid #e2e8f0;
      font-size: 1.1rem;
      color: #0f172a;
    }

    .highlight-value {
      color: #0d9488; /* Teal color for money */
    }

    /* Buttons */
    .btn-ghost {
      background: white;
      border: 1px solid #cbd5e1;
      color: #475569;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-ghost:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      color: #1e293b;
    }
    
    .btn-ghost.btn-pay {
       color: #059669;
       border-color: #10b981;
       background-color: rgba(16, 185, 129, 0.05);
    }
    
    .btn-ghost.btn-pay:hover {
       background-color: rgba(16, 185, 129, 0.1);
    }
    
    .loading-container, .error-container {
        text-align: center; 
        padding: 3rem;
    }

    /* Fix date column cropping for multi-day attendance */
    .report-table td:first-child {
      min-width: 160px;
      white-space: normal;
      overflow: visible;
      vertical-align: middle;
    }

    .report-table tr {
      min-height: 60px;
    }

    @media print {
      .report-details-container {
        padding: 0;
        min-height: auto;
        background: white;
      }
      
      .page-header button, 
      .header-actions {
        display: none !important;
      }
      
      .glass-card {
        box-shadow: none;
        border: none;
        overflow: visible !important;
      }
      
      .table-responsive {
        overflow: visible !important;
      }
      
      .report-table th {
        background-color: #f8fafc !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .report-table tr {
        page-break-inside: avoid;
      }
      
      /* Ensure total row sticks together if possible, or just standard row behavior */
      .report-table tfoot tr {
        page-break-inside: avoid;
      }
    }
  `]
})
export class SalaryReportDetailsComponent implements OnInit {
  // Icons
  faArrowLeft = faArrowLeft;
  faFileInvoice = faFileInvoice;
  faDownload = faDownload;
  faPrint = faPrint;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faExclamationTriangle = faExclamationTriangle;
  faClock = faClock;
  faMoneyBill = faMoneyBill;

  // Data
  report: DetailedSalaryReportDto | null = null;
  dailyRows: DailyReportRow[] = [];

  isLoading = false;
  isProcessingPayment = false;
  error: string | null = null;
  successMessage: string | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private financialService = inject(FinancialService);
  private translate = inject(TranslateService);

  get reportId(): number {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? +id : 0;
  }

  ngOnInit(): void {
    if (this.reportId) {
      this.loadReportDetails();
    } else {
      this.goBack();
    }
  }

  loadReportDetails(): void {
    this.isLoading = true;
    this.error = null;

    this.financialService.getDetailedSalaryReportById(this.reportId).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.report = response.data;
          this.generateDailyRows();
        } else {
          this.error = response.message || 'ERROR.FAILED_TO_LOAD_REPORT';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'ERROR.FAILED_TO_LOAD_REPORT';
        console.error('Error loading report:', err);
        this.isLoading = false;
      }
    });
  }

  generateDailyRows(): void {
    if (!this.report) return;

    this.dailyRows = [];

    // Use dailyDetails from backend if available
    if (this.report.dailyDetails && this.report.dailyDetails.length > 0) {
      this.dailyRows = this.report.dailyDetails.map(detail => ({
        date: detail.date.split('T')[0], // Extract YYYY-MM-DD from ISO datetime
        dayName: detail.dayNameAr,
        attendanceAt: detail.timeIn,
        departureAt: detail.timeOut,
        workHours: this.formatHoursToTime(detail.workedHours),
        hourlyRate: detail.hourlyRate,
        dailySalary: detail.dailySalary
      }));
      return; // Exit early after mapping backend data
    }

    // Fallback: If backend doesn't provide dailyDetails, show warning
    console.warn('No daily details provided by backend');
  }

  markReportAsPaid(): void {
    if (!this.report) return;

    this.isProcessingPayment = true;
    this.financialService.markSalaryReportAsPaid(this.report.id).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.report = { ...this.report, ...response.data } as DetailedSalaryReportDto; // Update local report data keeping missing detailed fields
          this.successMessage = 'SUCCESS.REPORT_MARKED_AS_PAID';

          // Auto-hide success message after 5 seconds
          setTimeout(() => this.successMessage = null, 5000);
        } else {
          console.error('Failed to mark as paid');
        }
        this.isProcessingPayment = false;
      },
      error: (err) => {
        console.error('Error marking report as paid:', err);
        this.isProcessingPayment = false;
      }
    });
  }

  clearSuccessMessage(): void {
    this.successMessage = null;
  }

  downloadReport(): void {
    // Logic for PDF download
    console.log('Download report');
  }

  printReport(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/admin/financial/salary-reports']);
  }

  getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    return 'ERROR.UNKNOWN';
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '0.00';
    return new Intl.NumberFormat(this.translate.currentLang, { style: 'currency', currency: 'EUR' }).format(amount);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(this.translate.currentLang);
  }

  formatHoursToTime(hours: number): string {
    if (hours === undefined || hours === null || hours === 0) return '0:00';
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
  }

  isMultipleDates(timeIn: string, timeOut: string): boolean {
    if (!timeIn || !timeOut) return false;
    const timeInDate = new Date(timeIn);
    const timeOutDate = new Date(timeOut);
    return timeInDate.toDateString() !== timeOutDate.toDateString();
  }

  formatDateOnly(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatTimeOnly(dateTimeStr: string): string {
    if (!dateTimeStr) return '-';
    const date = new Date(dateTimeStr);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = hours.toString().padStart(2, '0');
    return `${hoursStr}:${minutes} ${ampm}`;
  }
}
