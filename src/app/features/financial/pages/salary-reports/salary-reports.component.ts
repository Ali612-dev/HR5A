import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { faArrowLeft, faFileInvoice, faFilter, faPlus, faDownload, faTimes, faSearch, faCalendar, faCalendarAlt, faCheckCircle, faUndo } from '@fortawesome/free-solid-svg-icons';
import { SalaryReportsStore } from '../../../../store/salary-reports.store';
import { ResponsiveSalaryReportsTableComponent } from '../../../../shared/components/responsive-salary-reports-table/responsive-salary-reports-table.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { NotificationDialogComponent, NotificationDialogData } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { FinancialService } from '../../../../core/services/financial.service';
import { SalaryReportDto } from '../../../../core/interfaces/financial.interface';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { CreateSalaryReportDialogComponent } from './create-salary-report-dialog.component';

@Component({
  selector: 'app-salary-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    ResponsiveSalaryReportsTableComponent
  ],
  template: `
    <div class="salary-reports-container">
      <div class="container-fluid py-4">
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <button class="btn btn-ghost" routerLink="/admin/financial">
              <fa-icon [icon]="faArrowLeft" class="me-2"></fa-icon>
              {{ 'Back' | translate }}
            </button>
            <div class="page-title">
              <fa-icon [icon]="faFileInvoice" class="me-2"></fa-icon>
              {{ 'SalaryReports' | translate }}
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-ghost" (click)="onCreateReport()">
              <fa-icon [icon]="faPlus" class="me-2"></fa-icon>
              {{ 'CreateSalaryReport' | translate }}
            </button>
            <button class="btn btn-ghost" (click)="toggleFilter()">
              <fa-icon [icon]="faFilter" class="me-2"></fa-icon>
              {{ 'Filter' | translate }}
            </button>
            <button class="btn btn-ghost" (click)="exportReports()">
              <fa-icon [icon]="faDownload" class="me-2"></fa-icon>
              {{ 'ExportAll' | translate }}
            </button>
          </div>
        </div>

        <!-- Filtering -->
        <div *ngIf="!isFilterCollapsed" class="glass-card filter-card">
          <div class="filter-header">
            <h5 class="filter-title">
              <fa-icon [icon]="faFilter" class="me-2"></fa-icon>
              {{ 'FilterFactors' | translate }}
            </h5>
            <button type="button" class="btn btn-sm btn-ghost filter-close" (click)="toggleFilter()">
              <fa-icon [icon]="faTimes"></fa-icon>
            </button>
          </div>
          
          <form [formGroup]="filterForm" (ngSubmit)="onFilter()" class="filters-container">
            <!-- First Row - Employee Search -->
            <div class="filter-row">
              <div class="filter-group filter-group-large">
                <label class="filter-label">
                  <fa-icon [icon]="faSearch" class="me-1"></fa-icon>
                  {{ 'Employee' | translate }}
                </label>
                <input type="text" class="filter-input" formControlName="searchTerm" 
                       [placeholder]="'SearchByEmployeeName' | translate">
                <small class="search-hint">
                  {{ 'TypeAtLeast3Characters' | translate }}
                </small>
              </div>
            </div>

            <!-- Second Row - Date Range Filters -->
            <div class="filter-row">
              <div class="filter-group">
                <label class="filter-label">
                  <fa-icon [icon]="faCalendar" class="me-1"></fa-icon>
                  {{ 'StartDate' | translate }}
                </label>
                <input type="date" class="filter-input" formControlName="startDate">
              </div>

              <div class="filter-group">
                <label class="filter-label">
                  <fa-icon [icon]="faCalendarAlt" class="me-1"></fa-icon>
                  {{ 'EndDate' | translate }}
                </label>
                <input type="date" class="filter-input" formControlName="endDate">
              </div>
            </div>

            <!-- Third Row - Month, Year, and Status Filters -->
            <div class="filter-row">
              <div class="filter-group">
                <label class="filter-label">
                  <fa-icon [icon]="faCalendar" class="me-1"></fa-icon>
                  {{ 'Month' | translate }}
                </label>
                <select class="filter-select" formControlName="month">
                  <option value="">{{ 'AllMonths' | translate }}</option>
                  <option *ngFor="let month of monthOptions" [value]="month.value">
                    {{ month.label }}
                  </option>
                </select>
              </div>

              <div class="filter-group">
                <label class="filter-label">
                  <fa-icon [icon]="faCalendarAlt" class="me-1"></fa-icon>
                  {{ 'Year' | translate }}
                </label>
                <select class="filter-select" formControlName="year">
                  <option value="">{{ 'AllYears' | translate }}</option>
                  <option *ngFor="let year of yearOptions" [value]="year">
                    {{ year }}
                  </option>
                </select>
              </div>

              <div class="filter-group">
                <label class="filter-label">
                  <fa-icon [icon]="faCheckCircle" class="me-1"></fa-icon>
                  {{ 'Status' | translate }}
                </label>
                <select class="filter-select" formControlName="isPaid">
                  <option value="">{{ 'AllStatuses' | translate }}</option>
                  <option value="true">{{ 'Paid' | translate }}</option>
                  <option value="false">{{ 'Unpaid' | translate }}</option>
                </select>
              </div>
            </div>

            <!-- Action Buttons Row -->
            <div class="filter-actions">
              <button type="submit" class="btn btn-primary filter-btn-apply">
                <fa-icon [icon]="faFilter" class="me-1"></fa-icon>
                {{ 'ApplyFilters' | translate }}
              </button>
              <button type="button" class="btn btn-secondary filter-btn-reset" (click)="onResetFilters()">
                <fa-icon [icon]="faUndo" class="me-1"></fa-icon>
                {{ 'Reset' | translate }}
              </button>
            </div>
          </form>
        </div>

        <!-- Salary Reports Table -->
        <app-responsive-salary-reports-table
          [reports]="reports"
          [totalCount]="totalCount"
          [isLoading]="isLoading"
          [error]="error"
          [currentPage]="currentPage"
          [pageSize]="pageSize"
          [sortField]="sortField"
          [sortOrder]="sortOrder"
          (sort)="onSort($event)"
          (view)="onViewReport($event)"
          (edit)="onEditReport($event)"
          (delete)="onDeleteReport($event)"
          (download)="onDownloadReport($event)"
          (markAsPaid)="onMarkAsPaid($event)"
          (retry)="onRetryReports()"
          (createReport)="onCreateReport()">
        </app-responsive-salary-reports-table>

      </div>
    </div>
  `,
  styles: [`
    .salary-reports-container {
      min-height: 100vh;
      background: #f3f4f6 !important;
      padding: 32px;
      width: 100%;
      max-width: 100%;
      margin: 0;
    }
    
    .salary-reports-container .container-fluid {
      padding: 0;
      margin: 0;
      max-width: 100%;
      width: 100%;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      position: relative;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
      justify-content: flex-end;
    }
    
    .page-title {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1f2937;
      font-size: 1.5rem;
      font-weight: 600;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      padding: 0 2rem;
    }
    
    .page-title fa-icon {
      color: #f97316 !important;
      margin-right: 0.5rem;
    }
    
    .glass-card {
      background: #ffffff;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 15px;
      color: #1f2937;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    .glass-body {
      padding: 1.5rem;
    }
    
    .btn-ghost {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.15)) !important;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(249, 115, 22, 0.3) !important;
      color: #f97316 !important;
      transition: all 0.3s ease;
      padding: 0.75rem 1.5rem !important;
      border-radius: 12px !important;
      font-weight: 600;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      position: relative;
      overflow: hidden;
    }
    
    .btn-ghost::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.5s ease;
    }
    
    .btn-ghost:hover {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(234, 88, 12, 0.25)) !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.3);
      border-color: rgba(249, 115, 22, 0.5) !important;
      color: #ea580c !important;
    }
    
    .btn-ghost:hover::before {
      left: 100%;
    }
    
    .btn-ghost fa-icon {
      font-size: 1rem;
    }

    /* Filter Card Styles */
    .filter-card {
      margin-bottom: 2rem;
      border-radius: 20px;
      overflow: hidden;
    }

    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: #f3f4f6;
      border-bottom: 1px solid rgba(209, 213, 219, 0.8);
    }

    .filter-title {
      margin: 0;
      color: #1f2937;
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .filter-title fa-icon {
      font-size: 1.1rem;
      color: #6b7280;
    }

    .filter-close {
      padding: 0.5rem !important;
      min-width: auto;
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .filters-container {
      padding: 2rem;
    }

    .filter-row {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .filter-row:last-of-type {
      margin-bottom: 0;
    }

    .filter-group {
      flex: 1;
      min-width: 200px;
    }

    .filter-group-large {
      flex: 2;
      min-width: 300px;
    }

    .filter-label {
      display: block;
      color: #1f2937;
      font-weight: 500;
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      gap: 0.5rem;
    }

    .filter-label fa-icon {
      font-size: 0.9rem;
      color: #6b7280;
      margin-right: 0.25rem;
      flex-shrink: 0;
    }

    .filter-input,
    .filter-select {
      width: 100%;
      padding: 0.875rem 1rem;
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 12px;
      color: #1f2937;
      font-size: 0.95rem;
      transition: all 0.3s ease;
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
    }

    .filter-input[type="date"] {
      color-scheme: light;
    }

    .filter-input[type="date"]::-webkit-calendar-picker-indicator {
      filter: none;
      cursor: pointer;
    }

    .filter-input::placeholder {
      color: #9ca3af;
    }

    .filter-input:focus,
    .filter-select:focus {
      outline: none;
      border-color: rgba(102, 126, 234, 0.5);
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .search-hint {
      display: block;
      margin-top: 0.25rem;
      color: #6b7280;
      font-size: 0.75rem;
      font-style: italic;
    }

    .filter-select option {
      background: #ffffff;
      color: #1f2937;
      padding: 0.5rem;
    }

    .filter-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(209, 213, 219, 0.8);
    }

    .filter-btn-apply,
    .filter-btn-reset {
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .filter-btn-apply fa-icon,
    .filter-btn-reset fa-icon {
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .filter-btn-apply {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.2));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(249, 115, 22, 0.4);
      color: #f97316;
      position: relative;
      overflow: hidden;
    }
    
    .filter-btn-apply::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transition: left 0.5s ease;
    }

    .filter-btn-apply:hover {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(234, 88, 12, 0.3));
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
      border-color: rgba(249, 115, 22, 0.6);
      color: #ea580c;
    }
    
    .filter-btn-apply:hover::before {
      left: 100%;
    }

    .filter-btn-reset {
      background: rgba(249, 250, 251, 0.8);
      border: 1px solid rgba(229, 231, 235, 0.8);
      color: #1f2937;
    }

    .filter-btn-reset:hover {
      background: rgba(255, 255, 255, 1);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      border-color: rgba(209, 213, 219, 0.8);
    }

    .filter-card .glass-body {
      padding: 1.5rem;
    }

    .filters-container .form-label {
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .filters-container .form-control,
    .filters-container .form-select {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      backdrop-filter: blur(5px);
    }

    .filters-container .form-control:focus,
    .filters-container .form-select:focus {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.4);
      color: white;
      box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25);
    }

    .filters-container .form-control::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .filters-container .form-select option {
      background: #2d3748;
      color: white;
    }

    .filter-buttons {
      display: flex;
      gap: 0.5rem;
    }


    /* Responsive adjustments */
    @media (max-width: 1024px) {
      .salary-reports-container {
        padding: 24px 16px;
      }

      .page-title {
        font-size: 1.35rem;
      }

      .filter-row {
        gap: 1rem;
      }

      .filter-group {
        min-width: 180px;
      }
    }

    @media (max-width: 768px) {
      .salary-reports-container {
        padding: 20px 12px;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .header-left {
        width: 100%;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .header-actions {
        width: 100%;
        flex-direction: row;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .header-actions button {
        flex: 1;
        min-width: 140px;
      }

      .page-title {
        font-size: 1.25rem;
        width: 100%;
        position: static;
        transform: none;
        left: auto;
        padding: 0 1rem;
        justify-content: flex-start;
      }

      .btn-ghost {
        padding: 0.6rem 1.2rem !important;
        min-height: 40px;
        font-size: 0.9rem;
        width: auto;
      }

      .filters-container .row {
        flex-direction: column;
      }

      .filter-buttons {
        width: 100%;
        justify-content: center;
      }


      /* Filter responsive adjustments */
      .filter-header {
        padding: 1rem 1.5rem;
      }

      .filter-title {
        font-size: 1.1rem;
        gap: 0.5rem;
      }

      .filters-container {
        padding: 1.5rem;
      }

      .filter-row {
        flex-direction: column;
        gap: 1rem;
      }

      .filter-group,
      .filter-group-large {
        min-width: 100%;
        flex: none;
      }

      .filter-actions {
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1.5rem;
        padding-top: 1.25rem;
      }

      .filter-btn-apply,
      .filter-btn-reset {
        width: 100%;
      }
    }

    @media (max-width: 640px) {
      .salary-reports-container {
        padding: 16px 8px;
      }

      .page-title {
        font-size: 1.15rem;
      }

      .btn-ghost {
        padding: 0.55rem 1rem !important;
        min-height: 38px;
        font-size: 0.875rem;
      }

      .header-actions button {
        flex: 1 1 100%;
        min-width: 100%;
      }

      .filter-card {
        margin-bottom: 1.5rem;
      }

      .filter-header {
        padding: 0.875rem 1.25rem;
      }

      .filter-title {
        font-size: 1.05rem;
      }

      .filters-container {
        padding: 1.25rem;
      }

      .filter-input,
      .filter-select {
        padding: 0.8rem 0.9rem;
        font-size: 0.925rem;
      }

      .filter-label {
        font-size: 0.875rem;
        margin-bottom: 0.6rem;
      }

      .filter-actions {
        margin-top: 1.25rem;
        padding-top: 1rem;
      }

    }

    @media (max-width: 480px) {
      .salary-reports-container {
        padding: 12px 8px;
      }

      .page-header {
        margin-bottom: 1rem;
      }

      .header-left {
        gap: 0.5rem;
      }

      .page-title {
        font-size: 1.05rem;
      }

      .btn-ghost {
        padding: 0.5rem 0.875rem !important;
        min-height: 36px;
        font-size: 0.825rem;
      }

      .btn-ghost fa-icon {
        font-size: 0.875rem;
      }

      .header-actions {
        gap: 0.5rem;
      }

      .header-actions button {
        padding: 0.5rem 0.75rem !important;
      }

      /* Mobile filter adjustments */
      .filter-header {
        padding: 0.75rem 1rem;
      }

      .filter-title {
        font-size: 0.95rem;
        gap: 0.4rem;
      }

      .filter-title fa-icon {
        font-size: 0.95rem;
      }

      .filter-close {
        width: 36px;
        height: 36px;
        padding: 0.4rem !important;
      }

      .filters-container {
        padding: 1rem;
      }

      .filter-row {
        gap: 0.875rem;
        margin-bottom: 1rem;
      }

      .filter-input,
      .filter-select {
        padding: 0.7rem 0.8rem;
        font-size: 0.875rem;
        border-radius: 10px;
      }

      .filter-label {
        font-size: 0.8rem;
        margin-bottom: 0.5rem;
      }

      .filter-label fa-icon {
        font-size: 0.8rem;
      }

      .search-hint {
        font-size: 0.7rem;
      }

      .filter-actions {
        gap: 0.625rem;
        margin-top: 1rem;
        padding-top: 0.875rem;
      }

      .filter-btn-apply,
      .filter-btn-reset {
        padding: 0.65rem 1.25rem;
        font-size: 0.85rem;
        min-height: 40px;
        border-radius: 10px;
      }

      .filter-btn-apply fa-icon,
      .filter-btn-reset fa-icon {
        font-size: 0.85rem;
      }

    }

    @media (max-width: 375px) {
      .salary-reports-container {
        padding: 10px 6px;
      }

      .page-title {
        font-size: 0.95rem;
      }

      .btn-ghost {
        padding: 0.45rem 0.75rem !important;
        min-height: 34px;
        font-size: 0.775rem;
      }

      .filter-title {
        font-size: 0.875rem;
      }

      .filter-input,
      .filter-select {
        padding: 0.625rem 0.75rem;
        font-size: 0.825rem;
      }

      .filter-label {
        font-size: 0.75rem;
      }

      .filter-btn-apply,
      .filter-btn-reset {
        padding: 0.6rem 1rem;
        font-size: 0.8rem;
        min-height: 38px;
      }

      .pagination-controls .btn {
        padding: 0.4rem 0.65rem;
        font-size: 0.75rem;
        min-height: 34px;
      }

      .pagination-controls .mx-3 {
        font-size: 0.8rem;
      }
    }
  `]
})
export class SalaryReportsComponent implements OnInit, OnDestroy {
  readonly store = inject(SalaryReportsStore);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private financialService = inject(FinancialService);
  private destroy$ = new Subject<void>();

