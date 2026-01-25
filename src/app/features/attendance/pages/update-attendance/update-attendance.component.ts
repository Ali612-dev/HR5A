import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSave, faTimes, faArrowLeft, faEdit, faSpinner, faUser, faSearch, faClock, faCalendarAlt, faSignInAlt, faSignOutAlt, faInfoCircle, faMapMarkerAlt, faCheckCircle, faList, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { UpdateAttendanceStore } from '../../../../store/update-attendance.store';
import { MatDialog } from '@angular/material/dialog';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { ErrorDialogComponent } from '../../../../shared/components/error-dialog/error-dialog.component';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { AddAttendanceDto, AttendanceViewModel, UpdateAttendanceDto } from '../../../../core/interfaces/attendance.interface';
import { ApiResponse } from '../../../../core/interfaces/dashboard.interface';
import { AttendanceService } from '../../../../core/attendance.service';
import { EmployeeService } from '../../../../core/employee.service';
import { EmployeeDto } from '../../../../core/interfaces/employee.interface';
import { AttendanceDataService } from '../../../../core/attendance-data.service';

@Component({
  selector: 'app-update-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    FontAwesomeModule,
  ],
  providers: [],

  templateUrl: './update-attendance.component.html',
  styleUrls: ['./update-attendance.component.css']
})
export class UpdateAttendanceComponent implements OnInit, OnDestroy {
  readonly store = inject(UpdateAttendanceStore);
  private translate = inject(TranslateService);
  attendanceForm!: FormGroup;
  employeeSearchTerm = new FormControl('', [Validators.required]);
  suggestions: EmployeeDto[] = [];
  selectedEmployeeId: number | null = null;
  selectedEmployeePhone: string | null = null;

