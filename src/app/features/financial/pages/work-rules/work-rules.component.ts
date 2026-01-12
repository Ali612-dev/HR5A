import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faClock,
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faSave,
  faTimes,
  faUsers,
  faBuilding,
  faUserTie,
  faEllipsisVertical,
  faUserMinus
} from '@fortawesome/free-solid-svg-icons';

import { FinancialService } from '../../../../core/services/financial.service';
import { WorkRuleDto, CreateWorkRuleDto, UpdateWorkRuleDto, WorkRuleType, CreateShiftDto } from '../../../../core/interfaces/financial.interface';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { CustomDropdownComponent } from '../../../../shared/components/custom-dropdown/custom-dropdown.component';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { AssignWorkRuleDialogComponent } from './assign-work-rule-dialog.component';
import { CreateShiftDialogComponent } from './create-shift-dialog.component';
import { AssignShiftDialogComponent } from './assign-shift-dialog.component';
import { AssignExistingShiftDialogComponent } from './assign-existing-shift-dialog.component';
import { TimePickerDialogComponent } from '../../../../shared/components/time-picker-dialog/time-picker-dialog.component';
import { ToggleSwitchComponent } from '../../../../shared/components/toggle-switch/toggle-switch.component';
import { EmployeeService } from '../../../../core/employee.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, catchError, forkJoin, of, switchMap, map, tap } from 'rxjs';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ShiftDto, AssignedEmployeeDto } from '../../../../core/interfaces/financial.interface';

