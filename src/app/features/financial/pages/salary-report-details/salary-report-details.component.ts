import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faFileInvoice, faDownload, faPrint, faUser, faCalendar, faMoneyBill, faClock, faCheckCircle, faTimesCircle, faInfoCircle, faChartPie, faCoins, faMinusCircle, faPlusCircle, faCode, faStickyNote, faIdCard } from '@fortawesome/free-solid-svg-icons';
import { FinancialService } from '../../../../core/services/financial.service';
import { DetailedSalaryReportDto, DeductionDto, CalculationBreakdownDto } from '../../../../core/interfaces/financial.interface';

interface DeductionBreakdownEntry {
  totalAmount: number;
  count: number;
  entries: Array<{
    id?: number;
    salaryReportId?: number;
    amount: number;
    date: string;
    isApplied: boolean;
  }>;
}

interface LocalizedBreakdownLine {
  text: string;
  isFinal?: boolean;
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

        <!-- Quick Summary -->
        <div class="summary-section" *ngIf="report && !isLoading && !error">
          <div class="summary-header">
            <fa-icon [icon]="faChartPie" class="summary-header-icon"></fa-icon>
            <span>{{ 'QuickSummary' | translate }}</span>
          </div>
          <div class="summary-cards">
            <div class="summary-card primary">
              <div class="summary-icon primary">
                <fa-icon [icon]="faCoins"></fa-icon>
              </div>
              <div class="summary-content">
                <span class="summary-label">{{ 'BaseSalary' | translate }}</span>
                <span class="summary-value">{{ formatCurrency(report.baseSalary) }}</span>
              </div>
            </div>
            <div class="summary-card warning">
              <div class="summary-icon warning">
                <fa-icon [icon]="faMinusCircle"></fa-icon>
              </div>
              <div class="summary-content">
                <span class="summary-label">{{ 'TotalDeductions' | translate }}</span>
                <span class="summary-value">{{ formatCurrency(report.totalDeductions) }}</span>
              </div>
            </div>
            <div class="summary-card success">
              <div class="summary-icon success">
                <fa-icon [icon]="faPlusCircle"></fa-icon>
              </div>
              <div class="summary-content">
                <span class="summary-label">{{ 'TotalBonuses' | translate }}</span>
                <span class="summary-value">{{ formatCurrency(report.totalBonuses) }}</span>
              </div>
            </div>
            <div class="summary-card neutral">
              <div class="summary-icon neutral">
                <fa-icon [icon]="faMoneyBill"></fa-icon>
              </div>
              <div class="summary-content">
                <span class="summary-label">{{ 'NetCalculatedSalary' | translate }}</span>
                <span class="summary-value">{{ formatCurrency(report.netCalculatedSalary) }}</span>
              </div>
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

                  <div class="work-rule-flags">
                    <div class="flag-chip" [class.enabled]="report.workRule.allowWorkOnOffDays" [class.disabled]="!report.workRule.allowWorkOnOffDays">
                      <fa-icon [icon]="report.workRule.allowWorkOnOffDays ? faCheckCircle : faTimesCircle"></fa-icon>
                      <span>
                        {{ report.workRule.allowWorkOnOffDays ? ('WorkRuleAllowOffDays' | translate) : ('WorkRuleDisallowOffDays' | translate) }}
                      </span>
                    </div>
                    <div class="flag-chip" *ngIf="report.workRule.allowWorkOnOffDays" [class.enabled]="report.workRule.treatOffDayWorkAsOvertime" [class.disabled]="!report.workRule.treatOffDayWorkAsOvertime">
                      <fa-icon [icon]="report.workRule.treatOffDayWorkAsOvertime ? faCheckCircle : faTimesCircle"></fa-icon>
                      <span>
                        {{ report.workRule.treatOffDayWorkAsOvertime ? ('WorkRuleTreatOffDaysAsOvertime' | translate) : ('WorkRuleTreatOffDaysAsRegular' | translate) }}
                      </span>
                    </div>
                  </div>

