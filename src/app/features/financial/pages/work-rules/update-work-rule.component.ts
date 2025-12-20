import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faClock,
  faSave,
  faTimes,
  faUserTie,
  faUsers,
  faPlus,
  faSpinner,
  faUserMinus
} from '@fortawesome/free-solid-svg-icons';

import { FinancialService } from '../../../../core/services/financial.service';
import { UpdateWorkRuleDto, WorkRuleType, ShiftDto, AssignedEmployeeDto, ShiftEmployeeSummaryDto } from '../../../../core/interfaces/financial.interface';
import { CustomDropdownComponent } from '../../../../shared/components/custom-dropdown/custom-dropdown.component';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { AssignWorkRuleDialogComponent } from './assign-work-rule-dialog.component';
import { CreateShiftDialogComponent } from './create-shift-dialog.component';
import { AssignShiftDialogComponent } from './assign-shift-dialog.component';
import { AssignExistingShiftDialogComponent } from './assign-existing-shift-dialog.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToggleSwitchComponent } from '../../../../shared/components/toggle-switch/toggle-switch.component';
import { EmployeeService } from '../../../../core/employee.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, catchError, forkJoin, of, switchMap, map } from 'rxjs';

@Component({
  selector: 'app-update-work-rule',
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
  templateUrl: './update-work-rule.component.html',
  styleUrls: ['./update-work-rule.component.css']
})
export class UpdateWorkRuleComponent implements OnInit {
  private financialService = inject(FinancialService);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private employeeService = inject(EmployeeService);

  // FontAwesome Icons
  faArrowLeft = faArrowLeft;
  faClock = faClock;
  faSave = faSave;
  faTimes = faTimes;
  faUserTie = faUserTie;
  faUsers = faUsers;
  faPlus = faPlus;
  faSpinner = faSpinner;
  faUserMinus = faUserMinus;

  // Form properties
  workRuleForm: FormGroup;
  workRuleId: number | null = null;
  workRuleShifts: ShiftDto[] = [];
  isLoadingShifts = false;
  isLoading = true;
  private loadingDialogRef: MatDialogRef<NotificationDialogComponent> | null = null;
  private unassigningFromShift = new Map<string, boolean>();
  private unassigningShiftFromWorkRule = new Set<number>();

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
      lateArrivalToleranceMinutes: [15, [Validators.min(0)]],
      earlyDepartureToleranceMinutes: [15, [Validators.min(0)]],
      lateDeductionMinutesPerHour: [30, [Validators.min(1)]],
      earlyDepartureDeductionMinutesPerHour: [30, [Validators.min(1)]],
      // Overtime Rules
      overtimeMultiplier: [1.5, [Validators.min(1)]],
      minimumOvertimeMinutes: [30, [Validators.min(0)]],
      // Absence Rules
      absenceDeductionMultiplier: [1.0, [Validators.min(0)]],
      allowedAbsenceDaysPerMonth: [0, [Validators.min(0)]],
      areOffDaysPaid: [true],
      allowWorkOnOffDays: [false],
      treatOffDayWorkAsOvertime: [false],
      offDayOvertimeMultiplier: [null, [Validators.min(0)]],
      offDayHourlyRate: [null, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.workRuleId = +id;
      this.loadWorkRule();
    } else {
      this.router.navigate(['/admin/financial/work-rules']);
    }

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

