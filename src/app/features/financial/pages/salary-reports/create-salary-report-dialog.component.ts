import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { EmployeeSelectorComponent } from '../../../employees/components/employee-selector/employee-selector.component';
import { FinancialService } from '../../../../core/services/financial.service';
import { CreateSalaryReportDto } from '../../../../core/interfaces/financial.interface';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-create-salary-report-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, EmployeeSelectorComponent],
  template: `
    <div class="create-report-dialog">
      <div class="dialog-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">{{ 'CreateSalaryReport' | translate }}</h5>
        <button type="button" class="btn-close-dialog" (click)="close()">
          <span>&times;</span>
        </button>
      </div>

      <div class="dialog-body">
        <!-- Employee Selector -->
        <div class="form-section mb-4">
          <label class="form-label">
            <strong>{{ 'SelectEmployee' | translate }}</strong>
          </label>
          <app-employee-selector 
            [singleSelection]="true"
            (selectedChange)="onSelected($event)" 
            (selectedEmployeesChange)="onSelectedEmployees($event)">
          </app-employee-selector>
        </div>

        <!-- Report Details Form -->
        <div class="form-section">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">
                <strong>{{ 'ReportMonth' | translate }}</strong>
              </label>
              <select class="form-control" [(ngModel)]="reportMonth" [disabled]="isCreating">
                <option *ngFor="let month of monthOptions" [value]="month.value">
                  {{ month.label }}
                </option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">
                <strong>{{ 'ReportYear' | translate }}</strong>
              </label>
              <select class="form-control" [(ngModel)]="reportYear" [disabled]="isCreating">
                <option *ngFor="let year of yearOptions" [value]="year">
                  {{ year }}
                </option>
              </select>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">
              <strong>{{ 'ReportNotes' | translate }}</strong>
              <small class="text-muted">({{ 'Optional' | translate }})</small>
            </label>
            <textarea 
              class="form-control" 
              [(ngModel)]="notes" 
              rows="3" 
              [maxlength]="500"
              [placeholder]="'EnterReportNotes' | translate"
              [disabled]="isCreating">
            </textarea>
               <small class="text-muted">{{ (notes || '').length }}/500 {{ 'CharactersMax' | translate }}</small>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="btn btn-secondary me-2" (click)="close()" [disabled]="isCreating">
          {{ 'Cancel' | translate }}
        </button>
        <button class="btn btn-primary" (click)="createReport()" [disabled]="!canCreate() || isCreating">
          <span *ngIf="isCreating">{{ 'CreatingReport' | translate }}</span>
          <span *ngIf="!isCreating">{{ 'CreateReport' | translate }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .create-report-dialog { 
      min-width: 900px; 
      max-width: 100%; 
      background: #f8f9fa;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 85vh;
    }
    .dialog-header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-bottom: none;
      padding: 1.5rem 2rem; 
      margin-bottom: 0;
      position: relative;
    }
    .dialog-header h5 {
      color: white;
      font-weight: 600;
      margin: 0;
      font-size: 1.25rem;
    }
    .btn-close-dialog {
      background: transparent;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.3s ease;
    }
    .btn-close-dialog:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .dialog-body { 
      background: #ffffff;
      padding: 2rem; 
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
    .form-section {
      margin-bottom: 1.5rem;
    }
    .form-label {
      display: block;
      margin-bottom: 0.75rem;
      color: #495057;
      font-size: 0.95rem;
    }
    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: all 0.3s ease;
    }
    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .form-control:disabled {
      background-color: #e9ecef;
      cursor: not-allowed;
    }
    textarea.form-control {
      resize: vertical;
    }
    .dialog-actions { 
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      padding: 1.5rem 2rem;
      margin-top: 0;
      display: flex;
      justify-content: flex-end;
      flex-shrink: 0;
    }
    .dialog-actions .btn { 
      min-width: 140px; 
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .dialog-actions .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border: none;
      color: white;
    }
    .dialog-actions .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #5a6fd8, #6a4190);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
    }
    .dialog-actions .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .dialog-actions .btn-secondary {
      background: #6c757d;
      border: 1px solid #6c757d;
      color: white;
    }
    .dialog-actions .btn-secondary:hover:not(:disabled) {
      background: #5a6268;
      border-color: #545b62;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
    }
    .dialog-actions .btn-secondary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class CreateSalaryReportDialogComponent implements OnInit {
  private translate = inject(TranslateService);
  private financialService = inject(FinancialService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  selectedEmployee: any = null;
  reportMonth: number = new Date().getMonth() + 1;
  reportYear: number = new Date().getFullYear();
  notes: string = '';
  isCreating: boolean = false;

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

  constructor(
    private ref: MatDialogRef<CreateSalaryReportDialogComponent>
  ) {}

  ngOnInit(): void {
    this.initializeYearOptions();
  }

  private initializeYearOptions(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      this.yearOptions.push(i);
    }
  }

  onSelected(ids: number[]): void {
    // Handle selection change if needed
  }

  onSelectedEmployees(employees: any[]): void {
    if (employees.length === 1) {
      this.selectedEmployee = employees[0];
    } else {
      this.selectedEmployee = null;
    }
  }

  canCreate(): boolean {
    return this.selectedEmployee !== null && 
           this.selectedEmployee.id !== null && 
           this.reportMonth >= 1 && 
           this.reportMonth <= 12 && 
           this.reportYear >= 2020 && 
           this.reportYear <= 2030;
  }

  close(): void {
    this.ref.close(null);
  }

  createReport(): void {
    if (!this.canCreate()) {
      return;
    }

    this.isCreating = true;

    const createReportDto: CreateSalaryReportDto = {
      employeeId: this.selectedEmployee.id,
      reportMonth: this.reportMonth,
      reportYear: this.reportYear,
      notes: this.notes?.trim() || undefined
    };

    // Show loading dialog
    const loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title: this.translate.instant('LOADING.TITLE'),
        message: this.translate.instant('LOADING.CREATE_SALARY_REPORT'),
        isSuccess: true
      },
      disableClose: true
    });

    this.financialService.calculateSalary(createReportDto).subscribe({
      next: (response) => {
        loadingDialogRef.close();
        this.isCreating = false;

        if (response.isSuccess && response.data) {
          // Show success message
          const employeeName = this.selectedEmployee.name || this.selectedEmployee.fullName || `Employee #${this.selectedEmployee.id}`;
          const successMessage = this.translate.instant('ReportCreatedSuccessfully', { employeeName });
          
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('SUCCESS.TITLE'),
              message: successMessage,
              isSuccess: true
            }
          });

          // Close this dialog
          this.ref.close(true);

          // Navigate to salary report details page
          const reportId = response.data.id;
          this.router.navigate(['/admin/financial/salary-reports', reportId]);
        } else {
          // Handle error response (status 200 but isSuccess: false)
          const employeeName = this.selectedEmployee?.name || this.selectedEmployee?.fullName || `Employee #${this.selectedEmployee?.id}`;
          let errorMessage = this.translate.instant('ReportCreationFailed', { employeeName });
          
          // If server returned an error message, use it
          if (response.message) {
            // Try to translate the error message if it's a known key
            const translatedError = this.translate.instant(response.message);
            errorMessage = translatedError !== response.message ? translatedError : response.message;
          } else if (response.errors && response.errors.length > 0) {
            // Use errors array if message is not available
            errorMessage = response.errors.join(', ');
          }
          
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: errorMessage,
              isSuccess: false
            }
          });
        }
      },
      error: (error) => {
        loadingDialogRef.close();
        this.isCreating = false;

        console.error('Error creating salary report:', error);
        
        const employeeName = this.selectedEmployee?.name || this.selectedEmployee?.fullName || `Employee #${this.selectedEmployee?.id}`;
        let errorMessage = this.translate.instant('ReportCreationFailed', { employeeName });
        
        // Only show server error message if status is 400 or 200
        if (error.status === 400 || error.status === 200) {
          if (error.error?.message) {
            // Try to translate the error message if it's a known key
            const translatedError = this.translate.instant(error.error.message);
            errorMessage = translatedError !== error.error.message ? translatedError : error.error.message;
          } else if (error.error?.errors && error.error.errors.length > 0) {
            // Use errors array if message is not available
            errorMessage = error.error.errors.join(', ');
          } else if (error.message) {
            const translatedError = this.translate.instant(error.message);
            errorMessage = translatedError !== error.message ? translatedError : error.message;
          }
        }

        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          width: '500px',
          maxWidth: '90vw',
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: errorMessage,
            isSuccess: false
          }
        });
      }
    });
  }
}