  // FontAwesome Icons
  faSave = faSave;
  faTimes = faTimes;
  faArrowLeft = faArrowLeft;
  faEdit = faEdit;
  faSpinner = faSpinner;
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

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private employeeService = inject(EmployeeService);
  private attendanceService = inject(AttendanceService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  private loadingDialogRef: any; // Declare loadingDialogRef
  private attendanceId: number | null = null; // To store the ID of the attendance being updated
  private attendanceDataService = inject(AttendanceDataService);

  constructor() {

    effect(() => {
      if (this.store.isLoading()) {
        // Close any existing dialog before opening a new loading dialog
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = undefined;
        }
        this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
          panelClass: 'glass-dialog-panel',
          data: {
            title: this.translate.instant('LOADING.TITLE'),
            message: this.attendanceId ? this.translate.instant('LOADING.UPDATE_ATTENDANCE') : this.translate.instant('LOADING.ADD_ATTENDANCE'),
            isSuccess: true,
            isLoading: true
          },
          disableClose: true // Prevent closing by clicking outside
        });
      } else if (this.loadingDialogRef && !this.store.isLoading()) {
        // Close loading dialog when isLoading becomes false
        this.loadingDialogRef.close();
        this.loadingDialogRef = undefined;

        if (this.store.isSuccess()) {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: 'glass-dialog-panel',
            data: {
              title: this.translate.instant('SUCCESS.TITLE'),
              message: this.attendanceId ? this.translate.instant('SUCCESS.UPDATE_ATTENDANCE') : this.translate.instant('SUCCESS.ADD_ATTENDANCE'),
              isSuccess: true
            }
          }).afterClosed().subscribe(() => {
            this.store.resetState();
            this.router.navigate(['/attendance']);
          });
        } else if (this.store.error()) {
          this.dialog.open(ErrorDialogComponent, {
            panelClass: 'glass-dialog-panel',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: this.translate.instant(this.store.error()!)
            }
          });
          this.store.resetState();
        }
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.store.resetState();

    const attendanceData = this.attendanceDataService.getAttendanceData();
    if (attendanceData) {
      this.populateForm(attendanceData);
    } else {
      this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
        const attendanceId = params['id'];
        if (attendanceId) {
          this.attendanceId = Number(attendanceId);
          // Fetch attendance data by ID and populate the form
          this.attendanceService.getAttendanceById(this.attendanceId).pipe(takeUntil(this.destroy$)).subscribe((response: ApiResponse<AttendanceViewModel>) => {
            if (response.isSuccess && response.data) {
              this.populateForm(response.data);
            } else {
              // Handle error if attendance data not found
              console.error('Attendance data not found:', response.message);
            }
          });
        }
      });
    }
  }

  private populateForm(attendance: AttendanceViewModel): void {
    // Fetch employee to get phone number for validation
    this.employeeService.getEmployeeById(attendance.employeeId).pipe(takeUntil(this.destroy$)).subscribe(response => {
      if (response.isSuccess && response.data) {
        this.selectedEmployeePhone = response.data.phone;
        this.attendanceForm.patchValue({
          phoneNumber: response.data.phone
        });
        this.cdr.detectChanges();
      }
    });

    this.attendanceForm.patchValue({
      date: attendance.date ? attendance.date.split('T')[0] : null,
      timeIn: attendance.timeIn ? new Date(attendance.timeIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
      timeOut: attendance.timeOut ? new Date(attendance.timeOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
      latitude: attendance.latitude,
      longitude: attendance.longitude,
      outLatitude: attendance.outLatitude,
      outLongitude: attendance.outLongitude,
      locationName: attendance.locationName,
      status: attendance.status,
    });
    this.attendanceId = attendance.id;
    this.selectedEmployeeId = attendance.employeeId;
    this.employeeSearchTerm.setValue(attendance.employeeName, { emitEvent: false });
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  private initializeForm(): void {
    // Initialize the search term with required validation
    this.employeeSearchTerm = new FormControl('', [Validators.required]);

    this.attendanceForm = this.fb.group({
      phoneNumber: ['', Validators.required],
      date: [{ value: new Date().toISOString().split('T')[0], disabled: true }, Validators.required],
      timeIn: [{ value: null, disabled: false }], // Initialize as enabled
      timeOut: [{ value: null, disabled: false }], // Initialize as enabled
      latitude: [0],
      longitude: [0],
      outLatitude: [0],
      outLongitude: [0],
      locationName: ['', Validators.maxLength(500)],
      status: [''],
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
    // this.attendanceForm.submitted = true; // This property does not exist on FormGroup

    // Mark all controls as touched to trigger validation
    this.markFormGroupTouched();

    // If form is invalid, don't submit
    if (this.attendanceForm.invalid) {
      console.error('Form is invalid:', this.attendanceForm.errors);
      Object.keys(this.attendanceForm.controls).forEach(key => {
        const control = this.attendanceForm.get(key);
        if (control?.invalid) {
          console.error(`Control ${key} is invalid:`, JSON.stringify(control.errors));
        }
      });
      this.cdr.detectChanges();
      return;
    }

    const formValue = this.attendanceForm.getRawValue();

    let timeInIso: string | null = null;
    if (formValue.timeIn && formValue.timeIn !== '') {
      timeInIso = `${formValue.date}T${formValue.timeIn}:00.000Z`;
    }

    let timeOutIso: string | null = null;
    if (formValue.timeOut && formValue.timeOut !== '') {
      timeOutIso = `${formValue.date}T${formValue.timeOut}:00.000Z`;
    }

    const updatedAttendance: UpdateAttendanceDto = {
      id: Number(this.attendanceId!),
      employeeId: this.selectedEmployeeId ? Number(this.selectedEmployeeId) : null,
      date: formValue.date,
      timeIn: timeInIso,
      timeOut: timeOutIso,
      locationName: formValue.locationName,
      status: formValue.status,
      attType: timeOutIso ? 2 : 1,
      type: timeOutIso ? 2 : 1
    };
    console.log('Payload being sent (Update):', JSON.stringify(updatedAttendance, null, 2));
    this.store.updateAttendance(updatedAttendance);
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
      employeeId: null,
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
    });
    this.employeeSearchTerm.reset();
    this.suggestions = [];
    this.selectedEmployeeId = null;
  }

  public selectEmployee(employee: EmployeeDto): void {
    if (employee && employee.id) {
      this.selectedEmployeeId = employee.id;
      this.selectedEmployeePhone = employee.phone;
      this.attendanceForm.patchValue({
        phoneNumber: employee.phone
      });
      // Set the value without emitting an event to prevent re-triggering the search
      const formattedName = `${employee.name} (${employee.phone})`;
      this.employeeSearchTerm.setValue(formattedName, { emitEvent: false });
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
        errorMessages.push(this.translate.instant('ERROR.EMPLOYEE_ID_REQUIRED'));
      }

      // Handle not found validation - only show if we've searched and got no results
      if (searchControl.hasError('employeeNotFound')) {
        errorMessages.push(this.translate.instant('ERROR.EMPLOYEE_NOT_FOUND'));
      }

      return errorMessages;
    }

    // Handle other form controls
    const control = this.attendanceForm.get(controlName);
    if (!control || (!control.touched && !this.attendanceForm?.submitted) || !control.errors) {
      return [];
    }

    if (control.hasError('required')) {
      errorMessages.push(this.translate.instant(this.getRequiredErrorKey(controlName)));
    } else if (control.hasError('notAllowed')) {
      errorMessages.push(this.translate.instant(this.getNotAllowedErrorKey(controlName)));
    } else if (control.hasError('invalidSequence')) {
      errorMessages.push(this.translate.instant('ERROR.INVALID_TIME_SEQUENCE'));
    } else if (control.hasError('maxlength')) {
      errorMessages.push(this.translate.instant('ERROR.MAX_LENGTH_EXCEEDED', { length: 500 }));
    }

    return errorMessages;
  }

  private getRequiredErrorKey(controlName: string): string {
    // Map of control names to their corresponding translation keys
    const fieldKeyMap: { [key: string]: string } = {
      'employeeId': 'ERROR.EMPLOYEE_ID_REQUIRED',
      'employeeSearchTerm': 'ERROR.EMPLOYEE_ID_REQUIRED',
      'date': 'ERROR.DATE_REQUIRED',
      'time': 'ERROR.TIME_REQUIRED',
      'status': 'ERROR.STATUS_REQUIRED',
      'notes': 'ERROR.NOTES_REQUIRED',
      'phoneNumber': 'ERROR.PHONE_REQUIRED'
    };

    return fieldKeyMap[controlName] || `ERROR.${controlName.toUpperCase()}_REQUIRED`;
  }

  private getNotAllowedErrorKey(controlName: string): string {
    const fieldKeyMap: { [key: string]: string } = {
      'timeIn': 'ERROR.TIME_IN_NOT_ALLOWED_FOR_DEPARTURE',
      'timeOut': 'ERROR.TIME_OUT_NOT_ALLOWED_FOR_ATTENDANCE'
    };

    return fieldKeyMap[controlName] || `ERROR.${controlName.toUpperCase()}_NOT_ALLOWED`;
  }




  private timeInTimeOutValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const timeIn = control.get('timeIn');
    const timeOut = control.get('timeOut');

    if (!timeIn || !timeOut) {
      return null; // Return if controls are not yet initialized
    }

    // If both exist, timeOut must be later than timeIn
    if (timeIn.value && timeOut.value) {
      if (timeOut.value <= timeIn.value) {
        timeOut.setErrors({ invalidSequence: true });
      }
    }

    return null;
  };

  hasFieldError(controlName: string): boolean {
    const control = this.attendanceForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  public getFieldCssClass(controlName: string): string {
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