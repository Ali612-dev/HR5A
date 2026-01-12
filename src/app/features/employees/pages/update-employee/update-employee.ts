
import { Component, OnInit, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EmployeeService } from '../../../../core/employee.service';
import { EmployeeDto } from '../../../../core/interfaces/employee.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSave, faTimes, faArrowLeft, faUserPlus, faPeopleGroup, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import { AddEmployeeStore } from '../../../../store/add-employee.store';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { Subject, catchError, forkJoin, map, of, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/auth.service';
import { UpdateUserCredentialsRequest, UserDetailsDto } from '../../../../core/interfaces/auth.interface';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FinancialService } from '../../../../core/services/financial.service';
import { WorkRuleDto, ShiftDto, SalaryType, AssignedEmployeeDto } from '../../../../core/interfaces/financial.interface';
import { AssignShiftDialogComponent } from '../../../financial/pages/work-rules/assign-shift-dialog.component';

@Component({
  selector: 'app-update-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    FontAwesomeModule,
    ShimmerComponent,
    MatDialogModule
  ],
  templateUrl: './update-employee.html',
  styleUrls: ['../add-employee/add-employee.css']
})
export class UpdateEmployeeComponent implements OnInit, OnDestroy {
  readonly store = inject(AddEmployeeStore);
  employeeForm!: FormGroup;
  employeeId!: string;
  userId: number | null = null;
  private originalEmployee: EmployeeDto | null = null;
  private originalUser: UserDetailsDto | null = null;

  faSave = faSave;
  faTimes = faTimes;
  faArrowLeft = faArrowLeft;
  faUserPlus = faUserPlus;
  faPeopleGroup = faPeopleGroup;
  faDollarSign = faDollarSign;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private employeeService = inject(EmployeeService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private financialService = inject(FinancialService);
  private destroy$ = new Subject<void>();
  private pendingShiftId: number | null = null;

  // Translation cache to avoid repeated lookups
  private errorMessages: { [key: string]: string } = {};
  private isTranslationLoaded = false;
  private loadingDialogRef: MatDialogRef<NotificationDialogComponent> | null = null;

  workRules: WorkRuleDto[] = [];
  shifts: ShiftDto[] = [];
  isWorkRulesLoading = false;
  isShiftsLoading = false;
  SalaryType = SalaryType;
  salaryTypeOptions = [
    { value: SalaryType.PerMonth, labelKey: 'SalaryType_PerMonth' },
    { value: SalaryType.PerDay, labelKey: 'SalaryType_PerDay' },
    { value: SalaryType.PerHour, labelKey: 'SalaryType_PerHour' },
    { value: SalaryType.Custom, labelKey: 'SalaryType_Custom' }
  ];

  constructor() {
    effect(() => {
      if (this.store.isLoading()) {
        this.openLoadingDialog();
      } else {
        this.closeLoadingDialog();
      }

      const error = this.store.error();
      if (error) {
        this.showErrorDialog(error);
        this.store.resetState();
      }

      if (this.store.isSuccess()) {
        const updatedEmployee = this.store.employee() as EmployeeDto | null;
        if (updatedEmployee) {
          this.updateOriginalReferences(updatedEmployee);
        }
        this.showSuccessDialog();
        this.store.resetState();
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadTranslations();
    this.store.resetState();
    this.loadWorkRules();
    this.loadShifts();
    this.setupWorkRuleShiftListener();
    this.setupSalaryTypeListener();
    this.employeeId = this.route.snapshot.paramMap.get('id')!;
    if (this.employeeId) {
      this.employeeService.getEmployeeById(Number(this.employeeId)).subscribe(response => {
        if (response && response.isSuccess && response.data) {
          const employee = response.data;
          this.originalEmployee = employee;
          this.userId = this.extractUserId(employee);

          this.employeeForm.patchValue({
            name: employee.name,
            phone: employee.phone,
            department: employee.department || '',
            email: employee.email || '',
            cardNumber: employee.cardNumber,
            isActive: employee.isActive
          });
          this.prefillFinancialData(employee);

          if (this.userId) {
            console.log('🔗 UpdateEmployee: Loading user credentials for userId:', this.userId);
            this.authService.getUserById(this.userId).subscribe(userResponse => {
              if (userResponse && userResponse.isSuccess && userResponse.data) {
                const user = userResponse.data;
                this.originalUser = user;
                console.log('🔗 UpdateEmployee: User credentials loaded:', user);
                this.employeeForm.patchValue({
                  username: user.username,
                  name: user.fullName || employee.name,
                  email: user.email || employee.email || '',
                  phone: user.phoneNumber || employee.phone
                });
              } else {
                console.warn('⚠️ UpdateEmployee: Failed to load user credentials for userId:', this.userId, userResponse);
              }
            }, error => {
              console.error('❌ UpdateEmployee: Error loading user credentials:', error);
            });
          } else {
            console.warn('⚠️ UpdateEmployee: No userId associated with employee:', employee);
          }
        }
      });
    }
  }
  private extractUserId(employee: any): number | null {
    if (!employee) return null;
    if (typeof employee.userId === 'number') return employee.userId;
    if (typeof employee.userID === 'number') return employee.userID;
    if (employee.user && typeof employee.user.id === 'number') return employee.user.id;
    if (employee.appUserId && typeof employee.appUserId === 'number') return employee.appUserId;
    return null;
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.employeeForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      newPassword: ['', [Validators.minLength(6)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,14}$/)]],
      department: [''],
      email: ['', [Validators.required, Validators.email]],
      cardNumber: ['', Validators.required],
      isActive: [true],
      workRuleId: [null], // Removed required validator
      shiftId: [null], // Removed required validator
      salaryType: [SalaryType.PerMonth], // Removed required validator
      salaryAmount: [null, Validators.min(0)], // Removed required validator, kept min
      hourlyRate: [null],
      overtimeRate: [null, Validators.min(0)],
      salaryNotes: ['', Validators.maxLength(300)]
    });

    this.updateHourlyRateValidators(this.employeeForm.get('salaryType')?.value ?? SalaryType.PerMonth);
  }