  loadWorkRule(): void {
    if (!this.workRuleId) return;

    this.isLoading = true;
    // Use getWorkRules and find the specific rule, or use getWorkRule if available
    this.financialService.getWorkRules({ pageNumber: 1, pageSize: 1000 }).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const rule = response.data.find(r => r.id === this.workRuleId);
          if (rule) {
            const typeValue = this.convertWorkRuleTypeToString(rule.type);
            
            this.workRuleForm.patchValue({
              category: rule.category,
              type: typeValue,
              expectStartTime: rule.expectStartTime || '',
              expectEndTime: rule.expectEndTime || '',
              expectedHoursPerDay: rule.expectedHoursPerDay || null,
              expectedDaysPerWeek: rule.expectedDaysPerWeek || null,
              paymentFrequency: rule.paymentFrequency || 0,
              description: rule.description || '',
              isPrivate: rule.isPrivate,
              lateArrivalToleranceMinutes: rule.lateArrivalToleranceMinutes ?? 15,
              earlyDepartureToleranceMinutes: rule.earlyDepartureToleranceMinutes ?? 15,
              lateDeductionMinutesPerHour: rule.lateDeductionMinutesPerHour ?? 30,
              earlyDepartureDeductionMinutesPerHour: rule.earlyDepartureDeductionMinutesPerHour ?? 30,
              overtimeMultiplier: rule.overtimeMultiplier ?? 1.5,
              minimumOvertimeMinutes: rule.minimumOvertimeMinutes ?? 30,
              absenceDeductionMultiplier: rule.absenceDeductionMultiplier ?? 1.0,
              allowedAbsenceDaysPerMonth: rule.allowedAbsenceDaysPerMonth ?? 0,
              areOffDaysPaid: rule.areOffDaysPaid ?? true,
              allowWorkOnOffDays: rule.allowWorkOnOffDays ?? false,
              treatOffDayWorkAsOvertime: rule.treatOffDayWorkAsOvertime ?? false,
              offDayOvertimeMultiplier: rule.offDayOvertimeMultiplier ?? null,
              offDayHourlyRate: rule.offDayHourlyRate ?? null
            });

            // Load shifts if work rule type is "Shifts"
            if (this.isShiftBasedRule()) {
              this.loadWorkRuleShifts(this.workRuleId!);
            }
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading work rule:', error);
        this.showErrorDialog(this.translate.instant('ERROR.FAILED_TO_LOAD_WORK_RULES'));
        this.isLoading = false;
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

  isShiftBasedRule(): boolean {
    const type = this.workRuleForm.get('type')?.value;
    return type === WorkRuleType.Shifts || type === 'Shifts' || type === 6;
  }

  loadWorkRuleShifts(workRuleId: number): void {
    this.isLoadingShifts = true;
    this.financialService.getWorkRuleDetails(workRuleId).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.workRuleShifts = response.data.shifts || [];
        }
        this.isLoadingShifts = false;
      },
      error: (error) => {
        console.error('Error loading work rule shifts:', error);
        this.workRuleShifts = [];
        this.isLoadingShifts = false;
      }
    });
  }

  formatShiftRange(startTime: string | null | undefined, endTime: string | null | undefined): string {
    if (!startTime || !endTime) return '—';
    const start = startTime.substring(0, 5);
    const end = endTime.substring(0, 5);
    return `${start} - ${end}`;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/financial/work-rules']);
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

    if (!this.workRuleId) return;

    const formData = this.workRuleForm.value;
    this.updateWorkRule(this.workRuleId, formData);
  }

  updateWorkRule(id: number, data: any): void {
    // Show loading dialog
    this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title: this.translate.instant('LOADING.TITLE'),
        message: this.translate.instant('LOADING.UPDATE_WORK_RULE'),
        isSuccess: true
      },
      disableClose: true
    });

    // Convert type enum to number and prepare payload
    const payload: UpdateWorkRuleDto = {
      category: data.category,
      type: this.convertWorkRuleTypeToNumber(data.type),
      expectStartTime: data.expectStartTime || undefined,
      expectEndTime: data.expectEndTime || undefined,
      expectedHoursPerDay: data.expectedHoursPerDay || undefined,
      expectedDaysPerWeek: data.expectedDaysPerWeek || undefined,
      paymentFrequency: data.paymentFrequency || undefined,
      description: data.description || undefined,
      isPrivate: data.isPrivate !== undefined ? data.isPrivate : undefined,
      employeeId: data.employeeId || undefined,
      lateArrivalToleranceMinutes: data.lateArrivalToleranceMinutes !== undefined ? data.lateArrivalToleranceMinutes : undefined,
      earlyDepartureToleranceMinutes: data.earlyDepartureToleranceMinutes !== undefined ? data.earlyDepartureToleranceMinutes : undefined,
      lateDeductionMinutesPerHour: data.lateDeductionMinutesPerHour !== undefined ? data.lateDeductionMinutesPerHour : undefined,
      earlyDepartureDeductionMinutesPerHour: data.earlyDepartureDeductionMinutesPerHour !== undefined ? data.earlyDepartureDeductionMinutesPerHour : undefined,
      overtimeMultiplier: data.overtimeMultiplier !== undefined ? data.overtimeMultiplier : undefined,
      minimumOvertimeMinutes: data.minimumOvertimeMinutes !== undefined ? data.minimumOvertimeMinutes : undefined,
      absenceDeductionMultiplier: data.absenceDeductionMultiplier !== undefined ? data.absenceDeductionMultiplier : undefined,
      allowedAbsenceDaysPerMonth: data.allowedAbsenceDaysPerMonth !== undefined ? data.allowedAbsenceDaysPerMonth : undefined,
      areOffDaysPaid: data.areOffDaysPaid !== undefined ? data.areOffDaysPaid : undefined,
      allowWorkOnOffDays: data.allowWorkOnOffDays !== undefined ? data.allowWorkOnOffDays : undefined,
      treatOffDayWorkAsOvertime: data.allowWorkOnOffDays ? data.treatOffDayWorkAsOvertime : (data.allowWorkOnOffDays === false ? false : undefined),
      offDayOvertimeMultiplier: data.allowWorkOnOffDays && data.treatOffDayWorkAsOvertime !== undefined ? (data.treatOffDayWorkAsOvertime ? (data.offDayOvertimeMultiplier ?? 0) : 0) : undefined,
      offDayHourlyRate: data.allowWorkOnOffDays !== undefined ? (data.allowWorkOnOffDays ? (data.offDayHourlyRate ?? 0) : 0) : undefined
    };

    this.financialService.updateWorkRule(id, payload).pipe(
      catchError(err => {
        console.error('Error updating work rule:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      // Close loading dialog if it exists
      if (this.loadingDialogRef) {
        this.loadingDialogRef.close();
        this.loadingDialogRef = null;
      }

      if (response.isSuccess) {
        this.router.navigate(['/admin/financial/work-rules']);
        this.showSuccessDialog('WORK_RULE_UPDATED');
      } else {
        this.showErrorDialog(response.message || this.translate.instant('ERROR.FAILED_TO_UPDATE_WORK_RULE'));
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

  openCreateShiftDialog(): void {
    if (!this.workRuleId) return;

    const dialogRef = this.dialog.open(CreateShiftDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      backdropClass: 'transparent-backdrop',
      width: '90vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      data: {
        workRuleIds: [this.workRuleId]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.workRuleId) {
        this.loadWorkRuleShifts(this.workRuleId);
      }
    });
  }

  openAssignExistingShiftDialog(): void {
    if (!this.workRuleId) return;

    this.financialService.getShifts().subscribe({
      next: (response) => {
        if (!response.isSuccess || !response.data) {
          this.showErrorDialog(this.translate.instant('ERROR.FAILED_TO_LOAD_SHIFTS'));
          return;
        }

        const allShifts = response.data;
        const assignedShiftIds = new Set(this.workRuleShifts.map(s => s.id));
        const availableShifts = allShifts.filter(shift => !assignedShiftIds.has(shift.id));

        if (availableShifts.length === 0) {
          this.showErrorDialog(this.translate.instant('NoAvailableShiftsToAssign'));
          return;
        }

        const dialogRef = this.dialog.open(AssignExistingShiftDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          backdropClass: 'transparent-backdrop',
          width: '600px',
          maxWidth: '90vw',
          data: {
            shifts: availableShifts,
            workRuleId: this.workRuleId
          }
        });

        dialogRef.afterClosed().subscribe(selectedShiftId => {
          if (selectedShiftId && this.workRuleId) {
            this.assignShiftToWorkRule(selectedShiftId);
          }
        });
      },
      error: (error) => {
        console.error('Error loading shifts:', error);
        this.showErrorDialog(this.translate.instant('ERROR.FAILED_TO_LOAD_SHIFTS'));
      }
    });
  }

  private assignShiftToWorkRule(shiftId: number): void {
    if (!this.workRuleId) return;

    this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title: this.translate.instant('LOADING.TITLE'),
        message: this.translate.instant('LOADING.ASSIGN_SHIFT_TO_WORK_RULE'),
        isSuccess: true
      },
      disableClose: true
    });

    this.financialService.assignShiftToWorkRule(this.workRuleId, shiftId).subscribe({
      next: (response) => {
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = null;
        }

        if (response.isSuccess) {
          this.showSuccessDialog('SUCCESS.SHIFT_ASSIGNED_TO_WORK_RULE');
          if (this.workRuleId) {
            this.loadWorkRuleShifts(this.workRuleId);
          }
        } else {
          this.showErrorDialog(response.message || this.translate.instant('ERROR.FAILED_TO_ASSIGN_SHIFT_TO_WORK_RULE'));
        }
      },
      error: (error) => {
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = null;
        }
        this.showErrorDialog(error?.error?.message || error?.message || this.translate.instant('ERROR.FAILED_TO_ASSIGN_SHIFT_TO_WORK_RULE'));
      }
    });
  }

  openAssignShiftDialog(shift: ShiftDto): void {
    if (!this.workRuleId) return;

    this.financialService.getWorkRuleDetails(this.workRuleId).subscribe({
      next: (response) => {
        if (!response.isSuccess || !response.data) {
          this.showErrorDialog(this.translate.instant('ERROR.FAILED_TO_LOAD_WORK_RULES'));
          return;
        }

        const allEmployees = response.data.assignedEmployees || [];
        const assignedEmployeeIds = new Set((shift.employees || []).map((e: any) => e.employeeId));
        const eligibleEmployees = allEmployees.filter((emp: any) => !assignedEmployeeIds.has(emp.id));

        if (eligibleEmployees.length === 0) {
          this.showErrorDialog(this.translate.instant('NoEligibleEmployeesForShift'));
          return;
        }

        const dialogRef = this.dialog.open(AssignShiftDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          backdropClass: 'transparent-backdrop',
          width: '700px',
          maxWidth: '90vw',
          data: {
            shiftId: shift.id,
            shiftName: shift.name,
            availableEmployees: eligibleEmployees
          }
        });

        dialogRef.afterClosed().subscribe(selectedEmployeeIds => {
          if (selectedEmployeeIds && selectedEmployeeIds.length > 0 && this.workRuleId) {
            this.assignEmployeesToShift(shift.id, selectedEmployeeIds);
          }
        });
      },
      error: (error) => {
        console.error('Error loading work rule details:', error);
        this.showErrorDialog(this.translate.instant('ERROR.FAILED_TO_LOAD_WORK_RULES'));
      }
    });
  }

  private assignEmployeesToShift(shiftId: number, employeeIds: number[]): void {
    this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title: this.translate.instant('LOADING.TITLE'),
        message: this.translate.instant('LOADING.ASSIGN_SHIFT'),
        isSuccess: true
      },
      disableClose: true
    });

    const assignments = employeeIds.map(employeeId =>
      this.financialService.assignEmployeeToShift(shiftId, employeeId).pipe(
        map(response => ({ isSuccess: response.isSuccess, message: response.message })),
        catchError(error => {
          console.error('Error assigning employee to shift:', error);
          return of({ isSuccess: false, message: error?.error?.message || error.message || '' });
        })
      )
    );

    forkJoin(assignments).subscribe({
      next: (results) => {
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = null;
        }

        const failed = results.find(r => !r.isSuccess);
        if (failed) {
          this.showErrorDialog(failed.message || this.translate.instant('ERROR.SHIFT_ASSIGNMENT_FAILED'));
        } else {
          this.showSuccessDialog('SUCCESS.SHIFT_ASSIGNMENT');
          if (this.workRuleId) {
            this.loadWorkRuleShifts(this.workRuleId);
          }
        }
      },
      error: (error) => {
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = null;
        }
        this.showErrorDialog(error?.error?.message || error?.message || this.translate.instant('ERROR.SHIFT_ASSIGNMENT_FAILED'));
      }
    });
  }

  isUnassigningFromShift(shiftId: number, employeeId: number): boolean {
    const key = `${shiftId}-${employeeId}`;
    return this.unassigningFromShift.get(key) || false;
  }

  isUnassigningShiftFromWorkRule(shiftId: number): boolean {
    return this.unassigningShiftFromWorkRule.has(shiftId);
  }

  unassignShiftFromWorkRule(shift: ShiftDto): void {
    if (!this.workRuleId) return;

    const confirmMessage = this.translate.instant('UnassignShiftFromWorkRuleConfirm', {
      shiftName: shift.name,
      workRuleName: this.workRuleForm.get('category')?.value || ''
    });

    const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      backdropClass: 'transparent-backdrop',
      data: {
        title: this.translate.instant('ConfirmDeletion'),
        message: confirmMessage,
        confirmButtonText: this.translate.instant('Unassign'),
        cancelButtonText: this.translate.instant('Cancel')
      }
    });

    confirmDialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && this.workRuleId) {
        this.unassigningShiftFromWorkRule.add(shift.id);

        this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: this.translate.instant('LOADING.TITLE'),
            message: this.translate.instant('LOADING.UNASSIGN_SHIFT_FROM_WORK_RULE'),
            isSuccess: true
          },
          disableClose: true
        });

        this.financialService.unassignShiftFromWorkRule(this.workRuleId, shift.id).subscribe({
          next: (response) => {
            this.unassigningShiftFromWorkRule.delete(shift.id);

            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
              this.loadingDialogRef = null;
            }

            if (response.isSuccess) {
              this.showSuccessDialog('SUCCESS.UNASSIGN_SHIFT_FROM_WORK_RULE');
              if (this.workRuleId) {
                this.loadWorkRuleShifts(this.workRuleId);
              }
            } else {
              this.showErrorDialog(response.message || this.translate.instant('ERROR.FAILED_TO_UNASSIGN_SHIFT_FROM_WORK_RULE'));
            }
          },
          error: (error) => {
            this.unassigningShiftFromWorkRule.delete(shift.id);
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
              this.loadingDialogRef = null;
            }
            this.showErrorDialog(error?.error?.message || error?.message || this.translate.instant('ERROR.FAILED_TO_UNASSIGN_SHIFT_FROM_WORK_RULE'));
          }
        });
      }
    });
  }

  unassignEmployeeFromShift(shift: ShiftDto, shiftEmployee: ShiftEmployeeSummaryDto): void {
    if (!this.workRuleId) return;

    const key = `${shift.id}-${shiftEmployee.employeeId}`;
    this.unassigningFromShift.set(key, true);

    this.financialService.unassignEmployeeFromShift(shift.id, shiftEmployee.employeeId).subscribe({
      next: (response) => {
        this.unassigningFromShift.delete(key);

        if (response.isSuccess) {
          this.showSuccessDialog('SUCCESS.UNASSIGN_EMPLOYEE_FROM_SHIFT');
          if (this.workRuleId) {
            this.loadWorkRuleShifts(this.workRuleId);
          }
        } else {
          this.showErrorDialog(response.message || this.translate.instant('ERROR.FAILED_TO_UNASSIGN_EMPLOYEE_FROM_SHIFT'));
        }
      },
      error: (error) => {
        this.unassigningFromShift.delete(key);
        this.showErrorDialog(error?.error?.message || error?.message || this.translate.instant('ERROR.FAILED_TO_UNASSIGN_EMPLOYEE_FROM_SHIFT'));
      }
    });
  }
}

