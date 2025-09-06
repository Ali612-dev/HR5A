import { Component, OnInit, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EmployeeService } from '../../../../core/employee.service';
import { CreateEmployeeDto } from '../../../../core/interfaces/employee.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { AddEmployeeStore } from '../../../../store/add-employee.store';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    FontAwesomeModule,
    ShimmerComponent
  ],
  templateUrl: './add-employee.html',
  styleUrls: ['./add-employee.css']
})
export class AddEmployeeComponent implements OnInit, OnDestroy {
  readonly store = inject(AddEmployeeStore);
  employeeForm!: FormGroup;

  faSave = faSave;
  faTimes = faTimes;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private destroy$ = new Subject<void>();

  // Translation cache to avoid repeated lookups
  private errorMessages: { [key: string]: string } = {};
  private isTranslationLoaded = false;

  constructor() {
    effect(() => {
      if (this.store.isSuccess()) {
        this.navigateToEmployeesList();
        this.resetForm();
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
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,14}$/)]],
      department: [''],
      email: ['', [Validators.required, Validators.email]],
      cardNumber: ['', Validators.required],
      isActive: [true]
    });
  }

  private loadTranslations(): void {
    // Preload all error message translations
    const translationKeys = [
      'ERROR.NAME_REQUIRED',
      'ERROR.PHONE_REQUIRED',
      'ERROR.EMAIL_REQUIRED',
      'ERROR.CARD_NUMBER_REQUIRED',
      'ERROR.NAME_MINLENGTH',
      'ERROR.PHONE_PATTERN',
      'ERROR.EMAIL_EMAIL'
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

    const newEmployee: CreateEmployeeDto = this.employeeForm.value;
    this.store.addEmployee(newEmployee);
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
  }

  private resetForm(): void {
    this.employeeForm.reset({
      name: '',
      phone: '',
      department: '',
      email: '',
      cardNumber: '',
      isActive: true
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
    else if (errors['minlength']) {
      errorMessages.push(this.getMinLengthErrorKey(controlName));
    }
    // Handle pattern validation
    else if (errors['pattern']) {
      errorMessages.push(this.getPatternErrorKey(controlName));
    }
    // Handle email validation
    else if (errors['email']) {
      errorMessages.push('ERROR.EMAIL_EMAIL');
    }

    return errorMessages;
  }

  private getRequiredErrorKey(controlName: string): string {
    const fieldKeyMap: { [key: string]: string } = {
      'name': 'ERROR.NAME_REQUIRED',
      'phone': 'ERROR.PHONE_REQUIRED',
      'email': 'ERROR.EMAIL_REQUIRED',
      'cardNumber': 'ERROR.CARD_NUMBER_REQUIRED'
    };
    return fieldKeyMap[controlName] || `ERROR.${controlName.toUpperCase()}_REQUIRED`;
  }

  private getMinLengthErrorKey(controlName: string): string {
    return 'ERROR.NAME_MINLENGTH'; // Only used for name field
  }

  private getPatternErrorKey(controlName: string): string {
    return 'ERROR.PHONE_PATTERN'; // Only used for phone field
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
        'cardnumber_required': 'Card Number is required'
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