  filterForm!: FormGroup;
  isFilterCollapsed: boolean = true;

  // Getter methods for template
  get reports() { return this.store.reports(); }
  get totalCount() { return this.store.totalCount(); }
  get isLoading() { return this.store.isLoading(); }
  get error() { return this.store.error(); }
  get currentPage() { return (this.store.request() as any).pageNumber || 1; }
  get pageSize() { return (this.store.request() as any).pageSize || 10; }
  get sortField() { return (this.store.request() as any).sortField || 'generatedDate'; }
  get sortOrder() { return (this.store.request() as any).sortOrder || 'desc'; }

  // FontAwesome Icons
  faArrowLeft = faArrowLeft;
  faFileInvoice = faFileInvoice;
  faFilter = faFilter;
  faPlus = faPlus;
  faDownload = faDownload;
  faTimes = faTimes;
  faSearch = faSearch;
  faCalendar = faCalendar;
  faCalendarAlt = faCalendarAlt;
  faCheckCircle = faCheckCircle;
  faUndo = faUndo;

  // Options for dropdowns
  monthOptions = [
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

  yearOptions: number[] = [];

  ngOnInit(): void {
    this.initializeForm();
    this.initializeYearOptions();
    this.loadSalaryReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      startDate: [''],
      endDate: [''],
      month: [''],
      year: [''],
      isPaid: ['']
    });

