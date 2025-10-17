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
import { WorkRuleDto, CreateWorkRuleDto, UpdateWorkRuleDto, WorkRuleType } from '../../../../core/interfaces/financial.interface';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { CustomDropdownComponent } from '../../../../shared/components/custom-dropdown/custom-dropdown.component';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { AssignWorkRuleDialogComponent } from './assign-work-rule-dialog.component';
import { EmployeeService } from '../../../../core/employee.service';
import { MatDialog } from '@angular/material/dialog';
import { catchError, of } from 'rxjs';

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
      type: [WorkRuleType.Regular, Validators.required],
      expectStartTime: [''],
      expectEndTime: [''],
      expectedHoursPerDay: [null, [Validators.min(1), Validators.max(24)]],
      expectedDaysPerWeek: [null, [Validators.min(1), Validators.max(7)]],
      description: [''],
      isPrivate: [false]
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
      type: WorkRuleType.Regular,
      isPrivate: false
    });
    this.isFormVisible = true;
  }

  showEditForm(rule: WorkRuleDto): void {
    this.activeMenuId = null; // Close menu when action is clicked
    this.isEditing = true;
    this.editingRule = rule;
    this.workRuleForm.patchValue({
      category: rule.category,
      type: rule.type,
      expectStartTime: rule.expectStartTime || '',
      expectEndTime: rule.expectEndTime || '',
      expectedHoursPerDay: rule.expectedHoursPerDay || null,
      expectedDaysPerWeek: rule.expectedDaysPerWeek || null,
      description: rule.description || '',
      isPrivate: rule.isPrivate,
      employeeId: rule.employeeId || null
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
    if (this.workRuleForm.valid) {
      const formData = this.workRuleForm.value;
      
      if (this.isEditing && this.editingRule) {
        this.updateWorkRule(this.editingRule.id, formData);
      } else {
        this.createWorkRule(formData);
      }
    }
  }

  createWorkRule(data: CreateWorkRuleDto): void {
    // Add employee ID if a private rule has an assigned employee
    if (data.isPrivate && this.assignedEmployeeForNewRule) {
      data.employeeId = this.assignedEmployeeForNewRule.id;
    }

    this.financialService.createWorkRule(data).pipe(
      catchError(err => {
        console.error('Error creating work rule:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess) {
        this.hideForm();
        this.loadWorkRules();
        this.showSuccessDialog('SUCCESS.WORK_RULE_CREATED');
      } else {
        this.showErrorDialog(response.message || this.translate.instant('ERROR.FAILED_TO_CREATE_WORK_RULE'));
      }
    });
  }

  updateWorkRule(id: number, data: UpdateWorkRuleDto): void {
    this.financialService.updateWorkRule(id, data).pipe(
      catchError(err => {
        console.error('Error updating work rule:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess) {
        this.hideForm();
        this.loadWorkRules();
        this.showSuccessDialog('SUCCESS.WORK_RULE_UPDATED');
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
      '1': 'Regular',
      '2': 'Flexible', 
      '3': 'Shift',
      '4': 'Hourly',
      '5': 'Custom',
      'Regular': 'Regular',
      'Flexible': 'Flexible',
      'Shift': 'Shift',
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
      '1': 'منتظم',
      '2': 'مرن', 
      '3': 'نوبات',
      '4': 'بالساعة',
      '5': 'مخصص',
      'Regular': 'منتظم',
      'Flexible': 'مرن',
      'Shift': 'نوبات',
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
