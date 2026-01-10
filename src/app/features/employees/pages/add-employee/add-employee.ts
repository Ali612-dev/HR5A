import { Component, OnInit, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EmployeeService } from '../../../../core/employee.service';
import { CreateEmployeeDto } from '../../../../core/interfaces/employee.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSave, faTimes, faUserPlus, faPeopleGroup, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { AddEmployeeStore } from '../../../../store/add-employee.store';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { Subject, catchError, forkJoin, map, of, takeUntil } from 'rxjs';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FinancialService } from '../../../../core/services/financial.service';
import { WorkRuleDto, ShiftDto, SalaryType, AssignedEmployeeDto } from '../../../../core/interfaces/financial.interface';
import { AssignShiftDialogComponent } from '../../../financial/pages/work-rules/assign-shift-dialog.component';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    FontAwesomeModule,
    ShimmerComponent,
    MatDialogModule
  ],
  templateUrl: './add-employee.html',
  styleUrls: ['./add-employee.css']
})
export class AddEmployeeComponent implements OnInit, OnDestroy {
  readonly store = inject(AddEmployeeStore);
  employeeForm!: FormGroup;

  faSave = faSave;
  faTimes = faTimes;
  faUserPlus = faUserPlus;
  faPeopleGroup = faPeopleGroup;
  faArrowLeft = faArrowLeft;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private destroy$ = new Subject<void>();
  private dialog = inject(MatDialog);
  private loadingDialogRef: MatDialogRef<NotificationDialogComponent> | null = null;


  SalaryType = SalaryType;

  salaryTypeOptions = [
    { value: SalaryType.PerMonth, labelKey: 'SalaryType_PerMonth' },
    { value: SalaryType.PerDay, labelKey: 'SalaryType_PerDay' },
    { value: SalaryType.PerHour, labelKey: 'SalaryType_PerHour' },
    { value: SalaryType.Custom, labelKey: 'SalaryType_Custom' }
  ];

  // Translation cache to avoid repeated lookups
  private errorMessages: { [key: string]: string } = {};
  private isTranslationLoaded = false;

