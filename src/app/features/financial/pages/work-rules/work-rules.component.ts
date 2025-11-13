import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  faEllipsisVertical
} from '@fortawesome/free-solid-svg-icons';

import { FinancialService } from '../../../../core/services/financial.service';
import { WorkRuleDto, CreateWorkRuleDto, UpdateWorkRuleDto, WorkRuleType, CreateShiftDto } from '../../../../core/interfaces/financial.interface';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { CustomDropdownComponent } from '../../../../shared/components/custom-dropdown/custom-dropdown.component';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { AssignWorkRuleDialogComponent } from './assign-work-rule-dialog.component';
import { EmployeeService } from '../../../../core/employee.service';
import { MatDialog } from '@angular/material/dialog';
import { catchError, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-work-rules',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule,
    FontAwesomeModule,
    ShimmerComponent,
    CustomDropdownComponent
  ],
  templateUrl: './work-rules.component.html',
  styleUrls: ['./work-rules.component.css']
})
export class WorkRulesComponent implements OnInit {
  private financialService = inject(FinancialService);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
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

  // Data properties
  workRules: WorkRuleDto[] = [];
  isLoading = true;
  error: string | null = null;
  totalCount = 0;
  activeMenuId: number | null = null;

  // Form properties
  workRuleForm: FormGroup;
  isFormVisible = false;
  isEditing = false;
  editingRule: WorkRuleDto | null = null;
  assignedEmployeeForNewRule: any = null;

  // Options
  workRuleTypeOptions = this.financialService.getWorkRuleTypeOptions();

  constructor() {
    this.workRuleForm = this.fb.group({
      category: ['', [Validators.required, Validators.maxLength(100)]],
      type: [WorkRuleType.Daily, Validators.required],
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
    this.isEditing = false;
    this.editingRule = null;
    this.workRuleForm.reset({
      type: WorkRuleType.Daily,
      isPrivate: false,
      lateArrivalToleranceMinutes: 15,
      earlyDepartureToleranceMinutes: 15,
      lateDeductionMinutesPerHour: 30,
      earlyDepartureDeductionMinutesPerHour: 30,
      overtimeMultiplier: 1.5,
      minimumOvertimeMinutes: 30,
      absenceDeductionMultiplier: 1.0,
      allowedAbsenceDaysPerMonth: 0,
      areOffDaysPaid: true,
      allowWorkOnOffDays: false,
      treatOffDayWorkAsOvertime: false,
      offDayOvertimeMultiplier: null,
      offDayHourlyRate: null
    });
    this.isFormVisible = true;
  }

  showEditForm(rule: WorkRuleDto): void {
    this.activeMenuId = null; // Close menu when action is clicked
    this.isEditing = true;
    this.editingRule = rule;
    
    // Convert type from number to string for the dropdown
    let typeValue: string | number = rule.type;
    if (typeof typeValue === 'number') {
      const typeMap: { [key: number]: string } = {
        1: 'Daily',
        2: 'Weekly',
        3: 'Monthly',
        4: 'Hourly',
        5: 'Custom'
      };
      typeValue = typeMap[typeValue] || 'Daily';
    }
    
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
      employeeId: rule.employeeId || null,
      // Late & Early Departure Rules
      lateArrivalToleranceMinutes: rule.lateArrivalToleranceMinutes ?? 15,
      earlyDepartureToleranceMinutes: rule.earlyDepartureToleranceMinutes ?? 15,
      lateDeductionMinutesPerHour: rule.lateDeductionMinutesPerHour ?? 30,
      earlyDepartureDeductionMinutesPerHour: rule.earlyDepartureDeductionMinutesPerHour ?? 30,
      // Overtime Rules
      overtimeMultiplier: rule.overtimeMultiplier ?? 1.5,
      minimumOvertimeMinutes: rule.minimumOvertimeMinutes ?? 30,
      // Absence Rules
      absenceDeductionMultiplier: rule.absenceDeductionMultiplier ?? 1.0,
      allowedAbsenceDaysPerMonth: rule.allowedAbsenceDaysPerMonth ?? 0,
      areOffDaysPaid: rule.areOffDaysPaid ?? true,
      allowWorkOnOffDays: rule.allowWorkOnOffDays ?? false,
      treatOffDayWorkAsOvertime: rule.treatOffDayWorkAsOvertime ?? false,
      offDayOvertimeMultiplier: rule.offDayOvertimeMultiplier ?? null,
      offDayHourlyRate: rule.offDayHourlyRate ?? null
    });
    this.isFormVisible = true;
  }

  hideForm(): void {
    this.isFormVisible = false;
    this.isEditing = false;
    this.editingRule = null;
    this.assignedEmployeeForNewRule = null;
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
    // Convert type enum to number
    const payload: CreateWorkRuleDto = {
      category: data.category,
      type: typeof data.type === 'number' ? data.type : (data.type === 'Daily' ? 1 : data.type === 'Weekly' ? 2 : data.type === 'Monthly' ? 3 : data.type === 'Hourly' ? 4 : data.type === 'Custom' ? 5 : 1),
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
      if (response.isSuccess) {
        this.hideForm();
        this.loadWorkRules();
        this.showSuccessDialog('WORK_RULE_CREATED');
      } else {
        this.showErrorDialog(response.message || this.translate.instant('ERROR.FAILED_TO_CREATE_WORK_RULE'));
      }
    });
  }

  updateWorkRule(id: number, data: any): void {
    // Convert type enum to number and prepare payload
    const payload: UpdateWorkRuleDto = {
      category: data.category,
      type: typeof data.type === 'number' ? data.type : (data.type === 'Daily' ? 1 : data.type === 'Weekly' ? 2 : data.type === 'Monthly' ? 3 : data.type === 'Hourly' ? 4 : data.type === 'Custom' ? 5 : data.type),
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
    if (confirm(this.translate.instant('CONFIRM_DELETE_WORK_RULE'))) {
      this.financialService.deleteWorkRule(rule.id).pipe(
        catchError(err => {
          console.error('Error deleting work rule:', err);
          return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
        })
      ).subscribe(response => {
        if (response.isSuccess) {
          this.loadWorkRules();
          // Show success message
        } else {
          this.error = response.message || this.translate.instant('ERROR.FAILED_TO_DELETE_WORK_RULE');
        }
      });
    }
  }

  toggleActionMenu(event: Event, ruleId: number): void {
    event.stopPropagation();
    
    if (this.activeMenuId === ruleId) {
      this.activeMenuId = null;
    } else {
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close menu when clicking outside
    this.activeMenuId = null;
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
        this.financialService.assignWorkRule(rule.id, { employeeIds: selectedIds }).subscribe({
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
    });
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
      'Daily': 'Daily',
      'Weekly': 'Weekly',
      'Monthly': 'Monthly',
      'Hourly': 'Hourly',
      'Custom': 'Custom'
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
      'Daily': 'يومي',
      'Weekly': 'أسبوعي',
      'Monthly': 'شهري',
      'Hourly': 'بالساعة',
      'Custom': 'مخصص'
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

  showErrorDialog(message: string): void {
    // If message is a key, translate it; otherwise use as is
    const translatedMessage = this.translate.instant(message);
    const finalMessage = translatedMessage !== message ? translatedMessage : message;
    
    this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title: this.translate.instant('ERROR.TITLE'),
        message: finalMessage,
        isSuccess: false
      }
    });
  }
}