                  <div class="info-grid compact" *ngIf="report.workRule.allowWorkOnOffDays">
                    <div class="info-item" *ngIf="report.workRule.offDayOvertimeMultiplier !== null && report.workRule.offDayOvertimeMultiplier !== undefined">
                      <label class="info-label">{{ 'WorkRuleOffDayOvertimeMultiplier' | translate }}</label>
                      <div class="info-value">{{ formatNumber(report.workRule.offDayOvertimeMultiplier) }}</div>
                    </div>
                    <div class="info-item" *ngIf="report.workRule.offDayHourlyRate !== null && report.workRule.offDayHourlyRate !== undefined">
                      <label class="info-label">{{ 'WorkRuleOffDayHourlyRate' | translate }}</label>
                      <div class="info-value">{{ formatCurrency(report.workRule.offDayHourlyRate) }}</div>
                    </div>
                    <div class="info-item" *ngIf="(report.workRule.offDayOvertimeMultiplier === null || report.workRule.offDayOvertimeMultiplier === undefined) && (report.workRule.offDayHourlyRate === null || report.workRule.offDayHourlyRate === undefined)">
                      <label class="info-label">{{ 'WorkRuleOffDayRates' | translate }}</label>
                      <div class="info-value muted">{{ 'NotAvailable' | translate }}</div>
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
            <div class="bottom-grid">
              <!-- Deductions -->
              <div class="glass-card info-card grid-card" *ngIf="normalizedDeductions.length > 0">
                <div class="card-header">
                  <fa-icon [icon]="faMinusCircle" class="me-2"></fa-icon>
                  {{ 'DeductionsDetails' | translate }}
                </div>
                <div class="card-body">
                  <div class="breakdown-chips" *ngIf="deductionBreakdownKeys.length > 0">
                    <div class="breakdown-chip deduction-chip" *ngFor="let reason of deductionBreakdownKeys">
                      <div class="chip-title">{{ reason }}</div>
                      <div class="chip-meta">
                        <span class="chip-amount">{{ formatCurrency(deductionBreakdown[reason].totalAmount) }}</span>
                        <span class="chip-count">{{ deductionBreakdown[reason].count }} {{ 'ItemsCountLabel' | translate }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="compact-table">
                    <div class="table-header">
                      <span>{{ 'Reason' | translate }}</span>
                      <span>{{ 'Amount' | translate }}</span>
                      <span>{{ 'Date' | translate }}</span>
                    </div>
                    <div class="table-row" *ngFor="let deduction of normalizedDeductions">
                      <span class="reason">{{ deduction.reason || 'N/A' }}</span>
                      <span class="amount deduction">{{ formatCurrency(deduction.amount) }}</span>
                      <span class="date">{{ formatDate(deduction.date) }}</span>
                    </div>
                  </div>
                  <div class="raw-toggle" *ngIf="deductionBreakdownKeys.length > 0">
                    <button class="btn btn-ghost btn-sm" type="button" (click)="toggleRawDeductionJson()">
                      <fa-icon [icon]="faCode" class="me-2"></fa-icon>
                      <span *ngIf="!showRawDeductionJson">{{ 'ShowRawDetails' | translate }}</span>
                      <span *ngIf="showRawDeductionJson">{{ 'HideRawDetails' | translate }}</span>
                    </button>
                  </div>
                  <div class="json-preview" *ngIf="showRawDeductionJson">
                    <pre>{{ deductionBreakdown | json }}</pre>
                  </div>
                </div>
              </div>

              <!-- Bonuses -->
              <div class="glass-card info-card grid-card" *ngIf="report.bonuses && report.bonuses.length > 0">
                <div class="card-header">
                  <fa-icon [icon]="faPlusCircle" class="me-2"></fa-icon>
                  {{ 'BonusesDetails' | translate }}
                </div>
                <div class="card-body">
                  <div class="breakdown-chips bonus" *ngIf="report.bonuses.length > 1">
                    <div class="breakdown-chip bonus-chip" *ngFor="let bonus of report.bonuses">
                      <div class="chip-title">{{ bonus.reason || 'N/A' }}</div>
                      <div class="chip-meta">
                        <span class="chip-amount">{{ formatCurrency(bonus.amount) }}</span>
                        <span class="chip-count">{{ formatDate(bonus.date) }}</span>
                      </div>
                    </div>
                  </div>
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

              <!-- Notes Card -->
              <div class="glass-card info-card grid-card notes-card" *ngIf="report.notes">
                <div class="card-header">
                  <fa-icon [icon]="faStickyNote" class="me-2"></fa-icon>
                  {{ 'Notes' | translate }}
                </div>
                <div class="card-body">
                  <div class="notes-wrapper">
                    <div class="notes-icon">
                      <fa-icon [icon]="faStickyNote"></fa-icon>
                    </div>
                    <div class="notes-content">
                      {{ report.notes }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Report Metadata Card -->
              <div class="glass-card info-card grid-card metadata-card">
                <div class="card-header">
                  <fa-icon [icon]="faIdCard" class="me-2"></fa-icon>
                  {{ 'ReportMetadata' | translate }}
                </div>
                <div class="card-body">
                  <ul class="metadata-list">
                    <li class="metadata-item" *ngFor="let meta of getMetadataEntries()">
                      <span class="metadata-label">{{ meta.label | translate }}</span>
                      <span class="metadata-value">{{ meta.value }}</span>
                    </li>
                  </ul>
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
                  <div 
                    class="breakdown-item" 
                    *ngFor="let line of calculationBreakdownLines" 
                    [ngClass]="{ 'final-calculation': line.isFinal }">
                    {{ line.text }}
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

    .summary-section {
      margin-bottom: 1.5rem;
    }

    .summary-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 600;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-header-icon {
      font-size: 1.1rem;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: 16px;
      background: linear-gradient(45deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
    }

    .summary-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      color: white;
    }

    .summary-icon.primary {
      background: linear-gradient(45deg, #00b4d8, #0077b6);
    }

    .summary-icon.warning {
      background: linear-gradient(45deg, #ef476f, #d90429);
    }

    .summary-icon.success {
      background: linear-gradient(45deg, #06d6a0, #118ab2);
    }

    .summary-icon.neutral {
      background: linear-gradient(45deg, #ffd166, #fcbf49);
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .summary-label {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-value {
      font-size: 1.2rem;
      font-weight: 700;
      color: white;
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

    .info-grid.compact {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      margin-top: 1.25rem;
    }

    .info-value.muted {
      color: rgba(255, 255, 255, 0.65);
      font-style: italic;
    }

    .work-rule-flags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }

    .flag-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 0.95rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.2px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.85);
      background: rgba(255, 255, 255, 0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .flag-chip.enabled {
      background: linear-gradient(45deg, rgba(76, 175, 80, 0.25), rgba(76, 175, 80, 0.1));
      border-color: rgba(76, 175, 80, 0.45);
      color: #c9f7cd;
    }

    .flag-chip.disabled {
      background: linear-gradient(45deg, rgba(244, 67, 54, 0.2), rgba(244, 67, 54, 0.05));
      border-color: rgba(244, 67, 54, 0.35);
      color: #ffc9c5;
    }

    .flag-chip fa-icon {
      font-size: 0.85rem;
    }


    /* Bottom Section */
    .bottom-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .bottom-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .grid-card {
      position: relative;
      overflow: hidden;
    }

    .grid-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), transparent);
      pointer-events: none;
    }

    .grid-card .card-body {
      position: relative;
    }

    /* Compact Table for Deductions/Bonuses */
    .compact-table {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .json-preview {
      margin-top: 1rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 10px;
      padding: 1rem;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.85);
      max-height: 220px;
      overflow-y: auto;
      word-break: break-word;
      white-space: pre-wrap;
      border: 1px solid rgba(255, 255, 255, 0.1);
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

    .breakdown-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .breakdown-chip {
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      min-width: 180px;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .chip-title {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
    }

    .chip-meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .chip-amount {
      font-size: 1.05rem;
      font-weight: 700;
      color: #ff6b6b;
    }

    .chip-count {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .bonus .chip-count {
      color: rgba(255, 255, 255, 0.5);
    }

    .bonus-chip .chip-amount {
      color: #51cf66;
    }

    .raw-toggle {
      margin-top: 1rem;
      margin-bottom: 0.75rem;
      display: flex;
      justify-content: flex-end;
    }

    .btn.btn-sm {
      padding: 0.4rem 0.9rem !important;
      font-size: 0.85rem;
      min-height: 34px;
    }

    .notes-wrapper {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .notes-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.05));
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4dc18f;
      font-size: 1.3rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }

    .notes-content {
      flex: 1;
      background: rgba(255, 255, 255, 0.07);
      padding: 1.25rem 1.5rem;
      border-radius: 12px;
      border-left: 4px solid rgba(77, 193, 143, 0.6);
      font-style: italic;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.9);
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.12);
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

    .metadata-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .metadata-item {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      padding: 0.75rem 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .metadata-item:last-child {
      border-bottom: none;
    }

    .metadata-label {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 0.8rem;
    }

    .metadata-value {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      font-size: 0.9rem;
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

      .summary-cards {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .bottom-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

      .bottom-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .info-grid.compact {
        grid-template-columns: 1fr;
      }

      .summary-cards {
        grid-template-columns: 1fr 1fr;
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

      .notes-wrapper {
        flex-direction: column;
        align-items: stretch;
      }

      .notes-icon {
        width: 40px;
        height: 40px;
        font-size: 1.1rem;
      }
    }

    /* Extra small screens (up to 575px) */
    @media (max-width: 575px) {
      .report-details-container {
        padding: 12px;
      }

      .bottom-grid {
        grid-template-columns: 1fr;
      }

      .info-grid.compact {
        grid-template-columns: 1fr;
      }

      .summary-cards {
        grid-template-columns: 1fr;
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

      .notes-wrapper {
        gap: 0.75rem;
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
  normalizedDeductions: DeductionDto[] = [];
  deductionBreakdown: Record<string, DeductionBreakdownEntry> = {};
  deductionBreakdownKeys: string[] = [];
  calculationBreakdownLines: LocalizedBreakdownLine[] = [];
  showRawDeductionJson: boolean = false;

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
  faChartPie = faChartPie;
  faCoins = faCoins;
  faMinusCircle = faMinusCircle;
  faPlusCircle = faPlusCircle;
  faCode = faCode;
  faStickyNote = faStickyNote;
  faIdCard = faIdCard;

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
            this.report = this.normalizeReportData(response.data);
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

  private normalizeReportData(report: DetailedSalaryReportDto): DetailedSalaryReportDto {
    const normalizedDeductions = this.mergeDeductions(report);
    this.normalizedDeductions = normalizedDeductions;
    this.deductionBreakdown = this.buildDeductionBreakdown(normalizedDeductions);
    this.deductionBreakdownKeys = Object.keys(this.deductionBreakdown);
    this.calculationBreakdownLines = this.buildLocalizedCalculationBreakdown(report.calculationBreakdown);

    if (this.deductionBreakdownKeys.length > 0) {
      console.log('🧮 Deductions breakdown object:', this.deductionBreakdown);
    }

    return {
      ...report,
      deductions: normalizedDeductions
    };
  }

  private mergeDeductions(report: DetailedSalaryReportDto): DeductionDto[] {
    const combined: DeductionDto[] = [
      ...(report.deductions ?? []),
      ...(report.deductionDetails ?? [])
    ];

    const unique = new Map<string, DeductionDto>();

    combined.forEach((deduction) => {
      if (!deduction) {
        return;
      }

      const key = deduction.id
        ? `id:${deduction.id}`
        : `hash:${(deduction.reason ?? '').trim()}|${deduction.date ?? ''}|${deduction.amount ?? 0}`;

      if (!unique.has(key)) {
        unique.set(key, deduction);
      }
    });

    const sorted = Array.from(unique.values()).sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });

    return sorted;
  }

  private buildDeductionBreakdown(deductions: DeductionDto[]): Record<string, DeductionBreakdownEntry> {
    return deductions.reduce((acc, deduction) => {
      const reasonKey = (deduction.reason?.trim() || 'N/A');

      if (!acc[reasonKey]) {
        acc[reasonKey] = {
          totalAmount: 0,
          count: 0,
          entries: []
        };
      }

      const entry = acc[reasonKey];

      entry.totalAmount += Number(deduction.amount ?? 0);
      entry.count += 1;
      entry.entries.push({
        id: deduction.id,
        salaryReportId: deduction.salaryReportId,
        amount: deduction.amount,
        date: deduction.date,
        isApplied: deduction.isApplied
      });

      return acc;
    }, {} as Record<string, DeductionBreakdownEntry>);
  }

  getMetadataEntries(): { label: string; value: string }[] {
    if (!this.report) {
      return [];
    }

    const entries: { label: string; value: string }[] = [
      {
        label: 'GeneratedDate',
        value: this.formatDateTime(this.report.generatedDate)
      },
      {
        label: 'ReportId',
        value: this.report.id?.toString() ?? '-'
      },
      {
        label: 'EmployeeId',
        value: this.report.employeeId?.toString() ?? '-'
      },
      {
        label: 'PaymentStatus',
        value: this.translate.instant(this.getStatusText(this.report.isPaid))
      }
    ];

    if (this.report.paidDate) {
      entries.push({
        label: 'PaidDate',
        value: this.formatDateTime(this.report.paidDate)
      });
    }

    if (this.report.workRule?.category) {
      entries.push({
        label: 'WorkRuleCategory',
        value: this.report.workRule.category
      });
    }

    return entries;
  }

  toggleRawDeductionJson(): void {
    this.showRawDeductionJson = !this.showRawDeductionJson;
  }

  private buildLocalizedCalculationBreakdown(breakdown?: CalculationBreakdownDto): LocalizedBreakdownLine[] {
    if (!breakdown) {
      return [];
    }

    const formatHours = (value?: number) => {
      const locale = this.getCurrentLocale();
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value ?? 0);
    };

    const lines: LocalizedBreakdownLine[] = [];

    lines.push({
      text: this.translate.instant('CalculationBreakdown.BaseSalaryLine', {
        amount: this.formatCurrency(breakdown.baseSalaryAmount ?? 0)
      })
    });

    lines.push({
      text: this.translate.instant('CalculationBreakdown.HoursLine', {
        expected: formatHours(breakdown.expectedHours),
        worked: formatHours(breakdown.workedHours),
        deficit: formatHours(breakdown.hoursDeficit),
        surplus: formatHours(breakdown.hoursSurplus)
      })
    });

    if ((breakdown.overtimeHours ?? 0) > 0) {
      lines.push({
        text: this.translate.instant('CalculationBreakdown.OvertimeLine', {
          hours: formatHours(breakdown.overtimeHours),
          rate: this.formatCurrency(breakdown.overtimeRate ?? 0),
          payment: this.formatCurrency(breakdown.overtimePayment ?? 0)
        })
      });
    } else {
      lines.push({
        text: this.translate.instant('CalculationBreakdown.NoOvertimeLine')
      });
    }

    if ((breakdown.totalDeductionsAmount ?? 0) > 0) {
      lines.push({
        text: this.translate.instant('CalculationBreakdown.DeductionsLine', {
          count: breakdown.deductionsCount ?? 0,
          amount: this.formatCurrency(breakdown.totalDeductionsAmount ?? 0)
        })
      });
    } else {
      lines.push({
        text: this.translate.instant('CalculationBreakdown.NoDeductionsLine')
      });
    }

    if ((breakdown.totalBonusesAmount ?? 0) > 0) {
      lines.push({
        text: this.translate.instant('CalculationBreakdown.BonusesLine', {
          count: breakdown.bonusesCount ?? 0,
          amount: this.formatCurrency(breakdown.totalBonusesAmount ?? 0)
        })
      });
    } else {
      lines.push({
        text: this.translate.instant('CalculationBreakdown.NoBonusesLine')
      });
    }

    lines.push({
      text: this.translate.instant('CalculationBreakdown.FinalLine', {
        gross: this.formatCurrency(breakdown.grossSalary ?? 0),
        deductions: this.formatCurrency(breakdown.totalDeductionsAmount ?? 0),
        bonuses: this.formatCurrency(breakdown.totalBonusesAmount ?? 0),
        net: this.formatCurrency(breakdown.netSalary ?? 0)
      }),
      isFinal: true
    });

    return lines;
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

  formatCurrency(amount: number | null | undefined): string {
    const locale = this.getCurrentLocale();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EGP'
    }).format(amount ?? 0);
  }

  formatDate(dateString: string): string {
    const locale = this.getCurrentLocale();
    return new Date(dateString).toLocaleDateString(locale);
  }

  formatNumber(value?: number | null, fractionDigits: number = 2): string {
    const locale = this.getCurrentLocale();
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(value ?? 0);
  }

  formatDateTime(dateString: string): string {
    const locale = this.getCurrentLocale();
    return new Date(dateString).toLocaleString(locale);
  }

  private getCurrentLocale(): string {
    switch (this.translate.currentLang) {
      case 'ar':
        return 'ar-EG';
      case 'it':
        return 'it-IT';
      default:
        return 'en-US';
    }
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
    const typeKey = typeof type === 'string' ? type : this.mapNumericWorkRuleType(type);
    const translationKey = `WorkRuleType.${typeKey}`;
    const translated = this.translate.instant(translationKey);
    return translated !== translationKey ? translated : typeKey.toString();
  }

  private mapNumericWorkRuleType(value: number): string | number {
    const map: Record<number, string> = {
      0: 'Daily',
      1: 'Weekly',
      2: 'Monthly',
      3: 'Hourly',
      4: 'Custom'
    };
    return map[value] ?? value;
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