  constructor() {
    effect(() => {
      if (this.store.isLoading()) {
        this.openLoadingDialog();
      } else {
        this.closeLoadingDialog();
      }

      const apiMessage = this.store.error();
      if (apiMessage) {
        this.showErrorDialog(apiMessage);
        this.store.resetState();
      }

      if (this.store.isSuccess()) {
        this.showSuccessDialog();
        this.store.resetState();
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadTranslations();
    this.store.resetState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.employeeForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,14}$/)]],
      department: [''],
      email: ['', [Validators.required, Validators.email]],
      cardNumber: ['', [Validators.required, Validators.minLength(4)]],
      isActive: [true],
      workRuleId: [null],
      shiftId: [null],
      salaryType: [SalaryType.PerMonth],
      salaryAmount: [null],
      hourlyRate: [null],
      overtimeRate: [null],
      salaryNotes: ['', Validators.maxLength(300)]
    });
  }

  private loadTranslations(): void {
    // Preload all error message translations
    const translationKeys = [
      'ERROR.USERNAME_REQUIRED',
      'ERROR.USERNAME_MINLENGTH',
      'ERROR.PASSWORD_REQUIRED',
      'ERROR.PASSWORD_MINLENGTH',
      'ERROR.NAME_REQUIRED',
      'ERROR.PHONE_REQUIRED',
      'ERROR.EMAIL_REQUIRED',
      'ERROR.CARD_NUMBER_REQUIRED',
      'ERROR.CARD_NUMBER_MINLENGTH',
      'ERROR.NAME_MINLENGTH',
      'ERROR.PHONE_PATTERN',
      'ERROR.EMAIL_EMAIL',
      'ERROR.WORK_RULE_REQUIRED',
      'ERROR.SHIFT_REQUIRED',
      'ERROR.SALARY_TYPE_REQUIRED',
      'ERROR.SALARY_AMOUNT_REQUIRED',
      'ERROR.SALARY_AMOUNT_MIN',
      'ERROR.HOURLY_RATE_REQUIRED',
      'ERROR.HOURLY_RATE_MIN',
      'ERROR.OVERTIME_RATE_MIN',
      'ERROR.SALARY_NOTES_MAXLENGTH',
      'ERROR.SELECT_WORK_RULE_AND_SHIFT',
      'ERROR.NO_ELIGIBLE_EMPLOYEES_SHIFT',
      'ERROR.SHIFT_ASSIGNMENT_FAILED',
      'ERROR.SHIFT_NOT_FOUND',
      'SUCCESS.SHIFT_ASSIGNMENT'
    ];

    // Load translations when language changes
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cacheErrorMessages(translationKeys);
      });

    // Initial load
    this.cacheErrorMessages(translationKeys);
  }

  private cacheErrorMessages(keys: string[]): void {
    this.translate.get(keys)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (translations) => {
          this.errorMessages = translations;
          this.isTranslationLoaded = true;
          console.log('Translations loaded:', translations);
        },
        error: (error) => {
          console.error('Error loading translations:', error);
          this.isTranslationLoaded = false;
        }
      });
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const {
      username,
      password,
      isActive,
      workRuleId,
      shiftId,
      salaryType,
      salaryAmount,
      hourlyRate,
      overtimeRate,
      salaryNotes,
      ...employeeFormValue
    } = this.employeeForm.value;

    const employeePayload: CreateEmployeeDto = {
      ...(employeeFormValue as CreateEmployeeDto),
      isActive
    };

    const trimmedEmployee: CreateEmployeeDto = {
      ...employeePayload,
      name: employeePayload.name.trim(),
      phone: employeePayload.phone.trim(),
      email: employeePayload.email ? employeePayload.email.trim() : null,
      department: employeePayload.department ? employeePayload.department.trim() : null,
      cardNumber: employeePayload.cardNumber.trim(),
      workRuleId: this.toNumber(workRuleId) ?? undefined
    };

    const usernameValue = (username ?? '').trim();
    const passwordValue = password ?? '';
    const salaryTypeValue = this.toNumber(salaryType);
    const salaryAmountValue = this.toNumber(salaryAmount);
    const hourlyRateValue = this.toNumber(hourlyRate);
    const overtimeRateValue = this.toNumber(overtimeRate);
    const workRuleIdValue = this.toNumber(workRuleId);
    const shiftIdValue = this.toNumber(shiftId);

    const notesValue = (salaryNotes ?? '').trim();

    const financialSetup = (workRuleIdValue !== null && shiftIdValue !== null && salaryTypeValue !== null && salaryAmountValue !== null)
      ? {
        workRuleId: workRuleIdValue,
        shiftId: shiftIdValue,
        salary: {
          salaryType: salaryTypeValue,
          amount: salaryAmountValue,
          notes: notesValue.length > 0 ? notesValue : undefined,
          hourlyRate: hourlyRateValue ?? undefined,
          overtimeRate: overtimeRateValue ?? undefined
        }
      }
      : undefined;

    this.store.addEmployee(
      trimmedEmployee,
      {
        username: usernameValue,
        userName: usernameValue,
        password: passwordValue,
        fullName: trimmedEmployee.name,
        email: trimmedEmployee.email ?? undefined,
        phoneNumber: trimmedEmployee.phone
      },
      financialSetup
    );
  }

  onCancel(): void {
    this.navigateToEmployeesList();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.employeeForm.controls).forEach(key => {
      const control = this.employeeForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  private navigateToEmployeesList(): void {
    this.router.navigate(['/employees']);
    this.store.resetState();
    window.history.pushState({}, '', '/employees');
  }

  private resetForm(): void {
    this.employeeForm.reset({
      username: '',
      password: '',
      name: '',
      phone: '',
      department: '',
      email: '',
      cardNumber: '',
      isActive: true,
      workRuleId: null,
      shiftId: null,
      salaryType: SalaryType.PerMonth,
      salaryAmount: null,
      hourlyRate: null,
      overtimeRate: null,
      salaryNotes: ''
    });
  }

  /**
   * Get validation errors for a specific form control
   * Returns translated error messages
   */
  getValidationErrors(controlName: string): string[] {
    const control = this.employeeForm.get(controlName);

    if (!control || !control.touched || !control.errors) {
      return [];
    }

    // Get the error messages
    const errorMessages = this.buildErrorMessages(controlName, control.errors);

    // Translate all messages using the translate service
    return errorMessages.map(msg => {
      // If translation key is not found, return a default message
      const translated = this.translate.instant(msg);
      return translated !== msg ? translated : this.getDefaultErrorMessage(controlName, msg.replace('ERROR.', '').toLowerCase());
    });
  }

  private buildErrorMessages(controlName: string, errors: any): string[] {
    const errorMessages: string[] = [];

    // Handle required validation
    if (errors['required']) {
      errorMessages.push(this.getRequiredErrorKey(controlName));
    }
    // Handle minlength validation
    if (errors['minlength']) {
      const minLengthKey = this.getMinLengthErrorKey(controlName);
      if (minLengthKey) {
        errorMessages.push(minLengthKey);
      }
    }
    // Handle pattern validation
    if (errors['pattern']) {
      const patternKey = this.getPatternErrorKey(controlName);
      if (patternKey) {
        errorMessages.push(patternKey);
      }
    }
    if (errors['min']) {
      const minKey = this.getMinValueErrorKey(controlName);
      if (minKey) {
        errorMessages.push(minKey);
      }
    }
    if (errors['maxlength']) {
      const maxKey = this.getMaxLengthErrorKey(controlName);
      if (maxKey) {
        errorMessages.push(maxKey);
      }
    }
    // Handle email validation
    if (errors['email']) {
      errorMessages.push('ERROR.EMAIL_EMAIL');
    }

    return errorMessages;
  }

  private getRequiredErrorKey(controlName: string): string {
    const fieldKeyMap: { [key: string]: string } = {
      'name': 'ERROR.NAME_REQUIRED',
      'phone': 'ERROR.PHONE_REQUIRED',
      'email': 'ERROR.EMAIL_REQUIRED',
      'cardNumber': 'ERROR.CARD_NUMBER_REQUIRED',
      'username': 'ERROR.USERNAME_REQUIRED',
      'password': 'ERROR.PASSWORD_REQUIRED',
      'workRuleId': 'ERROR.WORK_RULE_REQUIRED',
      'shiftId': 'ERROR.SHIFT_REQUIRED',
      'salaryType': 'ERROR.SALARY_TYPE_REQUIRED',
      'salaryAmount': 'ERROR.SALARY_AMOUNT_REQUIRED',
      'hourlyRate': 'ERROR.HOURLY_RATE_REQUIRED'
    };
    return fieldKeyMap[controlName] || `ERROR.${controlName.toUpperCase()}_REQUIRED`;
  }

  private getMinLengthErrorKey(controlName: string): string | null {
    const fieldKeyMap: { [key: string]: string } = {
      'name': 'ERROR.NAME_MINLENGTH',
      'username': 'ERROR.USERNAME_MINLENGTH',
      'password': 'ERROR.PASSWORD_MINLENGTH',
      'cardNumber': 'ERROR.CARD_NUMBER_MINLENGTH'
    };
    return fieldKeyMap[controlName] || null;
  }

  private getPatternErrorKey(controlName: string): string {
    const fieldKeyMap: { [key: string]: string } = {
      'phone': 'ERROR.PHONE_PATTERN'
    };
    return fieldKeyMap[controlName] || '';
  }

  private getMinValueErrorKey(controlName: string): string | null {
    const fieldKeyMap: { [key: string]: string } = {
      'salaryAmount': 'ERROR.SALARY_AMOUNT_MIN',
      'hourlyRate': 'ERROR.HOURLY_RATE_MIN',
      'overtimeRate': 'ERROR.OVERTIME_RATE_MIN'
    };
    return fieldKeyMap[controlName] || null;
  }

  private getMaxLengthErrorKey(controlName: string): string | null {
    const fieldKeyMap: { [key: string]: string } = {
      'salaryNotes': 'ERROR.SALARY_NOTES_MAXLENGTH'
    };
    return fieldKeyMap[controlName] || null;
  }

  private getDefaultErrorMessage(controlName: string, errorType: string): string {
    // Fallback error messages in case translations fail completely
    const defaultMessages: { [key: string]: { [key: string]: string } } = {
      'name': {
        'required': 'Name is required',
        'minlength': 'Name must be at least 3 characters long',
        'name_required': 'Name is required',
        'name_minlength': 'Name must be at least 3 characters long'
      },
      'phone': {
        'required': 'Phone is required',
        'pattern': 'Invalid phone number format',
        'phone_required': 'Phone is required',
        'phone_pattern': 'Invalid phone number format'
      },
      'email': {
        'required': 'Email is required',
        'email': 'Invalid email format',
        'email_required': 'Email is required',
        'email_email': 'Please enter a valid email address'
      },
      'cardNumber': {
        'required': 'Card Number is required',
        'minlength': 'Card Number must be at least 4 characters long',
        'cardnumber_required': 'Card Number is required',
        'cardnumber_minlength': 'Card Number must be at least 4 characters long'
      },
      'username': {
        'required': 'Username is required',
        'minlength': 'Username must be at least 4 characters long',
        'pattern': 'Username format is invalid',
        'username_required': 'Username is required',
        'username_minlength': 'Username must be at least 4 characters long',
        'username_pattern': 'Username format is invalid'
      },
      'password': {
        'required': 'Password is required',
        'minlength': 'Password must be at least 6 characters long',
        'password_required': 'Password is required',
        'password_minlength': 'Password must be at least 6 characters long'
      },
      'workRuleId': {
        'required': 'Work rule selection is required'
      },
      'shiftId': {
        'required': 'Shift selection is required'
      },
      'salaryType': {
        'required': 'Salary type is required'
      },
      'salaryAmount': {
        'required': 'Salary amount is required',
        'min': 'Salary amount must be zero or greater'
      },
      'hourlyRate': {
        'required': 'Hourly rate is required for this salary type',
        'min': 'Hourly rate must be zero or greater'
      },
      'overtimeRate': {
        'min': 'Overtime rate must be zero or greater'
      },
      'salaryNotes': {
        'maxlength': 'Salary notes cannot exceed 300 characters'
      },
      'employee': {
        'not_found': 'Employee not found',
        'employee_not_found': 'Employee not found. Please check the ID and try again.'
      }
    };

    // Try direct match first (e.g., 'name_required')
    const directKey = `${controlName}_${errorType}`.toLowerCase();
    if (defaultMessages[controlName]?.[directKey]) {
      return defaultMessages[controlName][directKey];
    }

    // Try error type match (e.g., 'required')
    if (defaultMessages[controlName]?.[errorType]) {
      return defaultMessages[controlName][errorType];
    }

    // Try global error type
    if (defaultMessages[controlName]) {
      return defaultMessages[controlName][errorType] || `${controlName} ${errorType}`;
    }

    // Fallback for unknown errors
    return `Invalid ${controlName}`;
  }

  private openLoadingDialog(): void {
    if (this.loadingDialogRef) {
      return;
    }

    const title = this.translate.instant('LOADING.TITLE');
    const message = this.translate.instant('LOADING.REGISTER_EMPLOYEE', {
      defaultValue: 'Registering employee...'
    });

    this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      disableClose: true,
      data: {
        title,
        message,
        isSuccess: true
      }
    });
  }

  private closeLoadingDialog(): void {
    if (this.loadingDialogRef) {
      this.loadingDialogRef.close();
      this.loadingDialogRef = null;
    }
  }

  private showSuccessDialog(): void {
    const title = this.translate.instant('SUCCESS.TITLE');
    const message = this.translate.instant('SUCCESS.REGISTER_EMPLOYEE', {
      defaultValue: 'Employee registered successfully.'
    });

    const dialogRef = this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title,
        message,
        isSuccess: true
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.resetForm();
      this.navigateToEmployeesList();
    });
  }

  private showErrorDialog(message: unknown): void {
    const title = this.translate.instant('ERROR.TITLE');
    const friendlyMessage = this.extractErrorMessage(message);

    this.dialog.open(NotificationDialogComponent, {
      data: {
        title,
        message: friendlyMessage,
        isSuccess: false
      },
      panelClass: ['glass-dialog-panel', 'transparent-backdrop']
    });
  }

  private extractErrorMessage(message: unknown): string {
    if (!message) {
      return this.translate.instant('ERROR.ADD_EMPLOYEE_ERROR');
    }

    if (typeof message === 'string') {
      const trimmed = message.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    if (Array.isArray(message)) {
      const joined = message
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(item => item.length > 0)
        .join(', ');
      if (joined.length > 0) {
        return joined;
      }
    }

    if (typeof message === 'object') {
      const errorObj = message as Record<string, unknown>;
      if (typeof errorObj['message'] === 'string' && errorObj['message']!.trim().length > 0) {
        return errorObj['message'] as string;
      }
      if (Array.isArray(errorObj['errors'])) {
        const extracted = errorObj['errors']
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
          .join(', ');
        if (extracted.length > 0) {
          return extracted;
        }
      }
    }

    return this.translate.instant('ERROR.ADD_EMPLOYEE_ERROR');
  }







  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  /**
   * Check if a specific field has errors and is touched
   */
  hasFieldError(controlName: string): boolean {
    const control = this.employeeForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Get the CSS class for form control based on validation state
   */
  getFieldCssClass(controlName: string): string {
    const control = this.employeeForm.get(controlName);
    if (!control) return '';

    if (control.valid && control.touched) {
      return 'is-valid';
    } else if (control.invalid && control.touched) {
      return 'is-invalid';
    }
    return '';
  }

  /**
   * Debug method to test translations - remove in production
   */
  debugTranslations(): void {
    console.log('Current language:', this.translate.currentLang);
    console.log('Default language:', this.translate.defaultLang);
    console.log('Available languages:', this.translate.langs);
    console.log('Cached error messages:', this.errorMessages);

    // Test a specific translation
    const testKey = 'ERROR.NAME_REQUIRED';
    console.log(`Translation for ${testKey}:`, this.translate.instant(testKey));
  }
}
