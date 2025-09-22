import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

// Extend the FormGroup type to include the submitted property
declare module '@angular/forms' {
  interface FormGroup {
    submitted?: boolean;
  }
}
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faSave, 
  faTimes, 
  faCalendarPlus, 
  faArrowLeft, 
  faUser, 
  faSearch, 
  faClock, 
  faCalendarAlt, 
  faSignInAlt, 
  faSignOutAlt, 
  faInfoCircle, 
  faMapMarkerAlt, 
  faCheckCircle, 
  faList, 
  faExclamationTriangle, 
  faSpinner 
} from '@fortawesome/free-solid-svg-icons';
import { AddAttendanceStore } from '../../../../store/add-attendance.store';
import { CustomDropdownComponent } from '../../../../shared/components/custom-dropdown/custom-dropdown.component';
import { MatDialog } from '@angular/material/dialog';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { AddAttendanceDto } from '../../../../core/interfaces/attendance.interface';
import { EmployeeService } from '../../../../core/employee.service';
import { EmployeeDto } from '../../../../core/interfaces/employee.interface';

@Component({
  selector: 'app-add-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    FontAwesomeModule,
    CustomDropdownComponent
  ],
  providers: [TranslateService],
  
  templateUrl: './add-attendance.component.html',
  styleUrls: ['./add-attendance.component.css']
})
export class AddAttendanceComponent implements OnInit, OnDestroy {
  readonly store = inject(AddAttendanceStore);
  attendanceForm!: FormGroup;
  employeeSearchTerm = new FormControl('', [Validators.required]);
  suggestions: EmployeeDto[] = [];
  selectedEmployeeId: number | null = null;
  selectedEmployeePhone: string | null = null;
  attTypeOptions: { value: number | null; label: string }[] = [];