  private loadTranslations(): void {
    // Preload all error message translations
    const translationKeys = [
      'ERROR.USERNAME_REQUIRED',
      'ERROR.USERNAME_MINLENGTH',
      'ERROR.PASSWORD_MINLENGTH',
      'ERROR.NAME_REQUIRED',
      'ERROR.PHONE_REQUIRED',
      'ERROR.EMAIL_REQUIRED',
      'ERROR.CARD_NUMBER_REQUIRED',
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

    const formValue = this.employeeForm.value;
    const trimmedEmployee: EmployeeDto = {
      id: Number(this.employeeId),
      name: formValue.name.trim(),
      phone: formValue.phone.trim(),
      department: formValue.department ? formValue.department.trim() : null,
      email: formValue.email ? formValue.email.trim() : null,
      cardNumber: formValue.cardNumber.trim(),
      isActive: formValue.isActive,
      joinedDate: this.originalEmployee?.joinedDate || new Date().toISOString()
    };

    let userUpdate: { userId: number; credentials: UpdateUserCredentialsRequest } | undefined;
    if (this.userId) {
      const trimmedUsername = formValue.username?.trim() ?? '';
      const trimmedPassword = formValue.newPassword?.trim() ?? '';
      const trimmedEmail = trimmedEmployee.email ?? '';
      const storedUsername = this.originalUser?.username?.trim() ?? '';
      const storedEmail = this.originalUser?.email?.trim() ?? '';
      const storedPhone = this.originalUser?.phoneNumber?.trim() ?? '';
      const storedFullName = this.originalUser?.fullName?.trim() ?? (this.originalEmployee?.name ?? '');

      const hasCredentialChanges =
        trimmedUsername !== storedUsername ||
        trimmedEmail !== storedEmail ||
        trimmedEmployee.phone !== storedPhone ||
        trimmedEmployee.name !== storedFullName ||
        trimmedPassword.length > 0;

      if (hasCredentialChanges) {
        const credentials: UpdateUserCredentialsRequest = {
          username: trimmedUsername,
          fullName: trimmedEmployee.name,
          email: trimmedEmail,
          phoneNumber: trimmedEmployee.phone
        };

        if (trimmedPassword.length > 0) {
          credentials.password = trimmedPassword;
        }

        userUpdate = {
          userId: this.userId,
          credentials
        };
      }
    }

    this.store.updateEmployee(trimmedEmployee, userUpdate);
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

  private prefillFinancialData(employee: EmployeeDto): void {
    const workRuleId = employee.workRuleId ?? null;
    const shiftId = this.extractShiftId(employee.shift);

    if (workRuleId !== null) {
      this.pendingShiftId = shiftId;
      this.employeeForm.get('workRuleId')?.setValue(workRuleId, { emitEvent: false });
      this.loadShifts(workRuleId);
    } else {
      this.pendingShiftId = null;
      this.employeeForm.get('workRuleId')?.setValue(null, { emitEvent: false });
      this.employeeForm.get('shiftId')?.setValue(null, { emitEvent: false });
    }

    this.loadEmployeeSalary(employee.id);
  }

  private loadEmployeeSalary(employeeId: number): void {
    this.financialService.getEmployeeSalaryByEmployeeId(employeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            const salary = response.data;
            const salaryTypeValue =
              typeof salary.salaryType === 'number'
                ? salary.salaryType
                : SalaryType[salary.salaryType as keyof typeof SalaryType] ?? SalaryType.PerMonth;

            this.employeeForm.patchValue({
              salaryType: salaryTypeValue,
              salaryAmount: salary.amount ?? null,
              hourlyRate: salary.hourlyRate ?? null,
              overtimeRate: salary.overtimeRate ?? null,
              salaryNotes: salary.notes ?? ''
            });

            this.updateHourlyRateValidators(salaryTypeValue);
          }
        },
        error: (error) => {
          console.error('Error loading employee salary:', error);
        }
      });
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

