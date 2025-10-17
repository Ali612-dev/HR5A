import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faFileInvoice, faDownload, faPrint, faUser, faCalendar, faMoneyBill, faClock, faCheckCircle, faTimesCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FinancialService } from '../../../../core/services/financial.service';
import { SalaryReportDto, DetailedSalaryReportDto } from '../../../../core/interfaces/financial.interface';

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

        <!-- Success State -->
        <div *ngIf="successMessage && !isLoading" class="success-container">
          <div class="glass-card success-card">
            <div class="card-body text-center">
              <fa-icon [icon]="faCheckCircle" class="display-1 text-success mb-3"></fa-icon>
              <h4 class="text-white mb-3">{{ 'Success' | translate }}</h4>
              <p class="text-muted mb-4">{{ successMessage }}</p>
              <button class="btn btn-success" (click)="clearSuccessMessage()">
                {{ 'Close' | translate }}
              </button>
            </div>
          </div>
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

        <!-- Report Details -->
        <div *ngIf="report && !isLoading && !error" class="report-details-content">
          <!-- Main Content Grid -->
          <div class="content-grid">
            <!-- Left Column - Employee & Period Info -->
            <div class="content-column left-column">
              <!-- Employee Information Card -->
              <div class="glass-card info-card">
                <div class="card-header">
                  <fa-icon [icon]="faUser" class="me-2"></fa-icon>
                  {{ 'EmployeeInformation' | translate }}
                </div>
                <div class="card-body">
                  <div class="info-grid">
                    <div class="info-item">
                      <label class="info-label">{{ 'EmployeeName' | translate }}</label>
                      <div class="info-value">{{ report.employeeName }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'PhoneNumber' | translate }}</label>
                      <div class="info-value">{{ report.employeePhoneNumber }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'EmployeeCardNumber' | translate }}</label>
                      <div class="info-value">{{ report.employeeCardNumber }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'EmployeeId' | translate }}</label>
                      <div class="info-value">{{ report.employeeId }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Report Period Card -->
              <div class="glass-card info-card">
                <div class="card-header">
                  <fa-icon [icon]="faCalendar" class="me-2"></fa-icon>
                  {{ 'ReportPeriod' | translate }}
                </div>
                <div class="card-body">
                  <div class="info-grid">
                    <div class="info-item">
                      <label class="info-label">{{ 'ReportMonth' | translate }}</label>
                      <div class="info-value">{{ getMonthName(report.reportMonth) }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'ReportYear' | translate }}</label>
                      <div class="info-value">{{ report.reportYear }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'StartDate' | translate }}</label>
                      <div class="info-value">{{ formatDate(report.startDate) }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'EndDate' | translate }}</label>
                      <div class="info-value">{{ formatDate(report.endDate) }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Work Rule Information Card -->
              <div class="glass-card info-card" *ngIf="report.workRule">
                <div class="card-header">
                  <fa-icon [icon]="faInfoCircle" class="me-2"></fa-icon>
                  {{ 'WorkRuleInformation' | translate }}
                </div>
                <div class="card-body">
                  <div class="info-grid">
                    <div class="info-item">
                      <label class="info-label">{{ 'WorkRuleCategory' | translate }}</label>
                      <div class="info-value">{{ report.workRule.category }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'WorkRuleType' | translate }}</label>
                      <div class="info-value">{{ getWorkRuleTypeText(report.workRule.type) }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'ExpectedStartTime' | translate }}</label>
                      <div class="info-value">{{ report.workRule.expectStartTime }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'ExpectedEndTime' | translate }}</label>
                      <div class="info-value">{{ report.workRule.expectEndTime }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'ExpectedHoursPerDay' | translate }}</label>
                      <div class="info-value">{{ report.workRule.expectedHoursPerDay }} {{ 'Hours' | translate }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'ExpectedDaysPerWeek' | translate }}</label>
                      <div class="info-value">{{ report.workRule.expectedDaysPerWeek }} {{ 'Days' | translate }}</div>
                    </div>
                    <div class="info-item" *ngIf="report.workRule.paymentFrequency">
                      <label class="info-label">{{ 'PaymentFrequency' | translate }}</label>
                      <div class="info-value">{{ getPaymentFrequencyText(report.workRule.paymentFrequency) }}</div>
                    </div>
                    <div class="info-item" *ngIf="report.workRule.description">
                      <label class="info-label">{{ 'Description' | translate }}</label>
                      <div class="info-value">{{ report.workRule.description }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column - Salary & Status Info -->
            <div class="content-column right-column">
              <!-- Salary Breakdown Card -->
              <div class="glass-card info-card">
                <div class="card-header">
                  <fa-icon [icon]="faMoneyBill" class="me-2"></fa-icon>
                  {{ 'SalaryBreakdown' | translate }}
                </div>
                <div class="card-body">
                  <div class="info-grid">
                    <div class="info-item">
                      <label class="info-label">{{ 'BaseSalary' | translate }}</label>
                      <div class="info-value amount">{{ formatCurrency(report.baseSalary) }}</div>
                    </div>
                    <div class="info-item" *ngIf="report.actualBaseSalary">
                      <label class="info-label">{{ 'ActualBaseSalary' | translate }}</label>
                      <div class="info-value amount">{{ formatCurrency(report.actualBaseSalary) }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'NetCalculatedSalary' | translate }}</label>
                      <div class="info-value amount net-salary">{{ formatCurrency(report.netCalculatedSalary) }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'TotalExpectedHours' | translate }}</label>
                      <div class="info-value">{{ report.totalExpectedHours }} {{ 'Hours' | translate }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'TotalWorkedHours' | translate }}</label>
                      <div class="info-value">{{ report.totalWorkedHours }} {{ 'Hours' | translate }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'ExpectedWorkingDays' | translate }}</label>
                      <div class="info-value">{{ report.expectedWorkingDays }} {{ 'Days' | translate }}</div>
                    </div>
                    <div class="info-item" *ngIf="report.actualAttendanceDays">
                      <label class="info-label">{{ 'ActualAttendanceDays' | translate }}</label>
                      <div class="info-value">{{ report.actualAttendanceDays }} {{ 'Days' | translate }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Overtime and Adjustments Card -->
              <div class="glass-card info-card">
                <div class="card-header">
                  <fa-icon [icon]="faClock" class="me-2"></fa-icon>
                  {{ 'OvertimeAndAdjustments' | translate }}
                </div>
                <div class="card-body">
                  <div class="info-grid">
                    <div class="info-item">
                      <label class="info-label">{{ 'TotalOvertimeHours' | translate }}</label>
                      <div class="info-value">{{ report.totalOvertimeHours }} {{ 'Hours' | translate }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'TotalOvertimePay' | translate }}</label>
                      <div class="info-value amount">{{ formatCurrency(report.totalOvertimePay) }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'TotalDeductions' | translate }}</label>
                      <div class="info-value amount deduction">{{ formatCurrency(report.totalDeductions) }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'TotalBonuses' | translate }}</label>
                      <div class="info-value amount bonus">{{ formatCurrency(report.totalBonuses) }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'PaymentStatus' | translate }}</label>
                      <div class="info-value">
                        <span class="status-badge" [ngClass]="getStatusBadgeClass(report.isPaid)">
                          <fa-icon [icon]="report.isPaid ? faCheckCircle : faTimesCircle" class="me-1"></fa-icon>
                          {{ getStatusText(report.isPaid) | translate }}
                        </span>
                      </div>
                    </div>
                    <div class="info-item" *ngIf="report.paidDate">
                      <label class="info-label">{{ 'PaidDate' | translate }}</label>
                      <div class="info-value">{{ formatDateTime(report.paidDate) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Section - Details and Notes -->
          <div class="bottom-section">
            <!-- Deductions and Bonuses in Side-by-Side Layout -->
            <div class="details-grid" *ngIf="(report.deductions && report.deductions.length > 0) || (report.bonuses && report.bonuses.length > 0)">
              <!-- Deductions -->
              <div class="glass-card info-card" *ngIf="report.deductions && report.deductions.length > 0">
                <div class="card-header">
                  <fa-icon [icon]="faInfoCircle" class="me-2"></fa-icon>
                  {{ 'DeductionsDetails' | translate }}
                </div>
                <div class="card-body">
                  <div class="compact-table">
                    <div class="table-header">
                      <span>{{ 'Reason' | translate }}</span>
                      <span>{{ 'Amount' | translate }}</span>
                      <span>{{ 'Date' | translate }}</span>
                    </div>
                    <div class="table-row" *ngFor="let deduction of report.deductions">
                      <span class="reason">{{ deduction.reason || 'N/A' }}</span>
                      <span class="amount deduction">{{ formatCurrency(deduction.amount) }}</span>
                      <span class="date">{{ formatDate(deduction.date) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bonuses -->
              <div class="glass-card info-card" *ngIf="report.bonuses && report.bonuses.length > 0">
                <div class="card-header">
                  <fa-icon [icon]="faInfoCircle" class="me-2"></fa-icon>
                  {{ 'BonusesDetails' | translate }}
                </div>
                <div class="card-body">
                  <div class="compact-table">
                    <div class="table-header">
                      <span>{{ 'Reason' | translate }}</span>
                      <span>{{ 'Amount' | translate }}</span>
                      <span>{{ 'Date' | translate }}</span>
                    </div>
                    <div class="table-row" *ngFor="let bonus of report.bonuses">
                      <span class="reason">{{ bonus.reason || 'N/A' }}</span>
                      <span class="amount bonus">{{ formatCurrency(bonus.amount) }}</span>
                      <span class="date">{{ formatDate(bonus.date) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes and Metadata Row -->
            <div class="notes-metadata-row">
              <!-- Notes Card -->
              <div class="glass-card info-card notes-card" *ngIf="report.notes">
                <div class="card-header">
                  <fa-icon [icon]="faInfoCircle" class="me-2"></fa-icon>
                  {{ 'Notes' | translate }}
                </div>
                <div class="card-body">
                  <div class="notes-content">
                    {{ report.notes }}
                  </div>
                </div>
              </div>

              <!-- Report Metadata Card -->
              <div class="glass-card info-card metadata-card">
                <div class="card-header">
                  <fa-icon [icon]="faInfoCircle" class="me-2"></fa-icon>
                  {{ 'ReportMetadata' | translate }}
                </div>
                <div class="card-body">
                  <div class="metadata-grid">
                    <div class="info-item">
                      <label class="info-label">{{ 'GeneratedDate' | translate }}</label>
                      <div class="info-value">{{ formatDateTime(report.generatedDate) }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ 'ReportId' | translate }}</label>
                      <div class="info-value">{{ report.id }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Calculation Breakdown Section -->
          <div class="content-section" *ngIf="report.calculationBreakdown">
            <div class="glass-card info-card">
              <div class="card-header">
                <fa-icon [icon]="faInfoCircle" class="me-2"></fa-icon>
                {{ 'CalculationBreakdown' | translate }}
              </div>
              <div class="card-body">
                <div class="breakdown-content">
                  <div class="breakdown-item">
                    <strong>{{ 'BaseSalary' | translate }}:</strong> {{ report.calculationBreakdown.baseSalaryDescription }}
                  </div>
                  <div class="breakdown-item">
                    <strong>{{ 'HoursAnalysis' | translate }}:</strong> {{ report.calculationBreakdown.hoursDescription }}
                  </div>
                  <div class="breakdown-item">
                    <strong>{{ 'Overtime' | translate }}:</strong> {{ report.calculationBreakdown.overtimeDescription }}
                  </div>
                  <div class="breakdown-item">
                    <strong>{{ 'Deductions' | translate }}:</strong> {{ report.calculationBreakdown.deductionsDescription }}
                  </div>
                  <div class="breakdown-item">
                    <strong>{{ 'Bonuses' | translate }}:</strong> {{ report.calculationBreakdown.bonusesDescription }}
                  </div>
                  <div class="breakdown-item final-calculation">
                    <strong>{{ 'FinalCalculation' | translate }}:</strong> {{ report.calculationBreakdown.finalCalculationDescription }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Attendance Analysis Section -->
          <div class="content-section" *ngIf="report.attendanceAnalysis">
            <div class="glass-card info-card">
              <div class="card-header">
                <fa-icon [icon]="faClock" class="me-2"></fa-icon>
                {{ 'AttendanceAnalysis' | translate }}
              </div>
              <div class="card-body">
                <div class="attendance-summary">
                  <div class="summary-item">
                    <strong>{{ 'TotalWorkingDays' | translate }}:</strong> {{ report.attendanceAnalysis.totalWorkingDays }}
                  </div>
                  <div class="summary-item">
                    <strong>{{ 'DaysWithAttendance' | translate }}:</strong> {{ report.attendanceAnalysis.daysWithAttendance }}
                  </div>
                  <div class="summary-item">
                    <strong>{{ 'DaysWithoutAttendance' | translate }}:</strong> {{ report.attendanceAnalysis.daysWithoutAttendance }}
                  </div>
                  <div class="summary-item">
                    <strong>{{ 'RegularDays' | translate }}:</strong> {{ report.attendanceAnalysis.regularDaysDescription }}
                  </div>
                  <div class="summary-item">
                    <strong>{{ 'IrregularDays' | translate }}:</strong> {{ report.attendanceAnalysis.irregularDaysDescription }}
                  </div>
                  <div class="summary-item">
                    <strong>{{ 'HoursAnalysis' | translate }}:</strong> {{ report.attendanceAnalysis.hoursAnalysisDescription }}
                  </div>
                </div>

                <!-- Irregular Attendances Table -->
                <div class="irregular-attendances" *ngIf="report.attendanceAnalysis.irregularAttendances.length > 0">
                  <h5 class="section-title">{{ 'IrregularAttendances' | translate }}</h5>
                  <div class="attendance-table">
                    <div class="table-header">
                      <div class="header-cell">{{ 'Date' | translate }}</div>
                      <div class="header-cell">{{ 'Day' | translate }}</div>
                      <div class="header-cell">{{ 'ExpectedTime' | translate }}</div>
                      <div class="header-cell">{{ 'ActualTime' | translate }}</div>
                      <div class="header-cell">{{ 'Status' | translate }}</div>
                      <div class="header-cell">{{ 'Severity' | translate }}</div>
                    </div>
                    <div class="table-body">
                      <div class="table-row" *ngFor="let attendance of report.attendanceAnalysis.irregularAttendances">
                        <div class="table-cell">{{ attendance.formattedDate }}</div>
                        <div class="table-cell">{{ attendance.dayOfWeek }}</div>
                        <div class="table-cell">{{ attendance.expectedStartTimeFormatted }} - {{ attendance.expectedEndTimeFormatted }}</div>
                        <div class="table-cell">
                          <span *ngIf="attendance.actualTimeInFormatted">{{ attendance.actualTimeInFormatted }} - {{ attendance.actualTimeOutFormatted }}</span>
                          <span *ngIf="!attendance.actualTimeInFormatted" class="absent-text">{{ 'Absent' | translate }}</span>
                        </div>
                        <div class="table-cell">{{ attendance.status }}</div>
                        <div class="table-cell">
                          <span class="severity-badge" [ngClass]="'severity-' + attendance.severity.toLowerCase()">
                            {{ attendance.severity }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    <!-- </div> -->
  `,
  styles: [`
    .report-details-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      padding: 1.5rem;
      width: 100%;
      max-width: 100%;
      margin: 0;
      overflow-x: auto;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    /* Main Content Grid Layout */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .content-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .left-column {
      min-width: 0;
    }

    .right-column {
      min-width: 0;
    }

    /* Info Grid for compact display */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    /* Bottom Section */
    .bottom-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Details Grid for Deductions and Bonuses */
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    /* Notes and Metadata Row */
    .notes-metadata-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    /* Compact Table for Deductions/Bonuses */
    .compact-table {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 1.2fr 1fr;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.8px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px 8px 0 0;
      margin-bottom: 0.5rem;
    }

    .table-header span {
      padding: 0.25rem 0.5rem;
    }

    .table-header span:first-child {
      text-align: left;
      padding-left: 0.25rem;
    }

    .table-header span:nth-child(2) {
      text-align: right;
      padding-right: 0.25rem;
    }

    .table-header span:last-child {
      text-align: center;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 1.2fr 1fr;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      align-items: center;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .table-row .reason {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      font-weight: 500;
      text-align: left;
      padding-left: 0.25rem;
    }

    .table-row .amount {
      font-weight: 700;
      text-align: right;
      font-size: 0.95rem;
      padding-right: 0.25rem;
    }

    .table-row .amount.deduction {
      color: #ff6b6b;
      background: rgba(255, 107, 107, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      border: 1px solid rgba(255, 107, 107, 0.2);
    }

    .table-row .amount.bonus {
      color: #51cf66;
      background: rgba(81, 207, 102, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      border: 1px solid rgba(81, 207, 102, 0.2);
    }

    .table-row .date {
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.85rem;
      text-align: center;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Metadata Grid */
    .metadata-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .page-title {
      display: flex;
      align-items: center;
      color: white;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .btn-ghost {
      background: rgba(255, 255, 255, 0.1) !important;
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      color: white !important;
      transition: all 0.3s ease;
      padding: 0.75rem 1.5rem !important;
      border-radius: 12px !important;
      font-weight: 500;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      -webkit-user-select: none;
    }
    
    .btn-ghost:hover {
      background: rgba(255, 255, 255, 0.2) !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .btn-pay {
      background: linear-gradient(45deg, #4CAF50, #45a049) !important;
      border: 1px solid rgba(76, 175, 80, 0.5) !important;
      color: white !important;
      font-weight: 600;
    }

    .btn-pay:hover:not(:disabled) {
      background: linear-gradient(45deg, #45a049, #4CAF50) !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(76, 175, 80, 0.4);
    }

    .btn-pay:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .glass-card {
      background: linear-gradient(45deg, rgba(142, 45, 226, 0.15), rgba(74, 0, 224, 0.15));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 15px;
      color: #fff;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
      transition: all 0.3s ease;
      margin-bottom: 2rem;
    }

    .glass-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.5);
    }

    .card-header {
      background: linear-gradient(45deg, rgba(142, 45, 226, 0.2), rgba(74, 0, 224, 0.2));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: none;
      color: white;
      font-weight: 600;
      padding: 1.25rem 1.5rem;
      border-radius: 15px 15px 0 0;
      font-size: 1.1rem;
    }

    .card-body {
      padding: 1.5rem;
    }

    .info-item {
      margin-bottom: 1rem;
    }

    .info-label {
      display: block;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      color: white;
      font-size: 1rem;
      font-weight: 600;
    }

    .info-value.amount {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .info-value.net-salary {
      color: #4CAF50;
    }

    .info-value.deduction {
      color: #F44336;
    }

    .info-value.bonus {
      color: #FF9800;
    }

    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.badge-success {
      background: linear-gradient(45deg, #4CAF50, #45a049);
      color: white;
    }

    .status-badge.badge-warning {
      background: linear-gradient(45deg, #FF9800, #F57C00);
      color: white;
    }

    .notes-content {
      background: rgba(255, 255, 255, 0.05);
      padding: 1.5rem;
      border-radius: 10px;
      border-left: 4px solid rgba(255, 255, 255, 0.3);
      font-style: italic;
      line-height: 1.6;
    }

    .table {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      overflow: hidden;
      min-width: 100%;
    }

    .table-responsive {
      border-radius: 10px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .table-responsive::-webkit-scrollbar {
      height: 6px;
    }

    .table-responsive::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }

    .table-responsive::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }

    .table-responsive::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }

    .table th {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: none;
      font-weight: 600;
      padding: 1rem;
    }

    .table td {
      color: rgba(255, 255, 255, 0.9);
      border: none;
      padding: 1rem;
    }

    .table tbody tr {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .table tbody tr:last-child {
      border-bottom: none;
    }

    .loading-container {
      text-align: center;
      padding: 4rem 0;
    }

    .error-container {
      margin: 2rem 0;
    }

    .error-card {
      max-width: 500px;
      margin: 0 auto;
    }

    .success-container {
      margin: 2rem 0;
    }

    .success-card {
      max-width: 500px;
      margin: 0 auto;
    }

    .spinner-border {
      width: 3rem;
      height: 3rem;
      border-width: 0.3rem;
    }

    /* Responsive adjustments */
    
    /* Large screens (1200px and up) */
    @media (min-width: 1200px) {
      .report-details-container {
        padding: 48px;
      }
      
      .page-header {
        margin-bottom: 3rem;
      }
      
      .glass-card {
        margin-bottom: 2.5rem;
      }
    }

    /* Medium screens (992px to 1199px) */
    @media (max-width: 1199px) and (min-width: 992px) {
      .report-details-container {
        padding: 32px;
      }
      
      .page-header {
        margin-bottom: 2.5rem;
      }
    }

    /* Small screens (768px to 991px) */
    @media (max-width: 991px) {
      .report-details-container {
        padding: 24px;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .header-left {
        width: 100%;
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .btn-ghost {
        padding: 0.75rem 1.25rem !important;
        min-height: 42px;
        font-size: 0.9rem;
        flex: 1;
        min-width: 140px;
      }

      .btn-pay {
        order: -1;
        width: 100%;
        margin-bottom: 0.5rem;
      }

      .page-title {
        font-size: 1.25rem;
      }

      .glass-card {
        margin-bottom: 1.5rem;
      }

      .card-header {
        padding: 1.25rem 1.5rem;
        font-size: 1.05rem;
      }

      .card-body {
        padding: 1.5rem;
      }

      .info-item {
        margin-bottom: 1.25rem;
      }

      .info-value.amount {
        font-size: 1.15rem;
      }

      .table th,
      .table td {
        padding: 0.875rem;
        font-size: 0.9rem;
      }
    }

    /* Mobile screens (576px to 767px) */
    @media (max-width: 767px) {
      .report-details-container {
        padding: 16px;
      }

      .page-header {
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .header-actions {
        gap: 0.5rem;
      }

      .btn-ghost {
        padding: 0.6rem 1rem !important;
        min-height: 40px;
        font-size: 0.85rem;
        min-width: 120px;
      }

      .btn-pay {
        padding: 0.75rem 1.5rem !important;
        min-height: 44px;
        font-size: 0.9rem;
      }

      .page-title {
        font-size: 1.1rem;
      }

      .glass-card {
        margin-bottom: 1.25rem;
      }

      .card-header {
        padding: 1rem 1.25rem;
        font-size: 1rem;
      }

      .card-body {
        padding: 1.25rem;
      }

      .info-item {
        margin-bottom: 1rem;
      }

      .info-label {
        font-size: 0.8rem;
      }

      .info-value {
        font-size: 0.95rem;
      }

      .info-value.amount {
        font-size: 1.1rem;
      }

      .table th,
      .table td {
        padding: 0.75rem;
        font-size: 0.85rem;
      }

      .status-badge {
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
      }

      .notes-content {
        padding: 1rem;
        font-size: 0.9rem;
      }
    }

    /* Extra small screens (up to 575px) */
    @media (max-width: 575px) {
      .report-details-container {
        padding: 12px;
      }

      .page-header {
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }

      .header-actions {
        flex-direction: column;
        width: 100%;
        gap: 0.5rem;
      }

      .btn-ghost {
        width: 100% !important;
        padding: 0.75rem 1rem !important;
        min-height: 44px;
        font-size: 0.9rem;
        justify-content: center;
      }

      .btn-pay {
        order: -1;
        margin-bottom: 0.25rem;
      }

      .page-title {
        font-size: 1rem;
      }

      .glass-card {
        margin-bottom: 1rem;
        border-radius: 12px;
      }

      .card-header {
        padding: 0.875rem 1rem;
        font-size: 0.95rem;
        border-radius: 12px 12px 0 0;
      }

      .card-body {
        padding: 1rem;
      }

      .info-item {
        margin-bottom: 0.875rem;
      }

      .info-label {
        font-size: 0.75rem;
        margin-bottom: 0.375rem;
      }

      .info-value {
        font-size: 0.9rem;
      }

      .info-value.amount {
        font-size: 1.05rem;
      }

      .table-responsive {
        border-radius: 8px;
        overflow-x: auto;
      }

      .table {
        min-width: 280px;
        border-radius: 8px;
      }

      .table th,
      .table td {
        padding: 0.625rem;
        font-size: 0.8rem;
        white-space: nowrap;
      }

      .status-badge {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
      }

      .notes-content {
        padding: 0.875rem;
        font-size: 0.85rem;
        line-height: 1.5;
      }

      .loading-container {
        padding: 3rem 0;
      }

      .spinner-border {
        width: 2.5rem;
        height: 2.5rem;
      }

      .error-card,
      .success-card {
        margin: 1rem 0;
      }

      .error-card .card-body,
      .success-card .card-body {
        padding: 1.5rem 1rem;
      }

      .display-1 {
        font-size: 3rem;
      }
    }

    /* Ultra small screens (up to 375px) */
    @media (max-width: 375px) {
      .report-details-container {
        padding: 8px;
      }

      .btn-ghost {
        padding: 0.625rem 0.875rem !important;
        font-size: 0.85rem;
      }

      .card-header {
        padding: 0.75rem 0.875rem;
        font-size: 0.9rem;
      }

      .card-body {
        padding: 0.875rem;
      }

      .info-value.amount {
        font-size: 1rem;
      }

      .table th,
      .table td {
        padding: 0.5rem;
        font-size: 0.75rem;
      }

      .notes-content {
        padding: 0.75rem;
        font-size: 0.8rem;
      }
    }

    /* Landscape orientation adjustments for mobile */
    @media (max-width: 767px) and (orientation: landscape) {
      .report-details-container {
        padding: 16px 20px;
      }

      .page-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .header-left {
        flex-direction: row;
        align-items: center;
        gap: 1rem;
      }

      .header-actions {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 0.5rem;
        width: auto;
      }

      .btn-ghost {
        width: auto !important;
        min-width: 100px;
        padding: 0.5rem 0.875rem !important;
        min-height: 36px;
        font-size: 0.8rem;
      }

      .glass-card {
        margin-bottom: 1rem;
      }

      .card-body {
        padding: 1rem;
      }
    }
    /* Grid Layout Responsive Adjustments */
    @media (max-width: 991px) {
      /* Switch to single column layout */
      .content-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      .details-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      .notes-metadata-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }

    @media (max-width: 768px) {
      .content-grid {
        gap: 1rem;
      }
      
      .content-column {
        gap: 1rem;
      }
      
      .bottom-section {
        gap: 1rem;
      }
      
      .info-grid {
        gap: 0.75rem;
      }
      
      /* Compact table adjustments */
      .table-header {
        font-size: 0.7rem;
        padding: 0.5rem 0;
        grid-template-columns: 1.8fr 1fr 0.8fr;
        gap: 0.5rem;
      }
      
      .table-row {
        padding: 0.6rem 0;
        grid-template-columns: 1.8fr 1fr 0.8fr;
        gap: 0.5rem;
      }
      
      .table-row .reason {
        font-size: 0.85rem;
      }

      .table-row .amount {
        font-size: 0.9rem;
      }

      .table-row .date {
        font-size: 0.8rem;
      }
    }

    @media (max-width: 576px) {
      .content-grid {
        gap: 0.75rem;
      }
      
      .content-column {
        gap: 0.75rem;
      }
      
      .bottom-section {
        gap: 0.75rem;
      }
      
      .details-grid {
        gap: 0.75rem;
      }
      
      .notes-metadata-row {
        gap: 0.75rem;
      }
      
      .info-grid {
        gap: 0.5rem;
      }
      
      /* Compact table adjustments */
      .table-header {
        font-size: 0.65rem;
        padding: 0.4rem 0;
        grid-template-columns: 1.5fr 1fr 0.7fr;
        gap: 0.4rem;
      }
      
      .table-row {
        padding: 0.5rem 0;
        grid-template-columns: 1.5fr 1fr 0.7fr;
        gap: 0.4rem;
      }
      
      .table-row .reason {
        font-size: 0.8rem;
      }

      .table-row .amount {
        font-size: 0.85rem;
      }

      .table-row .date {
        font-size: 0.75rem;
      }
    }

    @media (max-width: 480px) {
      .content-grid {
        gap: 0.5rem;
      }
      
      .content-column {
        gap: 0.5rem;
      }
      
      .bottom-section {
        gap: 0.5rem;
      }
      
      .details-grid {
        gap: 0.5rem;
      }
      
      .notes-metadata-row {
        gap: 0.5rem;
      }
      
      .info-grid {
        gap: 0.4rem;
      }
    }

    @media (max-width: 360px) {
      .content-grid {
        gap: 0.4rem;
      }
      
      .content-column {
        gap: 0.4rem;
      }
      
      .bottom-section {
        gap: 0.4rem;
      }
      
      .details-grid {
        gap: 0.4rem;
      }
      
      .notes-metadata-row {
        gap: 0.4rem;
      }
      
      .info-grid {
        gap: 0.3rem;
      }
    }

    /* Calculation Breakdown Styles */
    .breakdown-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .breakdown-item {
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border-left: 3px solid #667eea;
    }

    .breakdown-item.final-calculation {
      background: rgba(102, 126, 234, 0.1);
      border-left-color: #4a00e0;
      font-weight: 600;
    }

    /* Attendance Analysis Styles */
    .attendance-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .summary-item {
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border-left: 3px solid #667eea;
    }

    .section-title {
      color: #fff;
      margin-bottom: 1rem;
      font-size: 1.1rem;
      font-weight: 600;
    }

    /* Attendance Table Styles */
    .attendance-table {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      overflow: hidden;
      margin-top: 1rem;
    }

    .table-header {
      display: grid;
      grid-template-columns: 1fr 1fr 1.5fr 1.5fr 2fr 1fr;
      background: rgba(102, 126, 234, 0.2);
      padding: 1rem;
      font-weight: 600;
      color: #fff;
    }

    .table-body {
      max-height: 400px;
      overflow-y: auto;
    }

    .table-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1.5fr 1.5fr 2fr 1fr;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      transition: background-color 0.2s ease;
    }

    .table-row:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .table-cell {
      display: flex;
      align-items: center;
      padding: 0.25rem;
    }

    .header-cell {
      display: flex;
      align-items: center;
      padding: 0.25rem;
    }

    .absent-text {
      color: #ff6b6b;
      font-style: italic;
    }

    .severity-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .severity-minor {
      background: rgba(255, 193, 7, 0.2);
      color: #ffc107;
      border: 1px solid rgba(255, 193, 7, 0.3);
    }

    .severity-moderate {
      background: rgba(255, 152, 0, 0.2);
      color: #ff9800;
      border: 1px solid rgba(255, 152, 0, 0.3);
    }

    .severity-major {
      background: rgba(244, 67, 54, 0.2);
      color: #f44336;
      border: 1px solid rgba(244, 67, 54, 0.3);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .attendance-summary {
        grid-template-columns: 1fr;
      }

      .table-header,
      .table-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .header-cell,
      .table-cell {
        padding: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .header-cell:before,
      .table-cell:before {
        content: attr(data-label) ': ';
        font-weight: 600;
        margin-right: 0.5rem;
      }
    }
  `]
})
export class SalaryReportDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private financialService = inject(FinancialService);
  private translate = inject(TranslateService);

  report: DetailedSalaryReportDto | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  isProcessingPayment: boolean = false;

  // FontAwesome Icons
  faArrowLeft = faArrowLeft;
  faFileInvoice = faFileInvoice;
  faDownload = faDownload;
  faPrint = faPrint;
  faUser = faUser;
  faCalendar = faCalendar;
  faMoneyBill = faMoneyBill;
  faClock = faClock;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faInfoCircle = faInfoCircle;

  ngOnInit(): void {
    this.loadReportDetails();
  }

  loadReportDetails(): void {
    const reportId = this.route.snapshot.paramMap.get('id');
    if (reportId) {
      this.isLoading = true;
      this.error = null;

      this.financialService.getDetailedSalaryReportById(Number(reportId)).subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.report = response.data;
          } else {
            this.error = 'ERROR.FAILED_TO_LOAD_REPORT_DETAILS';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading report details:', err);
          this.error = 'ERROR.FETCH_REPORT_DETAILS_ERROR';
          this.isLoading = false;
        }
      });
    } else {
      this.error = 'ERROR.INVALID_REPORT_ID';
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/financial/salary-reports']);
  }

  downloadReport(): void {
    console.log('Download report:', this.report);
    // TODO: Implement download functionality
  }

  printReport(): void {
    window.print();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || month.toString();
  }

  getStatusBadgeClass(isPaid: boolean): string {
    return isPaid ? 'badge-success' : 'badge-warning';
  }

  getStatusText(isPaid: boolean): string {
    return isPaid ? 'Paid' : 'Unpaid';
  }

  getErrorMessage(errorKey: string): string {
    return this.translate.instant(errorKey);
  }

  getWorkRuleTypeText(type: number | string): string {
    if (typeof type === 'string') {
      return type;
    }
    const types = ['Regular', 'Flexible', 'Shift'];
    return types[type] || type.toString();
  }

  getPaymentFrequencyText(frequency: number): string {
    const frequencies = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
    return frequencies[frequency] || frequency.toString();
  }

  markReportAsPaid(): void {
    if (!this.report || this.isProcessingPayment) {
      return;
    }

    this.isProcessingPayment = true;
    this.error = null;
    this.successMessage = null;
    
    this.financialService.markSalaryReportAsPaid(this.report.id).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          // Show the API success message
          this.successMessage = response.message || 'Report marked as paid successfully';
          // Update the report with the new paid status if data is provided
          if (response.data && this.report) {
            // Update only the paid status and paid date
            this.report.isPaid = response.data.isPaid;
            this.report.paidDate = response.data.paidDate;
          } else {
            // If no data returned, just update the isPaid status locally
            if (this.report) {
              this.report.isPaid = true;
              this.report.paidDate = new Date().toISOString();
            }
          }
        } else {
          // Show the API error message
          this.error = response.message || 'ERROR.FAILED_TO_MARK_REPORT_AS_PAID';
        }
        this.isProcessingPayment = false;
      },
      error: (err) => {
        console.error('Error marking report as paid:', err);
        // Show the API error message from the response
        this.error = err?.error?.message || 'ERROR.FAILED_TO_MARK_REPORT_AS_PAID';
        this.isProcessingPayment = false;
      }
    });
  }

  clearSuccessMessage(): void {
    this.successMessage = null;
  }
}
