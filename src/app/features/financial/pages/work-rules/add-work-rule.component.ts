import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faClock,
  faSave,
  faTimes,
  faUserTie
} from '@fortawesome/free-solid-svg-icons';

import { FinancialService } from '../../../../core/services/financial.service';
import { CreateWorkRuleDto, WorkRuleType, CreateShiftDto } from '../../../../core/interfaces/financial.interface';
import { CustomDropdownComponent } from '../../../../shared/components/custom-dropdown/custom-dropdown.component';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { AssignWorkRuleDialogComponent } from './assign-work-rule-dialog.component';
import { ToggleSwitchComponent } from '../../../../shared/components/toggle-switch/toggle-switch.component';
import { EmployeeService } from '../../../../core/employee.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, catchError, forkJoin, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-add-work-rule',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    FontAwesomeModule,
    CustomDropdownComponent,
    ToggleSwitchComponent
  ],
  templateUrl: './add-work-rule.component.html',
  styleUrls: ['./add-work-rule.component.css']
})
export class AddWorkRuleComponent implements OnInit {
  private financialService = inject(FinancialService);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);

  // FontAwesome Icons
  faArrowLeft = faArrowLeft;
  faClock = faClock;
  faSave = faSave;
  faTimes = faTimes;
  faUserTie = faUserTie;

  // Form properties
  workRuleForm: FormGroup;
  assignedEmployeeForNewRule: any = null;
  private loadingDialogRef: MatDialogRef<NotificationDialogComponent> | null = null;

  // Options
  workRuleTypeOptions = this.financialService.getWorkRuleTypeOptions();

  constructor() {
    this.workRuleForm = this.fb.group({
      category: ['', [Validators.required, Validators.maxLength(100)]],
      type: [WorkRuleType.Custom, Validators.required],
      expectStartTime: [''],
      expectEndTime: [''],
      expectedHoursPerDay: [null, [Validators.min(1), Validators.max(24)]],
      expectedDaysPerWeek: [null, [Validators.min(1), Validators.max(7)]],
      paymentFrequency: [0],
      description: [''],
      isPrivate: [false],
      // Late & Early Departure Rules
      lateArrivalToleranceMinutes: [null, [Validators.min(0)]],
      earlyDepartureToleranceMinutes: [null, [Validators.min(0)]],
      lateDeductionMinutesPerHour: [null, [Validators.min(1)]],
      earlyDepartureDeductionMinutesPerHour: [null, [Validators.min(1)]],
      // Overtime Rules
      overtimeMultiplier: [null, [Validators.min(1)]],
      minimumOvertimeMinutes: [null, [Validators.min(0)]],
      // Absence Rules
      absenceDeductionMultiplier: [null, [Validators.min(0)]],
      allowedAbsenceDaysPerMonth: [null, [Validators.min(0)]],
      areOffDaysPaid: [true],
      allowWorkOnOffDays: [false],
      treatOffDayWorkAsOvertime: [false],
      offDayOvertimeMultiplier: [null, [Validators.min(0)]],
      offDayHourlyRate: [null, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Watch for changes in isPrivate field and clear assigned employee when it becomes false
    this.workRuleForm.get('isPrivate')?.valueChanges.subscribe(isPrivate => {
      if (!isPrivate) {
        this.assignedEmployeeForNewRule = null;
      }
    });

    this.workRuleForm.get('allowWorkOnOffDays')?.valueChanges.subscribe(allow => {
      if (!allow) {
        this.workRuleForm.patchValue({
          treatOffDayWorkAsOvertime: false,
          offDayOvertimeMultiplier: null,
          offDayHourlyRate: null
        });
      }
    });
  }

  getValidationErrors(fieldName: string): string[] {
    const control = this.workRuleForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return [];
    }

    const errors: string[] = [];
    if (control.errors['required']) {
      errors.push(this.translate.instant('ERROR.FIELD_REQUIRED'));
    }
    if (control.errors['minlength']) {
      errors.push(this.translate.instant('ERROR.MIN_LENGTH', { min: control.errors['minlength'].requiredLength }));
    }
    if (control.errors['maxlength']) {
      errors.push(this.translate.instant('ERROR.MAX_LENGTH', { max: control.errors['maxlength'].requiredLength }));
    }
    if (control.errors['min']) {
      errors.push(this.translate.instant('ERROR.MIN_VALUE', { min: control.errors['min'].min }));
    }
    if (control.errors['max']) {
      errors.push(this.translate.instant('ERROR.MAX_VALUE', { max: control.errors['max'].max }));
    }
    return errors;
  }

  openAssignDialogForNewRule(): void {
    const ref = this.dialog.open(AssignWorkRuleDialogComponent, {
      panelClass: 'glass-dialog-panel',
      backdropClass: 'transparent-backdrop',
      width: '95vw',
      maxWidth: '95vw',
      height: '85vh',
      maxHeight: '85vh',
      data: { isForNewRule: true }
    });

    ref.afterClosed().subscribe((selectedEmployee: any | null) => {
      if (selectedEmployee) {
        this.assignedEmployeeForNewRule = selectedEmployee;
      }
    });
  }

  removeAssignedEmployee(): void {
    this.assignedEmployeeForNewRule = null;
  }

  goBack(): void {
    this.router.navigate(['/admin/financial/work-rules']);
  }

  isHourlyRule(): boolean {
    const type = this.workRuleForm.get('type')?.value;
    return type === 'Hourly' || type === WorkRuleType.Hourly || type === 4;
  }

  onSubmit(): void {
    // Check required fields manually
    const category = this.workRuleForm.get('category')?.value;
    const type = this.workRuleForm.get('type')?.value;

    // Only validate if fields are actually empty
    if (!category || category.trim() === '' || !type) {
      const categoryControl = this.workRuleForm.get('category');
      const typeControl = this.workRuleForm.get('type');

      // Mark invalid fields
      if (!category || category.trim() === '') {
        categoryControl?.setErrors({ required: true });
        categoryControl?.markAsTouched();
        categoryControl?.markAsDirty();
      }

      if (!type) {
        typeControl?.markAsTouched();
        typeControl?.markAsDirty();
      }

      // Show localized error message  
      const errorMessage = this.translate.instant('ERROR.FILL_ALL_REQUIRED_FIELDS');
      this.showErrorDialog(errorMessage);
      return;
    }

    const formData = this.workRuleForm.value;
    this.createWorkRule(formData);
  }

  createWorkRule(data: any): void {
    // Show loading dialog
    this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title: this.translate.instant('LOADING.TITLE'),
        message: this.translate.instant('LOADING.CREATE_WORK_RULE'),
        isSuccess: true
      },
      disableClose: true
    });

    // Convert type enum to number
    const payload: CreateWorkRuleDto = {
      category: data.category,
      type: this.convertWorkRuleTypeToNumber(data.type),
      expectStartTime: data.expectStartTime || undefined,
      expectEndTime: data.expectEndTime || undefined,
      expectedHoursPerDay: data.expectedHoursPerDay || undefined,
      expectedDaysPerWeek: data.expectedDaysPerWeek || undefined,
      paymentFrequency: data.paymentFrequency || 0,
      description: data.description || undefined,
      isPrivate: data.isPrivate || false,
      employeeId: data.isPrivate && this.assignedEmployeeForNewRule ? this.assignedEmployeeForNewRule.id : undefined,
      lateArrivalToleranceMinutes: data.lateArrivalToleranceMinutes || 0,
      earlyDepartureToleranceMinutes: data.earlyDepartureToleranceMinutes || 0,
      lateDeductionMinutesPerHour: data.lateDeductionMinutesPerHour || 0,
      earlyDepartureDeductionMinutesPerHour: data.earlyDepartureDeductionMinutesPerHour || 0,
      overtimeMultiplier: data.overtimeMultiplier || 0,
      minimumOvertimeMinutes: data.minimumOvertimeMinutes || 0,
      absenceDeductionMultiplier: data.absenceDeductionMultiplier || 0,
      allowedAbsenceDaysPerMonth: data.allowedAbsenceDaysPerMonth || 0,
      areOffDaysPaid: data.areOffDaysPaid !== undefined ? data.areOffDaysPaid : true,
      allowWorkOnOffDays: data.allowWorkOnOffDays ?? false,
      treatOffDayWorkAsOvertime: data.allowWorkOnOffDays ? (data.treatOffDayWorkAsOvertime ?? false) : false,
      offDayOvertimeMultiplier: data.allowWorkOnOffDays && data.treatOffDayWorkAsOvertime ? (data.offDayOvertimeMultiplier ?? 0) : 0,
      offDayHourlyRate: data.allowWorkOnOffDays ? (data.offDayHourlyRate ?? 0) : 0
    };

    this.financialService.createWorkRule(payload).pipe(
      switchMap(workRuleResponse => {
        if (workRuleResponse.isSuccess && workRuleResponse.data) {
          const workRuleId = workRuleResponse.data.id;
          const workRuleType = payload.type; // payload.type is already a number

          // If work rule type is Monthly (3), create a default shift
          if (workRuleType === 3 && workRuleResponse.data.expectStartTime && workRuleResponse.data.expectEndTime) {
            const shiftPayload: CreateShiftDto = {
              name: `${data.category} Shift`,
              workRuleIds: [workRuleId],
              startTime: workRuleResponse.data.expectStartTime,
              endTime: workRuleResponse.data.expectEndTime,
              isOvernight: false,
              breakMinutes: 0
            };

            return this.financialService.createShift(shiftPayload).pipe(
              catchError(shiftErr => {
                console.error('Error creating shift:', shiftErr);
                return of(workRuleResponse);
              }),
              switchMap(shiftResponse => {
                return of(workRuleResponse);
              })
            );
          } else {
            return of(workRuleResponse);
          }
        } else {
          return of(workRuleResponse);
        }
      }),
      catchError(err => {
        console.error('Error creating work rule:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      // Close loading dialog if it exists
      if (this.loadingDialogRef) {
        this.loadingDialogRef.close();
        this.loadingDialogRef = null;
      }

      if (response.isSuccess && response.data) {
        // If work rule type is "Shifts", navigate to update page to allow shift management
        const workRuleTypeNum = typeof response.data.type === 'number' ? response.data.type : this.convertWorkRuleTypeToNumber(this.convertWorkRuleTypeToString(response.data.type));
        if (workRuleTypeNum === 6) { // 6 is the numeric ID for "Shifts"
          // Navigate to update page
          this.router.navigate(['/admin/financial/work-rules/update', response.data.id]);
        } else {
          // For other types, navigate back to list
          this.router.navigate(['/admin/financial/work-rules']);
        }
        this.showSuccessDialog('WORK_RULE_CREATED');
      } else {
        this.showErrorDialog(response.message || this.translate.instant('ERROR.FAILED_TO_CREATE_WORK_RULE'));
      }
    });
  }

  private convertWorkRuleTypeToNumber(type: string | number): number {
    if (typeof type === 'number') {
      return type;
    }
    const map: Record<string, number> = {
      'Daily': 1,
      'Weekly': 2,
      'Monthly': 3,
      'Hourly': 4,
      'Custom': 5,
      'Shifts': 6
    };
    return map[type] ?? 5;
  }

  private convertWorkRuleTypeToString(type: number | string): string {
    if (typeof type === 'string') {
      return type;
    }
    const map: Record<number, string> = {
      1: 'Daily',
      2: 'Weekly',
      3: 'Monthly',
      4: 'Hourly',
      5: 'Custom',
      6: 'Shifts'
    };
    return map[type] || 'Custom';
  }

  private showSuccessDialog(messageKey: string): void {
    this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title: this.translate.instant('SUCCESS.TITLE'),
        message: this.translate.instant(messageKey),
        isSuccess: true
      }
    });
  }

  private showErrorDialog(message: string): void {
    this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title: this.translate.instant('ERROR.TITLE'),
        message: message,
        isSuccess: false
      }
    });
  }
}