  // FontAwesome Icons
  faSave = faSave;
  faTimes = faTimes;
  faCalendarPlus = faCalendarPlus;
  faArrowLeft = faArrowLeft;
  faUser = faUser;
  faSearch = faSearch;
  faClock = faClock;
  faCalendarAlt = faCalendarAlt;
  faSignInAlt = faSignInAlt;
  faSignOutAlt = faSignOutAlt;
  faInfoCircle = faInfoCircle;
  faMapMarkerAlt = faMapMarkerAlt;
  faCheckCircle = faCheckCircle;
  faList = faList;
  faExclamationTriangle = faExclamationTriangle;
  faSpinner = faSpinner;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private employeeService = inject(EmployeeService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  private loadingDialogRef: any; // Declare loadingDialogRef

  constructor() {
    effect(() => {
      if (this.store.isSuccess()) {
        this.navigateToAttendanceList();
        this.resetForm();
      }
    });

    effect(() => {
      if (this.store.isLoading()) {
        // Close any existing dialog before opening a new loading dialog
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = undefined;
        }
        this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: this.translate.instant('LOADING.TITLE'),
            message: this.translate.instant('LOADING.ADD_ATTENDANCE'),
            isSuccess: true // Use true for loading state to show spinner if implemented
          },
          disableClose: true // Prevent closing by clicking outside
        });
      } else if (this.loadingDialogRef) {
        // Close loading dialog when isLoading becomes false
        this.loadingDialogRef.close();
        this.loadingDialogRef = undefined;

        if (this.store.isSuccess()) {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            data: {
              title: this.translate.instant('SUCCESS.TITLE'),
              message: this.translate.instant('SUCCESS.ADD_ATTENDANCE'),
              isSuccess: true
            }
          });
          this.store.resetState();
        } else if (this.store.error()) {
          const errorMessage = this.store.error()!;
          const translatedMessage = this.translate.instant(errorMessage);
          
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: translatedMessage !== errorMessage ? translatedMessage : errorMessage,
              isSuccess: false
            }
          });
          this.store.resetState();
        }
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.initializeAttTypeOptions();
    this.store.resetState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeAttTypeOptions(): void {
    this.attTypeOptions = [
      { value: null, label: this.translate.instant('SelectAttType') },
      { value: 0, label: this.translate.instant('Attendance') },
      { value: 1, label: this.translate.instant('Departure') }
    ];
  }

  private initializeForm(): void {
    // Initialize the search term with required validation
    this.employeeSearchTerm = new FormControl('', [Validators.required]);

    this.attendanceForm = this.fb.group({
      phoneNumber: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      timeIn: [null],
      timeOut: [null],
      latitude: [0],
      longitude: [0],
      outLatitude: [0],
      outLongitude: [0],
      locationName: [''],
      time: [new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), Validators.required],
      status: [''],
      attType: [null, Validators.required]
    }, { validators: this.timeInTimeOutValidator });

    this.employeeSearchTerm.valueChanges.pipe(
      debounceTime(2000), // User requested 2 seconds
      distinctUntilChanged(),
      switchMap(term => {
        if (term && term.length >= 2) {
          // Clear employeeNotFound error when a new search starts
          if (this.employeeSearchTerm.hasError('employeeNotFound')) {
            this.employeeSearchTerm.setErrors(null);
          }
          return this.employeeService.getAllEmployees({ name: term });
        } else {
          this.suggestions = []; // Clear suggestions if term is too short or empty
          this.selectedEmployeeId = null; // Reset selected employee if search term changes
          this.selectedEmployeePhone = null; // Reset selected employee phone
          this.attendanceForm.get('phoneNumber')?.setValue(''); // Clear phoneNumber in form
          this.attendanceForm.get('phoneNumber')?.updateValueAndValidity(); // Re-validate phoneNumber
          // If the term is empty, ensure required error is set
          if (!term || term.trim() === '') {
            this.employeeSearchTerm.setErrors({ required: true });
          } else {
            this.employeeSearchTerm.setErrors(null); // Clear other errors if term is too short but not empty
          }
          return of({ data: { employees: [], totalCount: 0 } });
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe(response => {
      this.suggestions = response.data?.employees || [];
      
      // If there's a search term and no suggestions, set employeeNotFound error
      if (this.employeeSearchTerm.value && this.employeeSearchTerm.value.length >= 2 && this.suggestions.length === 0) {
        this.employeeSearchTerm.setErrors({ employeeNotFound: true });
        this.employeeSearchTerm.markAsTouched(); // Mark as touched to display error immediately
      } else if (this.suggestions.length > 0) {
        // If suggestions are found, clear employeeNotFound error
        if (this.employeeSearchTerm.hasError('employeeNotFound')) {
          this.employeeSearchTerm.setErrors(null);
        }
      }
      // Ensure phoneNumber control is updated and validated based on selectedEmployeePhone
      if (this.selectedEmployeePhone) {
        this.attendanceForm.get('phoneNumber')?.setValue(this.selectedEmployeePhone);
        this.attendanceForm.get('phoneNumber')?.setErrors(null);
      } else {
        this.attendanceForm.get('phoneNumber')?.setValue('');
        this.attendanceForm.get('phoneNumber')?.setErrors({ required: true });
      }
      this.attendanceForm.get('phoneNumber')?.updateValueAndValidity();
      this.cdr.detectChanges();
    });

    // Trigger form-level validation when timeIn or timeOut changes
    this.attendanceForm.get('timeIn')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.attendanceForm.updateValueAndValidity();
    });

    this.attendanceForm.get('timeOut')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.attendanceForm.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    // Mark the form as submitted
    this.attendanceForm.submitted = true;
    
    // Mark all controls as touched to trigger validation
    this.markFormGroupTouched();
    
    // If form is invalid, don't submit
    if (this.attendanceForm.invalid) {
      this.cdr.detectChanges();
      return;
    }

    const formValue = this.attendanceForm.value;

    let timeInIso: string | null = null;
    if (formValue.timeIn && formValue.timeIn !== '') {
      timeInIso = `${formValue.date}T${formValue.timeIn}:00.000Z`;
    }

    let timeOutIso: string | null = null;
    if (formValue.timeOut && formValue.timeOut !== '') {
      timeOutIso = `${formValue.date}T${formValue.timeOut}:00.000Z`;
    }

    const newAttendance: AddAttendanceDto = {
      ...formValue,
      phoneNumber: this.selectedEmployeePhone || '', // Use selectedEmployeePhone
      timeIn: timeInIso,
      timeOut: timeOutIso,
    };
    console.log('Payload being sent:', newAttendance);
    this.store.addAttendance(newAttendance);
  }

  onCancel(): void {
    this.navigateToAttendanceList();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.attendanceForm.controls).forEach(key => {
      const control = this.attendanceForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  private navigateToAttendanceList(): void {
    this.router.navigate(['/attendance']);
    this.store.resetState();
  }

  private resetForm(): void {
    this.attendanceForm.reset({
      phoneNumber: '',
      date: new Date().toISOString().split('T')[0],
      timeIn: null,
      timeOut: null,
      latitude: null,
      longitude: null,
      outLatitude: null,
      outLongitude: null,
      locationName: null,
      time: null,
      status: null,
      attType: null
    });
    this.employeeSearchTerm.reset();
    this.suggestions = [];
    this.selectedEmployeeId = null;
    this.selectedEmployeePhone = null;
    this.initializeAttTypeOptions(); // Re-initialize options to reset selected value in custom dropdown
  }

  public selectEmployee(employee: EmployeeDto): void {
    if (employee && employee.id) {
      this.selectedEmployeeId = employee.id;
      this.selectedEmployeePhone = employee.phone;
      this.attendanceForm.patchValue({
        phoneNumber: employee.phone
      });
      // Set the value without emitting an event to prevent re-triggering the search
      this.employeeSearchTerm.setValue(employee.name, { emitEvent: false });
      // Clear all errors and mark as valid
      this.employeeSearchTerm.setErrors(null);
      this.employeeSearchTerm.markAsPristine();
      this.employeeSearchTerm.markAsTouched(); // Keep it touched after selection for consistency
      this.employeeSearchTerm.updateValueAndValidity();
      this.suggestions = [];
      this.cdr.detectChanges();
    } else {
      // Handle case where employee is not found (should ideally not happen here if employee is valid)
      this.employeeSearchTerm.setErrors({ 'employeeNotFound': true });
      this.employeeSearchTerm.markAsTouched();
      this.employeeSearchTerm.updateValueAndValidity();
      this.cdr.detectChanges();
    }
  }

  onAttTypeChange(value: number): void {
    this.attendanceForm.get('attType')?.setValue(value);
    this.attendanceForm.get('attType')?.markAsTouched();
    this.attendanceForm.get('attType')?.updateValueAndValidity();
    this.attendanceForm.updateValueAndValidity(); // Trigger form-level validation
  }

  onEmployeeSearchBlur(): void {
    if (!this.employeeSearchTerm) return;
    
    // Mark the control as touched to trigger validation
    this.employeeSearchTerm.markAsTouched();
    
    // If the field is empty, set required error
    if (!this.employeeSearchTerm.value || this.employeeSearchTerm.value.trim() === '') {
      this.employeeSearchTerm.setErrors({ required: true });
    }
    // If there's a search term but no employee is selected and no suggestions were found
    else if (this.employeeSearchTerm.value && !this.selectedEmployeeId && this.suggestions.length === 0) {
      this.employeeSearchTerm.setErrors({ employeeNotFound: true });
    } else if (this.selectedEmployeeId) {
      // If an employee is selected, clear any errors
      this.employeeSearchTerm.setErrors(null);
    }
    
    // Update the control's validity
    this.employeeSearchTerm.updateValueAndValidity();
    
    // Trigger change detection
    this.cdr.detectChanges();
  }

  getValidationErrors(controlName: string): string[] {
    const errorMessages: string[] = [];

    // Handle employee search field
    if (controlName === 'employeeSearchTerm') {
      const searchControl = this.employeeSearchTerm;

      // If an employee is selected, clear all errors
      if (this.selectedEmployeeId) {
        return [];
      }

      // Only show errors if the control is touched or form is submitted
      if (!searchControl.touched && !this.attendanceForm?.submitted) {
        return [];
      }

      // Handle required validation
      if (searchControl.hasError('required')) {
        const errorKey = 'ERROR.EMPLOYEE_ID_REQUIRED';
        const translatedMessage = this.translate.instant(errorKey);
        errorMessages.push(translatedMessage !== errorKey ? translatedMessage : this.getDefaultErrorMessage('phoneNumber', 'required'));
      }

      // Handle not found validation - only show if we've searched and got no results
      if (searchControl.hasError('employeeNotFound')) {
        const errorKey = 'ERROR.EMPLOYEE_NOT_FOUND';
        const translatedMessage = this.translate.instant(errorKey);
        errorMessages.push(translatedMessage !== errorKey ? translatedMessage : this.getDefaultErrorMessage('phoneNumber', 'employeeNotFound'));
      }

      return errorMessages;
    }

    // Handle other form controls
    const control = this.attendanceForm.get(controlName);
    if (!control || (!control.touched && !this.attendanceForm?.submitted) || !control.errors) {
      return [];
    }

    if (control.hasError('required')) {
      const errorKey = this.getRequiredErrorKey(controlName);
      const translatedMessage = this.translate.instant(errorKey);
      errorMessages.push(translatedMessage !== errorKey ? translatedMessage : this.getDefaultErrorMessage(controlName, 'required'));
    } else if (control.hasError('notAllowed')) {
      const errorKey = this.getNotAllowedErrorKey(controlName);
      const translatedMessage = this.translate.instant(errorKey);
      errorMessages.push(translatedMessage !== errorKey ? translatedMessage : this.getDefaultErrorMessage(controlName, 'notAllowed'));
    }

    return errorMessages;
  }

  private getRequiredErrorKey(controlName: string): string {
    // Map of control names to their corresponding translation keys
    const fieldKeyMap: { [key: string]: string } = {
      'phoneNumber': 'ERROR.EMPLOYEE_ID_REQUIRED',
      'employeeSearchTerm': 'ERROR.EMPLOYEE_ID_REQUIRED',
      'date': 'ERROR.DATE_REQUIRED',
      'time': 'ERROR.TIME_REQUIRED',
      'timeIn': 'ERROR.TIME_IN_REQUIRED_FOR_ATTENDANCE',
      'timeOut': 'ERROR.TIME_OUT_REQUIRED_FOR_DEPARTURE',
      'attType': 'ERROR.ATTTYPE_REQUIRED',
      'status': 'ERROR.STATUS_REQUIRED',
      'notes': 'ERROR.NOTES_REQUIRED'
    };
    
    // Return the specific key if found, otherwise generate a default one
    if (fieldKeyMap[controlName]) {
      return fieldKeyMap[controlName];
    }
    
    // Try to find a matching key in the translation file
    const possibleKey = `ERROR.${controlName.toUpperCase()}_REQUIRED`;
    const translated = this.translate.instant(possibleKey);
    
    // If the key exists in translations, return it, otherwise return a default message
    return translated !== possibleKey ? possibleKey : `ERROR.${controlName.toUpperCase()}_REQUIRED`;
  }

  private getNotAllowedErrorKey(controlName: string): string {
    const fieldKeyMap: { [key: string]: string } = {
      'timeIn': 'ERROR.TIME_IN_NOT_ALLOWED_FOR_DEPARTURE',
      'timeOut': 'ERROR.TIME_OUT_NOT_ALLOWED_FOR_ATTENDANCE'
    };
    
    if (fieldKeyMap[controlName]) {
      return fieldKeyMap[controlName];
    }
    
    const possibleKey = `ERROR.${controlName.toUpperCase()}_NOT_ALLOWED`;
    const translated = this.translate.instant(possibleKey);
    
    return translated !== possibleKey ? possibleKey : `ERROR.${controlName.toUpperCase()}_NOT_ALLOWED`;
  }

  

  private getDefaultErrorMessage(controlName: string, errorType: string): string {
    const defaultMessages: { [key: string]: { [key: string]: string } } = {
      'phoneNumber': {
        'required': 'Employee phone number is required',
        'employeeNotFound': 'Employee not found.'
      },
      'date': {
        'required': 'Date is required'
      },
      'time': {
        'required': 'Time is required'
      },
      'attType': {
        'required': 'Attendance Type is required'
      },
      'timeIn': {
        'required': 'Time In is required for Attendance.',
        'notAllowed': 'Time In is not allowed for Departure.'
      },
      'timeOut': {
        'required': 'Time Out is required for Departure.',
        'notAllowed': 'Time Out is not allowed for Attendance.'
      }
    };

    return defaultMessages[controlName]?.[errorType] || `${controlName} is invalid`;
  }

  private timeInTimeOutValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const attType = control.get('attType');
    const timeIn = control.get('timeIn');
    const timeOut = control.get('timeOut');

    if (!attType || !timeIn || !timeOut) {
      return null; // Return if controls are not yet initialized
    }

    // Clear previous errors to avoid stale validation
    timeIn.setErrors(null);
    timeOut.setErrors(null);

    if (attType.value === 0) { // Attendance
      if (!timeIn.value) {
        timeIn.setErrors({ required: true });
      }
      if (timeOut.value) {
        timeOut.setErrors({ notAllowed: true });
      }
    } else if (attType.value === 1) { // Departure
      if (!timeOut.value) {
        timeOut.setErrors({ required: true });
      }
      if (timeIn.value) {
        timeIn.setErrors({ notAllowed: true });
      }
    }

    return null; // No form-level error
  };

  hasFieldError(controlName: string): boolean {
    const control = this.attendanceForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  getFieldCssClass(controlName: string): string {
    const control = this.attendanceForm.get(controlName);
    if (!control) return '';

    if (control.valid && control.touched) {
      return 'is-valid';
    } else if (control.invalid && control.touched) {
      return 'is-invalid';
    }
    return '';
  }
}