  private navigateToEmployeesList(): void {
    this.router.navigate(['/employees']);
    this.store.resetState();
    window.history.pushState({}, '', '/employees');
  }

  private resetForm(): void {
    this.employeeForm.reset({
      username: '',
      newPassword: '',
      name: '',
      phone: '',
      department: '',
      email: '',
      cardNumber: '',
      isActive: true
    });
  }

  private updateOriginalReferences(employee: EmployeeDto): void {
    this.originalEmployee = employee;
    this.originalUser = {
      id: this.userId ?? employee.userId ?? 0,
      username: this.employeeForm.get('username')?.value ?? '',
      fullName: employee.name,
      email: employee.email ?? '',
      phoneNumber: employee.phone
    };

    this.employeeForm.patchValue({
      name: employee.name,
      phone: employee.phone,
      department: employee.department || '',
      email: employee.email || '',
      cardNumber: employee.cardNumber,
      isActive: employee.isActive,
      newPassword: ''
    });
  }

  private openLoadingDialog(): void {
    if (this.loadingDialogRef) {
      return;
    }

    const title = this.translate.instant('LOADING.TITLE');
    const message = this.translate.instant('LOADING.UPDATE_EMPLOYEE', { defaultValue: 'Updating employee...' });

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
    const message = this.translate.instant('SUCCESS.UPDATE_EMPLOYEE', { defaultValue: 'Employee updated successfully.' });

    this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title,
        message,
        isSuccess: true
      }
    });
  }

  private showErrorDialog(message: unknown): void {
    const title = this.translate.instant('ERROR.TITLE');
    const friendlyMessage = this.extractErrorMessage(message);

    this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title,
        message: friendlyMessage,
        isSuccess: false
      }
    });
  }

  private extractErrorMessage(message: unknown): string {
    if (!message) {
      return this.translate.instant('ERROR.UPDATE_EMPLOYEE_ERROR');
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

    return this.translate.instant('ERROR.UPDATE_EMPLOYEE_ERROR');
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

    // If translations are not loaded yet, return empty array to avoid showing keys
    if (!this.isTranslationLoaded) {
      return [];
    }

    return this.buildErrorMessages(controlName, control.errors);
  }

  private buildErrorMessages(controlName: string, errors: any): string[] {
    const errorMessages: string[] = [];

    // Handle required validation
    if (errors['required']) {
      const errorKey = this.getRequiredErrorKey(controlName);
      const message = this.errorMessages[errorKey];
      if (message && message !== errorKey) {
        errorMessages.push(message);
      } else {
        // Fallback to instant translation
        const fallbackMessage = this.translate.instant(errorKey);
        errorMessages.push(fallbackMessage !== errorKey ? fallbackMessage : this.getDefaultErrorMessage(controlName, 'required'));
      }
    }

    // Handle minlength validation
    if (errors['minlength']) {
      const errorKey = this.getMinLengthErrorKey(controlName);
      const message = this.errorMessages[errorKey];
      if (message && message !== errorKey) {
        errorMessages.push(message);
      } else {
        const fallbackMessage = this.translate.instant(errorKey);
        errorMessages.push(fallbackMessage !== errorKey ? fallbackMessage : this.getDefaultErrorMessage(controlName, 'minlength'));
      }
    }

    // Handle pattern validation
    if (errors['pattern']) {
      const errorKey = this.getPatternErrorKey(controlName);
      const message = this.errorMessages[errorKey];
      if (message && message !== errorKey) {
        errorMessages.push(message);
      } else {
        const fallbackMessage = this.translate.instant(errorKey);
        errorMessages.push(fallbackMessage !== errorKey ? fallbackMessage : this.getDefaultErrorMessage(controlName, 'pattern'));
      }
    }

    // Handle min validation
    if (errors['min']) {
      const errorKey = this.getMinValueErrorKey(controlName);
      const message = errorKey ? this.errorMessages[errorKey] : null;
      if (message && message !== errorKey) {
        errorMessages.push(message);
      } else if (errorKey) {
        const fallbackMessage = this.translate.instant(errorKey);
        errorMessages.push(fallbackMessage !== errorKey ? fallbackMessage : this.getDefaultErrorMessage(controlName, 'min'));
      }
    }

    // Handle maxlength validation
    if (errors['maxlength']) {
      const errorKey = this.getMaxLengthErrorKey(controlName);
      const message = errorKey ? this.errorMessages[errorKey] : null;
      if (message && message !== errorKey) {
        errorMessages.push(message);
      } else if (errorKey) {
        const fallbackMessage = this.translate.instant(errorKey);
        errorMessages.push(fallbackMessage !== errorKey ? fallbackMessage : this.getDefaultErrorMessage(controlName, 'maxlength'));
      }
    }

    // Handle email validation
    if (errors['email']) {
      const errorKey = 'ERROR.EMAIL_EMAIL';
      const message = this.errorMessages[errorKey];
      if (message && message !== errorKey) {
        errorMessages.push(message);
      } else {
        const fallbackMessage = this.translate.instant(errorKey);
        errorMessages.push(fallbackMessage !== errorKey ? fallbackMessage : 'Invalid email format');
      }
    }

    return errorMessages;
  }

  private getRequiredErrorKey(controlName: string): string {
    const fieldKeyMap: { [key: string]: string } = {
      'username': 'ERROR.USERNAME_REQUIRED',
      'name': 'ERROR.NAME_REQUIRED',
      'phone': 'ERROR.PHONE_REQUIRED',
      'email': 'ERROR.EMAIL_REQUIRED',
      'cardNumber': 'ERROR.CARD_NUMBER_REQUIRED',
      'workRuleId': 'ERROR.WORK_RULE_REQUIRED',
      'shiftId': 'ERROR.SHIFT_REQUIRED',
      'salaryType': 'ERROR.SALARY_TYPE_REQUIRED',
      'salaryAmount': 'ERROR.SALARY_AMOUNT_REQUIRED',
      'hourlyRate': 'ERROR.HOURLY_RATE_REQUIRED'
    };
    return fieldKeyMap[controlName] || `ERROR.${controlName.toUpperCase()}_REQUIRED`;
  }

  private getMinLengthErrorKey(controlName: string): string {
    const fieldKeyMap: { [key: string]: string } = {
      'username': 'ERROR.USERNAME_MINLENGTH',
      'name': 'ERROR.NAME_MINLENGTH',
      'newPassword': 'ERROR.PASSWORD_MINLENGTH'
    };
    return fieldKeyMap[controlName] || `ERROR.${controlName.toUpperCase()}_MINLENGTH`;
  }

  private getPatternErrorKey(controlName: string): string {
    const fieldKeyMap: { [key: string]: string } = {
      'phone': 'ERROR.PHONE_PATTERN'
    };
    return fieldKeyMap[controlName] || `ERROR.${controlName.toUpperCase()}_PATTERN`;
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
      'username': {
        'required': 'Username is required',
        'minlength': 'Username must be at least 4 characters long'
      },
      'name': {
        'required': 'Name is required',
        'minlength': 'Name must be at least 3 characters long'
      },
      'phone': {
        'required': 'Phone is required',
        'pattern': 'Invalid phone number format'
      },
      'email': {
        'required': 'Email is required',
        'email': 'Invalid email format'
      },
      'cardNumber': {
        'required': 'Card Number is required'
      },
      'newPassword': {
        'minlength': 'Password must be at least 6 characters long'
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
      }
    };

    return defaultMessages[controlName]?.[errorType] || `${controlName} is invalid`;
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

  private loadWorkRules(): void {
    this.isWorkRulesLoading = true;
    this.financialService.getWorkRules({ pageNumber: 1, pageSize: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.workRules = Array.isArray(response.data) ? response.data : (response.data as any)?.data ?? [];
          } else {
            this.workRules = [];
          }
        },
        error: (error) => {
          console.error('Error loading work rules:', error);
          this.workRules = [];
        },
        complete: () => {
          this.isWorkRulesLoading = false;
        }
      });
  }

  private loadShifts(workRuleId?: number): void {
    this.isShiftsLoading = true;
    this.financialService.getShifts(workRuleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.shifts = response.data;
            if (this.pendingShiftId !== null && this.shifts.some(shift => shift.id === this.pendingShiftId)) {
              this.employeeForm.get('shiftId')?.setValue(this.pendingShiftId, { emitEvent: false });
              this.pendingShiftId = null;
            }
          } else {
            this.shifts = [];
            this.pendingShiftId = null;
          }
        },
        error: (error) => {
          console.error('Error loading shifts:', error);
          this.shifts = [];
          this.pendingShiftId = null;
        },
        complete: () => {
          this.isShiftsLoading = false;
        }
      });
  }

  private setupWorkRuleShiftListener(): void {
    const workRuleControl = this.employeeForm.get('workRuleId');
    workRuleControl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const numericValue = this.toNumber(value);
        this.pendingShiftId = null;
        this.employeeForm.get('shiftId')?.setValue(null);
        if (numericValue !== null) {
          this.loadShifts(numericValue);
        } else {
          this.loadShifts();
        }
      });
  }

  private setupSalaryTypeListener(): void {
    const salaryTypeControl = this.employeeForm.get('salaryType');
    salaryTypeControl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.updateHourlyRateValidators(value));
  }

  private updateHourlyRateValidators(value: SalaryType): void {
    const hourlyControl = this.employeeForm.get('hourlyRate');
    if (!hourlyControl) {
      return;
    }

    if (this.requiresHourlyRate(value)) {
      hourlyControl.setValidators([Validators.required, Validators.min(0)]);
    } else {
      hourlyControl.clearValidators();
      hourlyControl.setValue(null);
    }
    hourlyControl.updateValueAndValidity({ emitEvent: false });
  }

  requiresHourlyRate(value?: SalaryType): boolean {
    const type = value ?? this.employeeForm.get('salaryType')?.value ?? SalaryType.PerMonth;
    return type === SalaryType.PerHour || type === SalaryType.Custom;
  }

  openAssignShiftDialog(): void {
    const workRuleId = this.toNumber(this.employeeForm.get('workRuleId')?.value);
    const shiftId = this.toNumber(this.employeeForm.get('shiftId')?.value);

    if (!workRuleId || !shiftId) {
      this.showErrorDialog(this.translate.instant('ERROR.SELECT_WORK_RULE_AND_SHIFT'));
      return;
    }

    this.financialService.getWorkRuleDetails(workRuleId).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const targetShift = response.data.shifts?.find(shift => shift.id === shiftId);
          if (!targetShift) {
            this.showErrorDialog(this.translate.instant('ERROR.SHIFT_NOT_FOUND'));
            return;
          }

          const eligibleEmployees = this.getEligibleEmployeesForShift(response.data.assignedEmployees ?? [], targetShift);
          if (!eligibleEmployees.length) {
            this.showErrorDialog(this.translate.instant('ERROR.NO_ELIGIBLE_EMPLOYEES_SHIFT'));
            return;
          }

          const dialogRef = this.dialog.open(AssignShiftDialogComponent, {
            panelClass: 'glass-dialog-panel',
            data: {
              shiftId,
              shiftName: targetShift.name,
              availableEmployees: eligibleEmployees
            }
          });

          dialogRef.afterClosed().subscribe((selectedIds: number[] | null) => {
            if (selectedIds?.length) {
              this.assignEmployeesToShift(shiftId, selectedIds);
            }
          });
        } else {
          this.showErrorDialog(response.message || this.translate.instant('ERROR.FAILED_TO_LOAD_WORK_RULE_DETAILS'));
        }
      },
      error: (error) => {
        console.error('Error loading work rule details:', error);
        this.showErrorDialog(error?.error?.message || this.translate.instant('ERROR.FAILED_TO_LOAD_WORK_RULE_DETAILS'));
      }
    });
  }

  private getEligibleEmployeesForShift(employees: AssignedEmployeeDto[], shift: ShiftDto): AssignedEmployeeDto[] {
    const assignedIds = new Set((shift.employees ?? []).map(employee => employee.employeeId));
    return employees.filter(employee => !assignedIds.has(employee.id));
  }

  private assignEmployeesToShift(shiftId: number, employeeIds: number[]): void {
    const assignments = employeeIds.map(employeeId =>
      this.financialService.assignEmployeeToShift(shiftId, employeeId).pipe(
        map(response => ({ isSuccess: response.isSuccess, message: response.message })),
        catchError(error => {
          console.error('Error assigning employee to shift:', error);
          return of({ isSuccess: false, message: error?.error?.message || error.message || '' });
        })
      )
    );

    forkJoin(assignments).subscribe(results => {
      const failed = results.find(result => !result.isSuccess);
      if (failed) {
        this.showShiftAssignmentMessage(failed.message || this.translate.instant('ERROR.SHIFT_ASSIGNMENT_FAILED'), false);
      } else {
        this.showShiftAssignmentMessage(this.translate.instant('SUCCESS.SHIFT_ASSIGNMENT'), true);
      }
    });
  }

  private showShiftAssignmentMessage(message: string, isSuccess: boolean): void {
    const title = isSuccess ? this.translate.instant('SUCCESS.TITLE') : this.translate.instant('ERROR.TITLE');
    this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: { title, message, isSuccess }
    });
  }

  getWorkRuleLabel(rule: WorkRuleDto): string {
    const typeLabel = this.getWorkRuleTypeText(rule.type);
    return rule.category ? `${rule.category} • ${typeLabel}` : typeLabel;
  }

  private getWorkRuleTypeText(type: WorkRuleDto['type']): string {
    if (typeof type === 'number') {
      switch (type) {
        case 0:
        case 1:
          return this.translate.instant('WorkRuleType.Daily');
        case 2:
          return this.translate.instant('WorkRuleType.Weekly');
        case 3:
          return this.translate.instant('WorkRuleType.Monthly');
        case 4:
          return this.translate.instant('WorkRuleType.Hourly');
        case 5:
          return this.translate.instant('WorkRuleType.Custom');
        case 6:
          return this.translate.instant('WorkRuleType.Shifts');
        default: return this.translate.instant('WorkRuleType.Custom');
      }
    }
    const translated = this.translate.instant(`WorkRuleType.${type}`);
    return translated !== `WorkRuleType.${type}` ? translated : String(type);
  }

  formatShiftLabel(shift: ShiftDto): string {
    const start = shift.startTime?.slice(0, 5) ?? '';
    const end = shift.endTime?.slice(0, 5) ?? '';
    return `${shift.name} • ${start} - ${end}`;
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
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