@Component({
  selector: 'app-work-rules',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    FontAwesomeModule,
    ShimmerComponent,
  ],
  templateUrl: './work-rules.component.html',
  styleUrls: ['./work-rules.component.css']
})
export class WorkRulesComponent implements OnInit {
  private financialService = inject(FinancialService);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);

  // FontAwesome Icons
  faArrowLeft = faArrowLeft;
  faClock = faClock;
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;
  faEye = faEye;
  faSave = faSave;
  faTimes = faTimes;
  faUsers = faUsers;
  faBuilding = faBuilding;
  faUserTie = faUserTie;
  faEllipsisVertical = faEllipsisVertical;
  faSpinner = faSpinner;
  faUserMinus = faUserMinus;

  // Data properties
  workRules: WorkRuleDto[] = [];
  isLoading = true;
  error: string | null = null;
  deletingRuleIds = new Set<number>(); // Track which rules are being deleted
  totalCount = 0;
  activeMenuId: number | null = null;
  private loadingDialogRef: MatDialogRef<NotificationDialogComponent> | null = null;

  // Form properties
  workRuleForm: FormGroup;
  isFormVisible = false;
  isEditing = false;
  editingRule: WorkRuleDto | null = null;
  assignedEmployeeForNewRule: any = null;
  workRuleShifts: ShiftDto[] = []; // Shifts for the current work rule (when editing)
  isLoadingShifts = false;
  private unassigningFromShift = new Map<string, boolean>(); // Track unassigning state: key = "shiftId-employeeId"
  private unassigningShiftFromWorkRule = new Set<number>(); // Track unassigning shift from work rule: shiftId

  // Inline shift form (for adding new work rules)
  isShiftFormExpanded = false;
  shiftForm!: FormGroup;
  workRuleOptionsForShift: { id: number; category: string }[] = [];
  private selectedWorkRulesForShift = new Set<number>();

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
    this.loadWorkRules();

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
        }, { emitEvent: false });
      }
    });

    this.workRuleForm.get('treatOffDayWorkAsOvertime')?.valueChanges.subscribe(treat => {
      if (!this.workRuleForm.get('allowWorkOnOffDays')?.value && treat) {
        this.workRuleForm.patchValue({ treatOffDayWorkAsOvertime: false }, { emitEvent: false });
      }

      if (!treat) {
        this.workRuleForm.patchValue({ offDayOvertimeMultiplier: null }, { emitEvent: false });
      }
    });

    this.initializeShiftForm();
  }

  initializeShiftForm(): void {
    this.shiftForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      workRuleIds: [[], [this.atLeastOneWorkRuleValidator]],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      isOvernight: [false],
      isThereBreak: [false],
      isBreakFixed: [false],
      breakStartTime: [''],
      breakEndTime: ['']
    });

    this.shiftForm.get('isThereBreak')?.valueChanges.subscribe(() => this.updateBreakValidators());
    this.shiftForm.get('isBreakFixed')?.valueChanges.subscribe(() => this.updateBreakValidators());
  }

  private atLeastOneWorkRuleValidator(control: any): any {
    const value = control.value;
    return Array.isArray(value) && value.length > 0 ? null : { required: true };
  }

  private updateBreakValidators(): void {
    const isThereBreak = this.shiftForm.get('isThereBreak')?.value;
    const isBreakFixed = this.shiftForm.get('isBreakFixed')?.value;
    const breakStart = this.shiftForm.get('breakStartTime');
    const breakEnd = this.shiftForm.get('breakEndTime');

    if (isThereBreak && isBreakFixed) {
      breakStart?.setValidators([Validators.required]);
      breakEnd?.setValidators([Validators.required]);
    } else {
      breakStart?.clearValidators();
      breakEnd?.clearValidators();
    }

    breakStart?.updateValueAndValidity();
    breakEnd?.updateValueAndValidity();
  }

  loadWorkRules(): void {
    this.isLoading = true;
    this.error = null;

    this.financialService.getWorkRules({ pageNumber: 1, pageSize: 50 }).pipe(
      catchError(err => {
        this.error = this.translate.instant('ERROR.FAILED_TO_LOAD_WORK_RULES');
        console.error('Error fetching work rules:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess && response.data) {
        this.workRules = response.data;
        this.totalCount = response.data.length;
      } else if (!this.error) {
        this.error = response.message || this.translate.instant('ERROR.UNKNOWN_ERROR_FETCHING_WORK_RULES');
      }
      this.isLoading = false;
    });
  }

  showAddForm(): void {
    this.router.navigate(['/admin/financial/work-rules/add']);
  }

  showEditForm(rule: WorkRuleDto): void {
    this.activeMenuId = null; // Close menu when action is clicked
    this.router.navigate(['/admin/financial/work-rules/update', rule.id]);
  }

  hideForm(): void {
    this.isFormVisible = false;
    this.isEditing = false;
    this.editingRule = null;
    this.assignedEmployeeForNewRule = null;
    this.workRuleShifts = [];
    this.workRuleForm.reset();
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
      const errorMessage = 'يرجى تعبئة جميع الحقول المطلوبة قبل الإرسال';
      this.showErrorDialog(errorMessage);
      return;
    }

    const formData = this.workRuleForm.value;

    if (this.isEditing && this.editingRule) {
      this.updateWorkRule(this.editingRule.id, formData);
    } else {
      this.createWorkRule(formData);
    }
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
              workRuleIds: [workRuleId], // Array of WorkRule IDs (many-to-many)
              startTime: workRuleResponse.data.expectStartTime,
              endTime: workRuleResponse.data.expectEndTime,
              isOvernight: false,
              breakMinutes: 0
            };

            return this.financialService.createShift(shiftPayload).pipe(
              catchError(shiftErr => {
                console.error('Error creating shift:', shiftErr);
                // Return work rule response even if shift creation fails
                return of(workRuleResponse);
              }),
              switchMap(shiftResponse => {
                // Return work rule response regardless of shift creation result
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
        // If work rule type is "Shifts", switch to edit mode to allow shift management
        const workRuleTypeNum = typeof response.data.type === 'number' ? response.data.type : this.convertWorkRuleTypeToNumber(this.convertWorkRuleTypeToString(response.data.type));
        if (workRuleTypeNum === 6) { // 6 is the numeric ID for "Shifts"
          // Switch to edit mode
          this.isEditing = true;
          this.editingRule = response.data;
          // Load shifts for the newly created work rule
          this.loadWorkRuleShifts(response.data.id);
          this.showSuccessDialog('WORK_RULE_CREATED');
        } else {
          // For other types, hide form and reload list
          this.hideForm();
          this.loadWorkRules();
          this.showSuccessDialog('WORK_RULE_CREATED');
        }
      } else {
        this.showErrorDialog(response.message || this.translate.instant('ERROR.FAILED_TO_CREATE_WORK_RULE'));
      }
    });
  }

  updateWorkRule(id: number, data: any): void {
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
      if (response.isSuccess) {
        this.hideForm();
        this.loadWorkRules();
        this.showSuccessDialog('WORK_RULE_UPDATED');
      } else {
        this.showErrorDialog(response.message || this.translate.instant('ERROR.FAILED_TO_UPDATE_WORK_RULE'));
      }
    });
  }

  deleteWorkRule(rule: WorkRuleDto): void {
    this.activeMenuId = null; // Close menu when action is clicked

    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      backdropClass: 'transparent-backdrop',
      data: {
        title: this.translate.instant('ConfirmDeletion'),
        message: this.translate.instant('CONFIRM_DELETE_WORK_RULE', { ruleName: rule.category }),
        confirmButtonText: this.translate.instant('Delete'),
        cancelButtonText: this.translate.instant('Cancel')
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // Add rule ID to deleting set to show loading state
        this.deletingRuleIds.add(rule.id);
        this.error = null; // Clear any previous errors

        // Show loading dialog
        this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: this.translate.instant('LOADING.TITLE'),
            message: this.translate.instant('LOADING.DELETE_WORK_RULE'),
            isSuccess: true // Use true for loading state
          },
          disableClose: true // Prevent closing by clicking outside
        });

        this.financialService.deleteWorkRule(rule.id).pipe(
          catchError(err => {
            console.error('Error deleting work rule:', err);
            this.deletingRuleIds.delete(rule.id);

            // Close loading dialog
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
              this.loadingDialogRef = null;
            }

            const errorMessage = err?.error?.message || err?.message || 'ERROR.FAILED_TO_DELETE_WORK_RULE';
            this.showErrorDialog(errorMessage);
            return of({ isSuccess: false, data: null, message: errorMessage, errors: [err] });
          })
        ).subscribe(response => {
          this.deletingRuleIds.delete(rule.id);

          // Close loading dialog
          if (this.loadingDialogRef) {
            this.loadingDialogRef.close();
            this.loadingDialogRef = null;
          }

          if (response.isSuccess) {
            // Show success message
            this.showSuccessDialog('WORK_RULE_DELETED');
            // Reload work rules
            this.loadWorkRules();
          } else {
            const errorMessage = response.message || 'ERROR.FAILED_TO_DELETE_WORK_RULE';
            this.showErrorDialog(errorMessage);
          }
        });
      }
    });
  }

  toggleActionMenu(event: Event, ruleId: number): void {
    // Stop propagation to prevent document click handler from interfering
    event.stopPropagation();

    if (this.activeMenuId === ruleId) {
      // Close the menu
      this.activeMenuId = null;
    } else {
      // Open the menu
      this.activeMenuId = ruleId;
    }
  }

  openAssignDialogForNewRule(): void {
    const ref = this.dialog.open(AssignWorkRuleDialogComponent, {
      panelClass: 'glass-dialog-panel',
      backdropClass: 'transparent-backdrop',
      width: '95vw',
      maxWidth: '95vw',
      height: '85vh',
      maxHeight: '85vh',
      data: { workRuleId: null, isForNewRule: true }
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
    return map[type] ?? 5; // Default to Custom (5) instead of Daily (1)
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
    return map[type] || 'Custom'; // Default to Custom instead of Daily
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    // Don't close if clicking inside dropdown menu
    if (target.closest('.dropdown-menu')) {
      return;
    }

    // Don't close if clicking on the toggle button or its children
    const clickedButton = target.closest('.btn-menu-toggle');
    if (clickedButton) {
      // Let the button's click handler manage the toggle
      return;
    }

    // Close menu when clicking outside
    if (this.activeMenuId !== null) {
      this.activeMenuId = null;
    }
  }

  openAssignDialog(rule: WorkRuleDto): void {
    this.activeMenuId = null; // Close menu when action is clicked
    const ref = this.dialog.open(AssignWorkRuleDialogComponent, {
      panelClass: 'glass-dialog-panel',
      backdropClass: 'transparent-backdrop',
      width: '95vw',
      maxWidth: '95vw',
      height: '85vh',
      maxHeight: '85vh',
      data: { workRuleId: rule.id }
    });

    ref.afterClosed().subscribe((selectedIds: number[] | null) => {
      if (selectedIds && selectedIds.length > 0) {
        this.processAssignment(rule, selectedIds);
      }
    });
  }

  private processAssignment(rule: WorkRuleDto, employeeIds: number[]): void {
    if (this.isShiftBasedRuleForRule(rule)) {
      this.validateShiftAssignments(rule.id, employeeIds).subscribe(result => {
        if (!result.valid) {
          this.showErrorDialog(result.message || this.translate.instant('ERROR.WORK_RULE_REQUIRES_SHIFTS'));
          return;
        }
        this.executeAssignment(rule.id, employeeIds);
      });
      return;
    }

    this.executeAssignment(rule.id, employeeIds);
  }

  private executeAssignment(ruleId: number, employeeIds: number[]): void {
    this.financialService.assignWorkRule(ruleId, { employeeIds }).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.showSuccessDialog('WORK_RULE_ASSIGNED');
        } else {
          this.showErrorDialog(res.message || this.translate.instant('ERROR.UNKNOWN_ERROR'));
        }
      },
      error: (err) => this.showErrorDialog(err.error?.message || err.message || this.translate.instant('ERROR.UNKNOWN_ERROR'))
    });
  }

  private validateShiftAssignments(ruleId: number, employeeIds: number[]): Observable<{ valid: boolean; message?: string }> {
    if (employeeIds.length === 0) {
      return of({ valid: false, message: this.translate.instant('SelectAtLeastOneWorkRule') });
    }

    // Removed validation that requires employees to have shifts assigned before assigning to work rule
    // Employees can now be assigned to work rules without being assigned to shifts first
    return of({ valid: true });
  }

  private isShiftBasedRuleForRule(rule: WorkRuleDto): boolean {
    if (rule.isShiftBased) {
      return true;
    }

    if (typeof rule.type === 'number') {
      return rule.type === 6;
    }

    const normalized = rule.type?.toString().toLowerCase();
    return normalized === 'shifts' || normalized === 'shift';
  }

  private extractShiftId(shift: any): number | null {
    if (!shift) {
      return null;
    }

    if (typeof shift === 'number') {
      return shift;
    }

    if (typeof shift === 'string') {
      const parsed = Number(shift);
      return Number.isNaN(parsed) ? null : parsed;
    }

    if (typeof shift === 'object') {
      return shift.id ?? shift.shiftId ?? null;
    }

    return null;
  }

  getWorkRuleTypeLabel(type: WorkRuleType | string | number): string {
    // Handle both string and number types
    const typeValue = typeof type === 'number' ? type.toString() : type;

    const typeMap: { [key: string]: string } = {
      '1': 'Daily',
      '2': 'Weekly',
      '3': 'Monthly',
      '4': 'Hourly',
      '5': 'Custom',
      '6': 'Shifts',
      'Daily': 'Daily',
      'Weekly': 'Weekly',
      'Monthly': 'Monthly',
      'Hourly': 'Hourly',
      'Custom': 'Custom',
      'Shifts': 'Shifts'
    };

    const mappedType = typeMap[typeValue] || 'Custom'; // Default to Custom for unknown types
    const translatedValue = this.translate.instant(`WorkRuleType.${mappedType}`);

    // If translation doesn't exist, return the mapped type directly
    return translatedValue !== `WorkRuleType.${mappedType}` ? translatedValue : mappedType;
  }

  getWorkRuleTypeLabelArabic(type: WorkRuleType | string | number): string {
    // Handle both string and number types
    const typeValue = typeof type === 'number' ? type.toString() : type;

    const typeMap: { [key: string]: string } = {
      '1': 'يومي',
      '2': 'أسبوعي',
      '3': 'شهري',
      '4': 'بالساعة',
      '5': 'مخصص',
      '6': 'شيفتات',
      'Daily': 'يومي',
      'Weekly': 'أسبوعي',
      'Monthly': 'شهري',
      'Hourly': 'بالساعة',
      'Custom': 'مخصص',
      'Shifts': 'شيفتات'
    };

    return typeMap[typeValue] || 'مخصص';
  }

  getWorkRuleCategoryLabelArabic(category: string | number): string {
    // Handle both string and number types
    const categoryValue = typeof category === 'number' ? category.toString() : category;

    const categoryMap: { [key: string]: string } = {
      '1': 'منتظم',
      '2': 'عام',
      '3': 'مرن',
      'Regular': 'منتظم',
      'General': 'عام',
      'Flexible': 'مرن',
      'Weekend Only': 'عطلة نهاية الأسبوع',
      'general': 'عام',
      'Standard 9 to 5': 'عادي 9 إلى 5'
    };

    return categoryMap[categoryValue] || categoryValue;
  }

  getWorkRuleCategoryLabel(category: string | number): string {
    // Handle both string and number types
    const categoryValue = typeof category === 'number' ? category.toString() : category;

    const categoryMap: { [key: string]: string } = {
      '1': 'Regular',
      '2': 'General',
      '3': 'Flexible',
      'Regular': 'Regular',
      'General': 'General',
      'Flexible': 'Flexible'
    };

    return categoryMap[categoryValue] || categoryValue;
  }

  formatTime(timeString?: string): string {
    if (!timeString) return '-';
    return timeString.substring(0, 5); // Show only HH:mm
  }

  getValidationErrors(fieldName: string): string[] {
    const field = this.workRuleForm.get(fieldName);
    const errors: string[] = [];

    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        errors.push(this.translate.instant('VALIDATION.REQUIRED'));
      }
      if (field.errors?.['maxlength']) {
        errors.push(this.translate.instant('VALIDATION.MAX_LENGTH', { max: field.errors['maxlength'].requiredLength }));
      }
      if (field.errors?.['min']) {
        errors.push(this.translate.instant('VALIDATION.MIN_VALUE', { min: field.errors['min'].min }));
      }
      if (field.errors?.['max']) {
        errors.push(this.translate.instant('VALIDATION.MAX_VALUE', { max: field.errors['max'].max }));
      }
    }

    return errors;
  }

  showSuccessDialog(messageKey: string): void {
    this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title: this.translate.instant('SUCCESS.TITLE'),
        message: this.translate.instant(messageKey),
        isSuccess: true
      }
    });
  }

  isDeletingRule(ruleId: number): boolean {
    return this.deletingRuleIds.has(ruleId);
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

  openCreateShiftDialog(): void {
    // Only allow creating shifts for saved work rules (with ID)
    if (!this.editingRule || !this.editingRule.id) {
      return;
    }

    // Open the dialog for existing work rules
    const dialogRef = this.dialog.open(CreateShiftDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      backdropClass: 'transparent-backdrop',
      width: '90vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      data: {
        workRuleIds: [this.editingRule.id]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.editingRule && this.editingRule.id) {
        // Reload shifts after creating a new one
        this.loadWorkRuleShifts(this.editingRule.id);
      }
    });
  }

  toggleInlineShiftForm(): void {
    if (!this.isShiftFormExpanded) {
      // Load work rules for the shift form
      this.loadWorkRulesForShiftForm();
    }
    this.isShiftFormExpanded = !this.isShiftFormExpanded;
  }

  loadWorkRulesForShiftForm(): void {
    this.financialService.getWorkRules({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.workRuleOptionsForShift = response.data.map(rule => ({
            id: rule.id,
            category: rule.category
          }));
          // Pre-select the current work rule if it exists
          const currentCategory = this.workRuleForm.get('category')?.value;
          if (currentCategory) {
            const matchingRule = this.workRuleOptionsForShift.find(r => r.category === currentCategory);
            if (matchingRule) {
              this.selectedWorkRulesForShift.add(matchingRule.id);
              this.shiftForm.get('workRuleIds')?.setValue([matchingRule.id]);
            }
          }
        }
      },
      error: (error) => {
        console.error('Error loading work rules for shift form:', error);
      }
    });
  }

  isWorkRuleSelectedForShift(id: number): boolean {
    return this.selectedWorkRulesForShift.has(id);
  }

  toggleWorkRuleForShift(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedWorkRulesForShift.add(id);
    } else {
      this.selectedWorkRulesForShift.delete(id);
    }
    this.shiftForm.get('workRuleIds')?.setValue(Array.from(this.selectedWorkRulesForShift));
    this.shiftForm.get('workRuleIds')?.updateValueAndValidity();
  }

  openTimePickerForShift(fieldName: 'startTime' | 'endTime' | 'breakStartTime' | 'breakEndTime'): void {
    const currentValue = this.shiftForm.get(fieldName)?.value || '';
    const labelMap: Record<string, string> = {
      'startTime': 'ShiftStartTime',
      'endTime': 'ShiftEndTime',
      'breakStartTime': 'BreakStartTime',
      'breakEndTime': 'BreakEndTime'
    };

    const dialogRef = this.dialog.open(TimePickerDialogComponent, {
      panelClass: 'glass-dialog-panel',
      width: 'auto',
      maxWidth: '400px',
      data: {
        initialTime: currentValue,
        label: labelMap[fieldName]
      }
    });

    dialogRef.afterClosed().subscribe((result: string | null) => {
      if (result) {
        // Convert "HH:mm:ss" to "HH:mm" for the time input
        const timeValue = result.substring(0, 5);
        this.shiftForm.get(fieldName)?.setValue(timeValue);
        this.shiftForm.get(fieldName)?.markAsTouched();
      }
    });
  }

  submitInlineShiftForm(): void {
    if (this.shiftForm.invalid) {
      this.shiftForm.markAllAsTouched();
      return;
    }

    // Check if work rule is saved, if not, save it first
    if (!this.editingRule || !this.editingRule.id) {
      // Validate work rule form first
      const category = this.workRuleForm.get('category')?.value;
      const type = this.workRuleForm.get('type')?.value;

      if (!category || category.trim() === '' || !type) {
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          width: '500px',
          maxWidth: '90vw',
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: this.translate.instant('SaveWorkRuleFirstToAddShifts'),
            isSuccess: false
          }
        });
        return;
      }

      // Auto-save the work rule first, then create the shift
      this.saveWorkRuleAndCreateShift();
      return;
    }

    // Work rule is saved, create shift directly
    this.createShiftFromInlineForm();
  }

  private saveWorkRuleAndCreateShift(): void {
    const formData = this.workRuleForm.value;

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
      category: formData.category,
      type: this.convertWorkRuleTypeToNumber(formData.type),
      expectStartTime: formData.expectStartTime || undefined,
      expectEndTime: formData.expectEndTime || undefined,
      expectedHoursPerDay: formData.expectedHoursPerDay || undefined,
      expectedDaysPerWeek: formData.expectedDaysPerWeek || undefined,
      paymentFrequency: formData.paymentFrequency || 0,
      description: formData.description || undefined,
      isPrivate: formData.isPrivate || false,
      employeeId: formData.isPrivate && this.assignedEmployeeForNewRule ? this.assignedEmployeeForNewRule.id : undefined,
      lateArrivalToleranceMinutes: formData.lateArrivalToleranceMinutes || 0,
      earlyDepartureToleranceMinutes: formData.earlyDepartureToleranceMinutes || 0,
      lateDeductionMinutesPerHour: formData.lateDeductionMinutesPerHour || 0,
      earlyDepartureDeductionMinutesPerHour: formData.earlyDepartureDeductionMinutesPerHour || 0,
      overtimeMultiplier: formData.overtimeMultiplier || 0,
      minimumOvertimeMinutes: formData.minimumOvertimeMinutes || 0,
      absenceDeductionMultiplier: formData.absenceDeductionMultiplier || 0,
      allowedAbsenceDaysPerMonth: formData.allowedAbsenceDaysPerMonth || 0,
      areOffDaysPaid: formData.areOffDaysPaid !== undefined ? formData.areOffDaysPaid : true,
      allowWorkOnOffDays: formData.allowWorkOnOffDays ?? false,
      treatOffDayWorkAsOvertime: formData.allowWorkOnOffDays ? (formData.treatOffDayWorkAsOvertime ?? false) : false,
      offDayOvertimeMultiplier: formData.allowWorkOnOffDays && formData.treatOffDayWorkAsOvertime ? (formData.offDayOvertimeMultiplier ?? 0) : 0,
      offDayHourlyRate: formData.allowWorkOnOffDays ? (formData.offDayHourlyRate ?? 0) : 0
    };

    this.financialService.createWorkRule(payload).pipe(
      switchMap(workRuleResponse => {
        if (workRuleResponse.isSuccess && workRuleResponse.data) {
          // Update the editing rule
          this.isEditing = true;
          this.editingRule = workRuleResponse.data;

          // Update the shift form to include the new work rule ID
          const currentWorkRuleIds = this.shiftForm.get('workRuleIds')?.value || [];
          if (!currentWorkRuleIds.includes(workRuleResponse.data.id)) {
            this.selectedWorkRulesForShift.add(workRuleResponse.data.id);
            this.shiftForm.get('workRuleIds')?.setValue([...currentWorkRuleIds, workRuleResponse.data.id]);
          }

          // Now create the shift
          return this.createShiftFromInlineFormObservable();
        } else {
          if (this.loadingDialogRef) {
            this.loadingDialogRef.close();
            this.loadingDialogRef = null;
          }
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: workRuleResponse.message || this.translate.instant('ERROR.FAILED_TO_CREATE_WORK_RULE'),
              isSuccess: false
            }
          });
          return of(null);
        }
      }),
      catchError(err => {
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = null;
        }
        console.error('Error creating work rule:', err);
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          width: '500px',
          maxWidth: '90vw',
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: this.translate.instant('ERROR.FAILED_TO_CREATE_WORK_RULE'),
            isSuccess: false
          }
        });
        return of(null);
      })
    ).subscribe();
  }

  private createShiftFromInlineForm(): void {
    const formValue = this.shiftForm.value;
    const payload: CreateShiftDto = {
      name: formValue.name,
      workRuleIds: formValue.workRuleIds,
      startTime: this.toApiTime(formValue.startTime),
      endTime: this.toApiTime(formValue.endTime),
      isOvernight: formValue.isOvernight,
      isThereBreak: formValue.isThereBreak,
      isBreakFixed: formValue.isBreakFixed,
      breakStartTime: formValue.isThereBreak && formValue.isBreakFixed ? this.toApiTime(formValue.breakStartTime) : undefined,
      breakEndTime: formValue.isThereBreak && formValue.isBreakFixed ? this.toApiTime(formValue.breakEndTime) : undefined
    };

    // Show loading dialog if not already showing
    if (!this.loadingDialogRef) {
      this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
        panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
        data: {
          title: this.translate.instant('LOADING.TITLE'),
          message: this.translate.instant('LOADING.CREATE_SHIFT'),
          isSuccess: true
        },
        disableClose: true
      });
    } else {
      // Update existing loading dialog message
      this.loadingDialogRef.componentInstance.data = {
        title: this.translate.instant('LOADING.TITLE'),
        message: this.translate.instant('LOADING.CREATE_SHIFT'),
        isSuccess: true
      };
    }

    this.financialService.createShift(payload).subscribe({
      next: (response) => {
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = null;
        }

        if (response.isSuccess && response.data) {
          // Reset form and collapse
          this.shiftForm.reset();
          this.selectedWorkRulesForShift.clear();
          this.isShiftFormExpanded = false;

          // If we just created the work rule, reload shifts
          if (this.editingRule && this.editingRule.id) {
            this.loadWorkRuleShifts(this.editingRule.id);
          }

          // Show success dialog
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('SUCCESS.TITLE'),
              message: this.translate.instant('SUCCESS.SHIFT_CREATED'),
              isSuccess: true
            }
          });
        } else {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: response.message || this.translate.instant('ERROR.SHIFT_CREATED'),
              isSuccess: false
            }
          });
        }
      },
      error: (error) => {
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = null;
        }
        console.error('Error creating shift:', error);
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          width: '500px',
          maxWidth: '90vw',
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: this.translate.instant('ERROR.SHIFT_CREATED'),
            isSuccess: false
          }
        });
      }
    });
  }

  private createShiftFromInlineFormObservable(): Observable<any> {
    const formValue = this.shiftForm.value;
    const payload: CreateShiftDto = {
      name: formValue.name,
      workRuleIds: formValue.workRuleIds,
      startTime: this.toApiTime(formValue.startTime),
      endTime: this.toApiTime(formValue.endTime),
      isOvernight: formValue.isOvernight,
      isThereBreak: formValue.isThereBreak,
      isBreakFixed: formValue.isBreakFixed,
      breakStartTime: formValue.isThereBreak && formValue.isBreakFixed ? this.toApiTime(formValue.breakStartTime) : undefined,
      breakEndTime: formValue.isThereBreak && formValue.isBreakFixed ? this.toApiTime(formValue.breakEndTime) : undefined
    };

    // Update loading dialog message
    if (this.loadingDialogRef) {
      this.loadingDialogRef.componentInstance.data = {
        title: this.translate.instant('LOADING.TITLE'),
        message: this.translate.instant('LOADING.CREATE_SHIFT'),
        isSuccess: true
      };
    }

    return this.financialService.createShift(payload).pipe(
      tap((response) => {
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = null;
        }

        if (response.isSuccess && response.data) {
          // Reset form and collapse
          this.shiftForm.reset();
          this.selectedWorkRulesForShift.clear();
          this.isShiftFormExpanded = false;

          // Reload shifts
          if (this.editingRule && this.editingRule.id) {
            this.loadWorkRuleShifts(this.editingRule.id);
          }

          // Show success dialog
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('SUCCESS.TITLE'),
              message: this.translate.instant('SUCCESS.SHIFT_CREATED'),
              isSuccess: true
            }
          });
        } else {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: response.message || this.translate.instant('ERROR.SHIFT_CREATED'),
              isSuccess: false
            }
          });
        }
      }),
      catchError((error) => {
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = null;
        }
        console.error('Error creating shift:', error);
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          width: '500px',
          maxWidth: '90vw',
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: this.translate.instant('ERROR.SHIFT_CREATED'),
            isSuccess: false
          }
        });
        return of(null);
      })
    );
  }

  cancelInlineShiftForm(): void {
    this.shiftForm.reset();
    this.selectedWorkRulesForShift.clear();
    this.isShiftFormExpanded = false;
  }

  private toApiTime(time: string): string {
    if (!time) {
      return '';
    }
    return time.length === 8 ? time : `${time}:00`;
  }

  private saveWorkRuleAndOpenCreateShiftDialog(): void {
    const formData = this.workRuleForm.value;

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
      category: formData.category,
      type: this.convertWorkRuleTypeToNumber(formData.type),
      expectStartTime: formData.expectStartTime || undefined,
      expectEndTime: formData.expectEndTime || undefined,
      expectedHoursPerDay: formData.expectedHoursPerDay || undefined,
      expectedDaysPerWeek: formData.expectedDaysPerWeek || undefined,
      paymentFrequency: formData.paymentFrequency || 0,
      description: formData.description || undefined,
      isPrivate: formData.isPrivate || false,
      employeeId: formData.isPrivate && this.assignedEmployeeForNewRule ? this.assignedEmployeeForNewRule.id : undefined,
      lateArrivalToleranceMinutes: formData.lateArrivalToleranceMinutes || 0,
      earlyDepartureToleranceMinutes: formData.earlyDepartureToleranceMinutes || 0,
      lateDeductionMinutesPerHour: formData.lateDeductionMinutesPerHour || 0,
      earlyDepartureDeductionMinutesPerHour: formData.earlyDepartureDeductionMinutesPerHour || 0,
      overtimeMultiplier: formData.overtimeMultiplier || 0,
      minimumOvertimeMinutes: formData.minimumOvertimeMinutes || 0,
      absenceDeductionMultiplier: formData.absenceDeductionMultiplier || 0,
      allowedAbsenceDaysPerMonth: formData.allowedAbsenceDaysPerMonth || 0,
      areOffDaysPaid: formData.areOffDaysPaid !== undefined ? formData.areOffDaysPaid : true,
      allowWorkOnOffDays: formData.allowWorkOnOffDays ?? false,
      treatOffDayWorkAsOvertime: formData.allowWorkOnOffDays ? (formData.treatOffDayWorkAsOvertime ?? false) : false,
      offDayOvertimeMultiplier: formData.allowWorkOnOffDays && formData.treatOffDayWorkAsOvertime ? (formData.offDayOvertimeMultiplier ?? 0) : 0,
      offDayHourlyRate: formData.allowWorkOnOffDays ? (formData.offDayHourlyRate ?? 0) : 0
    };

    this.financialService.createWorkRule(payload).pipe(
      catchError(err => {
        console.error('Error creating work rule:', err);
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = null;
        }
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      // Close loading dialog
      if (this.loadingDialogRef) {
        this.loadingDialogRef.close();
        this.loadingDialogRef = null;
      }

      if (response.isSuccess && response.data) {
        // Switch to edit mode
        this.isEditing = true;
        this.editingRule = response.data;

        // Load shifts for the newly created work rule
        this.loadWorkRuleShifts(response.data.id);

        // Now open the create shift dialog
        const dialogRef = this.dialog.open(CreateShiftDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          backdropClass: 'transparent-backdrop',
          width: '90vw',
          maxWidth: '1200px',
          maxHeight: '90vh',
          data: {
            workRuleIds: [response.data.id]
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result && this.editingRule && this.editingRule.id) {
            // Reload shifts after creating a new one
            this.loadWorkRuleShifts(this.editingRule.id);
          }
        });
      } else {
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          width: '500px',
          maxWidth: '90vw',
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: response.message || this.translate.instant('ERROR.FAILED_TO_CREATE_WORK_RULE'),
            isSuccess: false
          }
        });
      }
    });
  }

  private saveWorkRuleAndOpenAssignShiftDialog(): void {
    const formData = this.workRuleForm.value;

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
      category: formData.category,
      type: this.convertWorkRuleTypeToNumber(formData.type),
      expectStartTime: formData.expectStartTime || undefined,
      expectEndTime: formData.expectEndTime || undefined,
      expectedHoursPerDay: formData.expectedHoursPerDay || undefined,
      expectedDaysPerWeek: formData.expectedDaysPerWeek || undefined,
      paymentFrequency: formData.paymentFrequency || 0,
      description: formData.description || undefined,
      isPrivate: formData.isPrivate || false,
      employeeId: formData.isPrivate && this.assignedEmployeeForNewRule ? this.assignedEmployeeForNewRule.id : undefined,
      lateArrivalToleranceMinutes: formData.lateArrivalToleranceMinutes || 0,
      earlyDepartureToleranceMinutes: formData.earlyDepartureToleranceMinutes || 0,
      lateDeductionMinutesPerHour: formData.lateDeductionMinutesPerHour || 0,
      earlyDepartureDeductionMinutesPerHour: formData.earlyDepartureDeductionMinutesPerHour || 0,
      overtimeMultiplier: formData.overtimeMultiplier || 0,
      minimumOvertimeMinutes: formData.minimumOvertimeMinutes || 0,
      absenceDeductionMultiplier: formData.absenceDeductionMultiplier || 0,
      allowedAbsenceDaysPerMonth: formData.allowedAbsenceDaysPerMonth || 0,
      areOffDaysPaid: formData.areOffDaysPaid !== undefined ? formData.areOffDaysPaid : true,
      allowWorkOnOffDays: formData.allowWorkOnOffDays ?? false,
      treatOffDayWorkAsOvertime: formData.allowWorkOnOffDays ? (formData.treatOffDayWorkAsOvertime ?? false) : false,
      offDayOvertimeMultiplier: formData.allowWorkOnOffDays && formData.treatOffDayWorkAsOvertime ? (formData.offDayOvertimeMultiplier ?? 0) : 0,
      offDayHourlyRate: formData.allowWorkOnOffDays ? (formData.offDayHourlyRate ?? 0) : 0
    };

    this.financialService.createWorkRule(payload).pipe(
      catchError(err => {
        console.error('Error creating work rule:', err);
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = null;
        }
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      // Close loading dialog
      if (this.loadingDialogRef) {
        this.loadingDialogRef.close();
        this.loadingDialogRef = null;
      }

      if (response.isSuccess && response.data) {
        // Switch to edit mode
        this.isEditing = true;
        this.editingRule = response.data;

        // Load shifts for the newly created work rule
        this.loadWorkRuleShifts(response.data.id);

        // Now open the assign existing shift dialog
        this.openAssignExistingShiftDialog();
      } else {
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          width: '500px',
          maxWidth: '90vw',
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: response.message || this.translate.instant('ERROR.FAILED_TO_CREATE_WORK_RULE'),
            isSuccess: false
          }
        });
      }
    });
  }

  openAssignExistingShiftDialog(): void {
    // Check if we have a saved work rule (with ID)
    if (!this.editingRule || !this.editingRule.id) {
      // If adding a new work rule, try to save it first
      if (!this.isEditing) {
        // Validate form first
        const category = this.workRuleForm.get('category')?.value;
        const type = this.workRuleForm.get('type')?.value;

        if (!category || category.trim() === '' || !type) {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: this.translate.instant('SaveWorkRuleFirstToAssignShifts'),
              isSuccess: false
            }
          });
          return;
        }

        // Auto-save the work rule first
        this.saveWorkRuleAndOpenAssignShiftDialog();
        return;
      }
      // If editing but no ID, something is wrong
      return;
    }

    // Load all shifts
    this.financialService.getShifts().subscribe({
      next: (response) => {
        if (!response.isSuccess || !response.data) {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: this.translate.instant('ERROR.FAILED_TO_LOAD_SHIFTS'),
              isSuccess: false
            }
          });
          return;
        }

        // Filter out shifts that are already assigned to this work rule
        const allShifts = response.data;
        const assignedShiftIds = new Set(this.workRuleShifts.map(s => s.id));
        const availableShifts = allShifts.filter(shift => !assignedShiftIds.has(shift.id));

        if (availableShifts.length === 0) {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: this.translate.instant('NoAvailableShiftsToAssign'),
              isSuccess: false
            }
          });
          return;
        }

        // Open the shift selection dialog
        this.showShiftSelectionDialog(availableShifts);
      },
      error: (error) => {
        console.error('Error loading shifts:', error);
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          width: '500px',
          maxWidth: '90vw',
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: this.translate.instant('ERROR.FAILED_TO_LOAD_SHIFTS'),
            isSuccess: false
          }
        });
      }
    });
  }

  private showShiftSelectionDialog(availableShifts: ShiftDto[]): void {
    if (!this.editingRule) {
      return;
    }

    // Open the shift selection dialog
    const dialogRef = this.dialog.open(AssignExistingShiftDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      backdropClass: 'transparent-backdrop',
      width: '600px',
      maxWidth: '90vw',
      data: {
        shifts: availableShifts,
        workRuleId: this.editingRule.id
      }
    });

    dialogRef.afterClosed().subscribe(selectedShiftId => {
      if (selectedShiftId && this.editingRule) {
        this.assignShiftToWorkRule(selectedShiftId);
      }
    });
  }

  private buildShiftSelectionMessage(shifts: ShiftDto[]): string {
    return this.translate.instant('SelectShiftToAssign', { count: shifts.length });
  }

  private buildShiftSelectionList(shifts: ShiftDto[]): string {
    return shifts.map(s => s.name).join(', ');
  }

  private assignShiftToWorkRule(shiftId: number): void {
    if (!this.editingRule) {
      return;
    }

    // Get the shift details first
    this.financialService.getShift(shiftId).subscribe({
      next: (response) => {
        if (!response.isSuccess || !response.data) {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: this.translate.instant('ERROR.FAILED_TO_LOAD_SHIFT'),
              isSuccess: false
            }
          });
          return;
        }

        const shift = response.data;
        const currentWorkRuleIds = shift.workRules?.map(wr => wr.workRule.id) || [];

        // Check if work rule is already assigned
        if (currentWorkRuleIds.includes(this.editingRule!.id)) {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: this.translate.instant('ShiftAlreadyAssignedToWorkRule'),
              isSuccess: false
            }
          });
          return;
        }

        // Show loading dialog
        this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: this.translate.instant('LOADING.TITLE'),
            message: this.translate.instant('LOADING.ASSIGN_SHIFT_TO_WORK_RULE'),
            isSuccess: true
          },
          disableClose: true
        });

        // Use the dedicated assign endpoint
        this.financialService.assignShiftToWorkRule(this.editingRule!.id, shiftId).subscribe({
          next: (response) => {
            // Close loading dialog
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
              this.loadingDialogRef = null;
            }

            if (response.isSuccess) {
              this.dialog.open(NotificationDialogComponent, {
                panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
                width: '500px',
                maxWidth: '90vw',
                data: {
                  title: this.translate.instant('SUCCESS.TITLE'),
                  message: response.message || this.translate.instant('SUCCESS.SHIFT_ASSIGNED_TO_WORK_RULE'),
                  isSuccess: true
                }
              });
              // Reload shifts
              this.loadWorkRuleShifts(this.editingRule!.id);
            } else {
              // Show the actual backend message
              const errorMessage = response.message || this.translate.instant('ERROR.FAILED_TO_ASSIGN_SHIFT_TO_WORK_RULE');
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
            console.error('Error assigning shift to work rule:', error);
            // Close loading dialog
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
              this.loadingDialogRef = null;
            }

            // Extract the actual backend error message from the response body
            let errorMessage: string;

            // Check if error.error exists (API response body)
            if (error?.error) {
              // Try to get message from the API response structure: { message: "...", isSuccess: false, ... }
              if (error.error.message) {
                errorMessage = error.error.message;
              }
              // Check for errors array
              else if (error.error.errors && Array.isArray(error.error.errors) && error.error.errors.length > 0) {
                errorMessage = error.error.errors.join(', ');
              }
              // If error.error is a string
              else if (typeof error.error === 'string') {
                errorMessage = error.error;
              }
              // Fallback
              else {
                errorMessage = this.translate.instant('ERROR.FAILED_TO_ASSIGN_SHIFT_TO_WORK_RULE');
              }
            }
            // If no error.error, try error.message
            else if (error?.message) {
              errorMessage = error.message;
            }
            // Final fallback
            else {
              errorMessage = this.translate.instant('ERROR.FAILED_TO_ASSIGN_SHIFT_TO_WORK_RULE');
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
      },
      error: (error) => {
        console.error('Error loading shift:', error);
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          width: '500px',
          maxWidth: '90vw',
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: this.translate.instant('ERROR.FAILED_TO_LOAD_SHIFT'),
            isSuccess: false
          }
        });
      }
    });
  }

  openAssignShiftDialog(shift: ShiftDto): void {
    if (!this.editingRule) {
      return;
    }

    // Load work rule details to get assigned employees
    this.financialService.getWorkRuleDetails(this.editingRule.id).subscribe({
      next: (response) => {
        if (!response.isSuccess || !response.data) {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: this.translate.instant('ERROR.FAILED_TO_LOAD_WORK_RULES'),
              isSuccess: false
            }
          });
          return;
        }

        const workRuleDetails = response.data;
        // Get eligible employees (employees assigned to work rule but not to this shift)
        const assignedIds = new Set((shift.employees ?? []).map(emp => emp.employeeId));
        const eligibleEmployees = workRuleDetails.assignedEmployees?.filter(emp => !assignedIds.has(emp.id)) || [];

        // Check if there are any employees assigned to the work rule at all
        const totalAssignedToWorkRule = workRuleDetails.assignedEmployees?.length || 0;

        if (totalAssignedToWorkRule === 0) {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: this.translate.instant('NoEmployeesAssignedToWorkRule'),
              isSuccess: false
            }
          });
          return;
        }

        if (eligibleEmployees.length === 0) {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: this.translate.instant('NoEligibleEmployeesForShift'),
              isSuccess: false
            }
          });
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
          if (selectedEmployeeIds && selectedEmployeeIds.length > 0 && this.editingRule) {
            this.assignEmployeesToShift(shift.id, selectedEmployeeIds);
          }
        });
      },
      error: (error) => {
        console.error('Error loading work rule details:', error);
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          width: '500px',
          maxWidth: '90vw',
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: this.translate.instant('ERROR.FAILED_TO_LOAD_WORK_RULES'),
            isSuccess: false
          }
        });
      }
    });
  }

  private assignEmployeesToShift(shiftId: number, employeeIds: number[]): void {
    // Show loading dialog
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
        // Close loading dialog
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = null;
        }

        const failed = results.find(r => !r.isSuccess);
        if (failed) {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: this.localizeErrorMessage(failed.message || 'ERROR.SHIFT_ASSIGNMENT_FAILED'),
              isSuccess: false
            }
          });
        } else {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('SUCCESS.TITLE'),
              message: this.translate.instant('SUCCESS.SHIFT_ASSIGNMENT'),
              isSuccess: true
            }
          });
          // Reload shifts
          if (this.editingRule) {
            this.loadWorkRuleShifts(this.editingRule.id);
          }
        }
      },
      error: (error) => {
        console.error('Error in forkJoin:', error);
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = null;
        }
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          width: '500px',
          maxWidth: '90vw',
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: this.localizeErrorMessage(error?.error?.message || error?.message || 'ERROR.SHIFT_ASSIGNMENT_FAILED'),
            isSuccess: false
          }
        });
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
    if (!this.editingRule || !this.editingRule.id) {
      return;
    }

    const confirmMessage = this.translate.instant('UnassignShiftFromWorkRuleConfirm', {
      shiftName: shift.name,
      workRuleName: this.editingRule.category
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
      if (confirmed) {
        this.unassigningShiftFromWorkRule.add(shift.id);

        // Show loading dialog
        this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: this.translate.instant('LOADING.TITLE'),
            message: this.translate.instant('LOADING.UNASSIGN_SHIFT_FROM_WORK_RULE'),
            isSuccess: true
          },
          disableClose: true
        });

        this.financialService.unassignShiftFromWorkRule(this.editingRule!.id, shift.id).subscribe({
          next: (response) => {
            this.unassigningShiftFromWorkRule.delete(shift.id);

            // Close loading dialog
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
              this.loadingDialogRef = null;
            }

            if (response.isSuccess) {
              this.dialog.open(NotificationDialogComponent, {
                panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
                width: '500px',
                maxWidth: '90vw',
                data: {
                  title: this.translate.instant('SUCCESS.TITLE'),
                  message: this.translate.instant('SUCCESS.UNASSIGN_SHIFT_FROM_WORK_RULE'),
                  isSuccess: true
                }
              });
              // Reload shifts
              if (this.editingRule) {
                this.loadWorkRuleShifts(this.editingRule.id);
              }
            } else {
              const errorMessage = this.localizeErrorMessage(response.message || 'ERROR.UNASSIGN_SHIFT_FROM_WORK_RULE_FAILED');
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
            this.unassigningShiftFromWorkRule.delete(shift.id);

            // Close loading dialog
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
              this.loadingDialogRef = null;
            }

            console.error('Error unassigning shift from work rule:', error);
            const errorMessage = this.localizeErrorMessage('ERROR.UNASSIGN_SHIFT_FROM_WORK_RULE_FAILED');
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
    });
  }

  unassignEmployeeFromShift(shift: ShiftDto, employee: any): void {
    const confirmMessage = this.translate.instant('UnassignEmployeeFromShiftConfirm', {
      employeeName: employee.name,
      shiftName: shift.name
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
      if (confirmed) {
        const key = `${shift.id}-${employee.employeeId}`;
        this.unassigningFromShift.set(key, true);

        // Show loading dialog
        this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: this.translate.instant('LOADING.TITLE'),
            message: this.translate.instant('LOADING.UNASSIGN_EMPLOYEE_FROM_SHIFT'),
            isSuccess: true
          },
          disableClose: true
        });

        this.financialService.unassignEmployeeFromShift(shift.id, employee.employeeId).subscribe({
          next: (response) => {
            this.unassigningFromShift.set(key, false);

            // Close loading dialog
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
              this.loadingDialogRef = null;
            }

            if (response.isSuccess) {
              this.dialog.open(NotificationDialogComponent, {
                panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
                width: '500px',
                maxWidth: '90vw',
                data: {
                  title: this.translate.instant('SUCCESS.TITLE'),
                  message: this.translate.instant('SUCCESS.UNASSIGN_EMPLOYEE_FROM_SHIFT'),
                  isSuccess: true
                }
              });
              // Reload shifts
              if (this.editingRule) {
                this.loadWorkRuleShifts(this.editingRule.id);
              }
            } else {
              const errorMessage = this.localizeErrorMessage(response.message || 'ERROR.UNASSIGN_EMPLOYEE_FROM_SHIFT_FAILED');
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
            console.error('Error unassigning employee from shift:', error);
            this.unassigningFromShift.set(key, false);

            // Close loading dialog
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
              this.loadingDialogRef = null;
            }

            const errorMessage = this.localizeErrorMessage(error?.error?.message || error?.message || 'ERROR.UNASSIGN_EMPLOYEE_FROM_SHIFT_FAILED');
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
    });
  }

  formatShiftRange(startTime: string | null | undefined, endTime: string | null | undefined): string {
    if (!startTime || !endTime) {
      return this.translate.instant('NotAvailable');
    }
    return `${startTime} - ${endTime}`;
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  }

  private localizeErrorMessage(message: string): string {
    if (!message) {
      return this.translate.instant('ERROR.FAILED_TO_DELETE_WORK_RULE');
    }

    // Map common error messages to translation keys
    const errorMap: { [key: string]: string } = {
      'Internal server error': 'InternalServerError',
      'Internal Server Error': 'InternalServerError',
      'INTERNAL_SERVER_ERROR': 'InternalServerError',
      'Failed to delete work rule': 'ERROR.FAILED_TO_DELETE_WORK_RULE',
      'Failed to delete work rule.': 'ERROR.FAILED_TO_DELETE_WORK_RULE'
    };

    // Check if message matches any known error
    const normalizedMessage = message.trim();
    const translationKey = errorMap[normalizedMessage];

    if (translationKey) {
      return this.translate.instant(translationKey);
    }

    // Handle backend error: "Assign employees to one of the work rule shifts first: {names}"
    const assignToShiftPattern = /^Assign employees to one of the work rule shifts first:\s*(.+)$/i;
    const assignToShiftMatch = normalizedMessage.match(assignToShiftPattern);
    if (assignToShiftMatch) {
      const names = assignToShiftMatch[1].trim();
      return this.translate.instant('ERROR.ASSIGN_EMPLOYEES_TO_SHIFT_FIRST', { names });
    }

    // Try to translate if it's already a translation key
    const translated = this.translate.instant(normalizedMessage);
    if (translated !== normalizedMessage) {
      return translated;
    }

    // If message contains "Internal server error" or similar, use the translation
    if (normalizedMessage.toLowerCase().includes('internal server error')) {
      return this.translate.instant('InternalServerError');
    }

    // Return the message as-is if no translation found
    return normalizedMessage;
  }

  showErrorDialog(message: string): void {
    const localizedMessage = this.localizeErrorMessage(message);

    this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      width: '500px',
      maxWidth: '90vw',
      data: {
        title: this.translate.instant('ERROR.TITLE'),
        message: localizedMessage,
        isSuccess: false
      }
    });
  }
}