    // Set up debounced search for employee name
    this.filterForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged(), // Only emit if value has changed
        takeUntil(this.destroy$) // Unsubscribe when component is destroyed
      )
      .subscribe(searchTerm => {
        console.log('🔍 Debounced search term:', searchTerm);
        
        // Only search if user has typed at least 3 characters or cleared the field
        if (!searchTerm || searchTerm.length >= 3) {
          console.log('✅ Search term meets criteria, applying search-only filters...');
          this.applySearchOnly(searchTerm);
        } else if (searchTerm.length > 0 && searchTerm.length < 3) {
          console.log('⏳ Search term too short, waiting for more characters...');
        }
      });
  }

  private initializeYearOptions(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      this.yearOptions.push(i);
    }
  }

  loadSalaryReports(): void {
    this.store.loadSalaryReports();
  }

  toggleFilter(): void {
    this.isFilterCollapsed = !this.isFilterCollapsed;
  }

  onFilter(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    const formValue = this.filterForm.value;
    
    console.log('🔍 Applying filters with form value:', formValue);
    
    const request = {
      searchTerm: formValue.searchTerm || undefined,
      startDate: formValue.startDate || undefined,
      endDate: formValue.endDate || undefined,
      month: formValue.month ? Number(formValue.month) : undefined,
      year: formValue.year ? Number(formValue.year) : undefined,
      isPaid: formValue.isPaid !== '' ? formValue.isPaid === 'true' : undefined,
      pageNumber: 1 // Reset to first page when filtering
    };
    
    console.log('📤 Updating store request with:', request);
    console.log('🎯 About to call loadSalaryReports() - this should trigger API call');
    
    this.store.updateRequest(request);
    this.loadSalaryReports();
    
    console.log('✅ loadSalaryReports() called - check network tab for API call');
  }

  private applySearchOnly(searchTerm: string): void {
    console.log('🔍 Applying search-only filter for term:', searchTerm);
    
    const currentFormValue = this.filterForm.value;
    const request = {
      searchTerm: searchTerm || undefined,
      startDate: currentFormValue.startDate || undefined,
      endDate: currentFormValue.endDate || undefined,
      month: currentFormValue.month ? Number(currentFormValue.month) : undefined,
      year: currentFormValue.year ? Number(currentFormValue.year) : undefined,
      isPaid: currentFormValue.isPaid !== '' ? currentFormValue.isPaid === 'true' : undefined,
      pageNumber: 1
    };
    
    console.log('📤 Updating store with search-only request:', request);
    console.log('🎯 About to call loadSalaryReports() for search...');
    
    this.store.updateRequest(request);
    this.loadSalaryReports();
    
    console.log('✅ Search-only loadSalaryReports() called - check network tab for API call');
  }

  onResetFilters(): void {
    this.filterForm.reset();
    this.store.updateRequest({
      searchTerm: undefined,
      startDate: undefined,
      endDate: undefined,
      month: undefined,
      year: undefined,
      isPaid: undefined,
      pageNumber: 1
    });
    this.loadSalaryReports();
  }

  onSort(event: { field: string; order: 'asc' | 'desc' }): void {
    this.store.setSorting(event.field, event.order);
    this.loadSalaryReports();
  }

  onPageChange(pageNumber: number): void {
    this.store.setPage(pageNumber);
    this.loadSalaryReports();
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.store.setPageSize(Number(target.value));
    this.loadSalaryReports();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  // Event handlers for table actions
  onViewReport(report: SalaryReportDto): void {
    this.router.navigate(['/admin/financial/salary-reports', report.id]);
  }

  onEditReport(report: SalaryReportDto): void {
    console.log('Edit report:', report);
    // TODO: Implement edit report functionality
  }

  onDeleteReport(report: SalaryReportDto): void {
    const dialogData: ConfirmationDialogData = {
      title: this.translate.instant('DeleteSalaryReport'),
      message: this.translate.instant('DeleteSalaryReportConfirmation', { 
        employeeName: report.employeeName,
        month: report.reportMonth,
        year: report.reportYear
      }),
      confirmButtonText: this.translate.instant('Delete'),
      cancelButtonText: this.translate.instant('Cancel')
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteSalaryReport(report.id);
      }
    });
  }

  private deleteSalaryReport(reportId: number): void {
    this.financialService.deleteSalaryReport(reportId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            console.log('✅ Salary report deleted successfully');
            this.showNotification(
              this.translate.instant('Success'),
              this.translate.instant('SalaryReportDeletedSuccessfully'),
              true
            );
            // Refresh the reports list
            this.loadSalaryReports();
          } else {
            console.error('❌ Failed to delete salary report:', response.message);
            this.showNotification(
              this.translate.instant('Error'),
              response.message || this.translate.instant('FailedToDeleteSalaryReport'),
              false
            );
          }
        },
        error: (error) => {
          console.error('❌ Error deleting salary report:', error);
          let errorMessage = this.translate.instant('FailedToDeleteSalaryReport');
          
          // Extract error message from server response and translate it
          if (error.error?.message) {
            // Translate common server error messages
            const serverMessage = error.error.message.toLowerCase();
            if (serverMessage.includes('internal server error')) {
              errorMessage = this.translate.instant('InternalServerError');
            } else if (serverMessage.includes('not found')) {
              errorMessage = this.translate.instant('SalaryReportNotFound');
            } else if (serverMessage.includes('access denied') || serverMessage.includes('unauthorized')) {
              errorMessage = this.translate.instant('AccessDenied');
            } else {
              // Use the server message as is if it's not a common error
              errorMessage = error.error.message;
            }
          } else if (error.status === 500) {
            errorMessage = this.translate.instant('InternalServerError');
          } else if (error.status === 404) {
            errorMessage = this.translate.instant('SalaryReportNotFound');
          } else if (error.status === 403) {
            errorMessage = this.translate.instant('AccessDenied');
          }
          
          this.showNotification(
            this.translate.instant('Error'),
            errorMessage,
            false
          );
        }
      });
  }

  private showNotification(title: string, message: string, isSuccess: boolean): void {
    const dialogData: NotificationDialogData = {
      title,
      message,
      isSuccess
    };

    this.dialog.open(NotificationDialogComponent, {
      width: '400px',
      data: dialogData,
      disableClose: false
    });
  }

  onRetryReports(): void {
    this.loadSalaryReports();
  }

  onCreateReport(): void {
    const dialogRef = this.dialog.open(CreateSalaryReportDialogComponent, {
      panelClass: 'glass-dialog-panel',
      backdropClass: 'transparent-backdrop',
      width: '95vw',
      maxWidth: '95vw',
      height: '85vh',
      maxHeight: '85vh',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Reload salary reports after successful creation
        this.loadSalaryReports();
      }
    });
  }

  onDownloadReport(report: SalaryReportDto): void {
    console.log('Download report:', report);
    // TODO: Implement download functionality
  }

  onMarkAsPaid(report: SalaryReportDto): void {
    console.log('Mark as paid:', report);
    // TODO: Implement mark as paid functionality
  }

  onRetryLoadReports(): void {
    this.store.retryLoadReports();
  }

  exportReports(): void {
    console.log('Export all reports');
    // TODO: Implement export all functionality
  }
}
