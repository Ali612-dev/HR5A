import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faArrowLeft, faPlus, faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { FinancialService } from '../../../../core/services/financial.service';
import { ShiftDto, CreateShiftDto, UpdateShiftDto } from '../../../../core/interfaces/financial.interface';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { TimePickerComponent } from '../../../../shared/components/time-picker/time-picker.component';

@Component({
  selector: 'app-shifts',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, FontAwesomeModule, ReactiveFormsModule, TimePickerComponent],
  templateUrl: './shifts.component.html',
  styleUrls: ['./shifts.component.css']
})
export class ShiftsComponent implements OnInit {
  private financialService = inject(FinancialService);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  faClock = faClock;
  faArrowLeft = faArrowLeft;
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;

  isLoading = true;
  error: string | null = null;
  shifts: ShiftDto[] = [];

  // Time picker state
  showTimePicker = false;
  timePickerField: string | null = null;
  timePickerValue: string = '';
  timePickerLabel: string = '';

  // create form state
  showCreate = false;
  isSubmittingCreate = false;
  // edit form state
  showEdit = false;
  isSubmittingEdit = false;
  editingShiftId: number | null = null;
  editForm: FormGroup = this.fb.group({});
  workRuleOptions: { id: number; category: string }[] = [];
  
  // Custom validator to ensure at least one work rule is selected
  private atLeastOneValidatorFunction = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || !Array.isArray(value) || value.length === 0) {
      return { atLeastOne: true };
    }
    return null;
  }
  
  createForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    workRuleIds: [[], [this.atLeastOneValidatorFunction]],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    isOvernight: [false],
    isThereBreak: [false],
    isBreakFixed: [false],
    breakStartTime: [''],
    breakEndTime: ['']
  });

  ngOnInit(): void {
    this.loadShifts();
    this.loadWorkRules();
    
    // Watch for isBreakFixed changes to add/remove validators for break times
    this.createForm.get('isThereBreak')?.valueChanges.subscribe(isThereBreak => {
      this.updateBreakTimeValidators();
    });
    
    this.createForm.get('isBreakFixed')?.valueChanges.subscribe(isBreakFixed => {
      this.updateBreakTimeValidators();
    });
  }

  private updateBreakTimeValidators(): void {
    const isThereBreak = this.createForm.get('isThereBreak')?.value;
    const isBreakFixed = this.createForm.get('isBreakFixed')?.value;
    const breakStartTimeControl = this.createForm.get('breakStartTime');
    const breakEndTimeControl = this.createForm.get('breakEndTime');
    
    if (isThereBreak && isBreakFixed) {
      // Add required validators when break is fixed
      breakStartTimeControl?.setValidators([Validators.required]);
      breakEndTimeControl?.setValidators([Validators.required]);
    } else {
      // Remove validators when break is not fixed or not there
      breakStartTimeControl?.clearValidators();
      breakEndTimeControl?.clearValidators();
    }
    
    breakStartTimeControl?.updateValueAndValidity();
    breakEndTimeControl?.updateValueAndValidity();
  }

  loadShifts(): void {
    this.isLoading = true;
    this.error = null;
    this.financialService.getShifts().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res) {
          const translated = this.translate.instant('ERROR.FAILED_TO_LOAD_SHIFTS');
          this.error = translated !== 'ERROR.FAILED_TO_LOAD_SHIFTS' ? translated : 'Failed to load shifts';
          console.error('Failed to load shifts - No response received');
          return;
        }
        
        if (res.isSuccess && res.data) {
          this.shifts = res.data || [];
          this.error = null;
        } else {
          // Show API message if available, otherwise translated message
          const apiMsg = res?.message;
          if (apiMsg && apiMsg.trim()) {
            this.error = apiMsg;
          } else {
            this.translate.get('ERROR.FAILED_TO_LOAD_SHIFTS').subscribe((msg: string) => {
              this.error = msg !== 'ERROR.FAILED_TO_LOAD_SHIFTS' ? msg : 'Failed to load shifts';
            });
          }
          console.error('Failed to load shifts - Response:', res);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load shifts - API error:', err);
        
        // Try to get error message from response
        let errorMsg = err?.error?.message || err?.error || err?.message;
        
        // If no message, try translation (use get instead of instant for async)
        if (!errorMsg || errorMsg.trim() === '') {
          this.translate.get('ERROR.FAILED_TO_LOAD_SHIFTS').subscribe((msg: string) => {
            this.error = msg !== 'ERROR.FAILED_TO_LOAD_SHIFTS' ? msg : 'Failed to load shifts. Please check your connection.';
          });
        } else {
          this.error = errorMsg;
        }
      }
    });
  }

  loadWorkRules(): void {
    // reuse getWorkRules if available
    try {
      this.financialService.getWorkRules({ pageNumber: 1, pageSize: 100 }).subscribe({
        next: (res: any) => {
          if (res?.isSuccess && res?.data) {
            this.workRuleOptions = res.data.map((w: any) => ({ id: w.id, category: w.category }));
          }
        },
        error: () => {}
      });
    } catch (_) {}
  }

  toggleCreate(): void {
    this.showCreate = !this.showCreate;
    if (this.showCreate) {
      this.createForm.reset({ 
        name: '',
        workRuleIds: [], 
        startTime: '',
        endTime: '',
        isOvernight: false,
        isThereBreak: false,
        isBreakFixed: false,
        breakStartTime: '',
        breakEndTime: ''
      });
      // Reset validation states
      this.createForm.markAsUntouched();
      this.createForm.markAsPristine();
    }
  }

  submitCreate(): void {
    // Prevent double submission
    if (this.isSubmittingCreate) {
      return;
    }

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      
      // Show validation error message
      const missingFields: string[] = [];
      if (this.createForm.get('name')?.invalid) {
        missingFields.push(this.translate.instant('ShiftName'));
      }
      if (this.createForm.get('workRuleIds')?.invalid) {
        missingFields.push(this.translate.instant('WorkRules'));
      }
      if (this.createForm.get('startTime')?.invalid) {
        missingFields.push(this.translate.instant('Start'));
      }
      if (this.createForm.get('endTime')?.invalid) {
        missingFields.push(this.translate.instant('End'));
      }
      // Validate break times only if isThereBreak and isBreakFixed are both true
      if (this.createForm.get('isThereBreak')?.value && this.createForm.get('isBreakFixed')?.value) {
        // Mark break times as required when isBreakFixed is true
        const breakStartTimeControl = this.createForm.get('breakStartTime');
        const breakEndTimeControl = this.createForm.get('breakEndTime');
        
        if (!breakStartTimeControl?.value || breakStartTimeControl.value.trim() === '') {
          missingFields.push(this.translate.instant('BreakStartTime'));
        }
        if (!breakEndTimeControl?.value || breakEndTimeControl.value.trim() === '') {
          missingFields.push(this.translate.instant('BreakEndTime'));
        }
      }
      
      const errorMessage = missingFields.length > 0 
        ? this.translate.instant('PleaseFillAllRequiredFields') + ': ' + missingFields.join(', ')
        : this.translate.instant('PleaseFillAllRequiredFields');
      
      this.showErrorDialog(errorMessage);
      return;
    }
    
    this.isSubmittingCreate = true;
    
    const formValue = this.createForm.value;
    
    // Convert time format from "HH:mm" to "HH:mm:ss" for API
    const formatTimeForAPI = (time: string): string => {
      if (!time) return '';
      // If already in HH:mm:ss format, return as is
      if (time.length === 8) return time;
      // Convert HH:mm to HH:mm:ss
      return time + ':00';
    };
    
    const payload: CreateShiftDto = {
      name: formValue.name,
      workRuleIds: formValue.workRuleIds || [], // Array of WorkRule IDs
      startTime: formatTimeForAPI(formValue.startTime),
      endTime: formatTimeForAPI(formValue.endTime),
      isOvernight: formValue.isOvernight || false,
      isThereBreak: formValue.isThereBreak || false,
      isBreakFixed: formValue.isBreakFixed || false
    };
    
    // Add break times only if isThereBreak is true AND isBreakFixed is true
    if (formValue.isThereBreak && formValue.isBreakFixed) {
      payload.breakStartTime = formValue.breakStartTime ? formatTimeForAPI(formValue.breakStartTime) : undefined;
      payload.breakEndTime = formValue.breakEndTime ? formatTimeForAPI(formValue.breakEndTime) : undefined;
    }

    // Validate at least one work rule is selected
    if (!payload.workRuleIds || payload.workRuleIds.length === 0) {
      this.isSubmittingCreate = false;
      this.showErrorDialog('SelectAtLeastOneWorkRule');
      return;
    }

    this.financialService.createShift(payload).subscribe({
      next: (res) => {
        this.isSubmittingCreate = false;
        if (res.isSuccess && res.data) {
          this.showCreate = false;
          this.showSuccessDialog('SUCCESS.SHIFT_CREATED');
          this.loadShifts();
        } else {
          const errorMsg = res.message || 'CreationFailed';
          this.showErrorDialog(errorMsg);
        }
      },
      error: (err) => {
        this.isSubmittingCreate = false;
        console.error('Create shift error', err);
        const errorMsg = err?.error?.message || 'CreationFailed';
        this.showErrorDialog(errorMsg);
      }
    });
  }

  formatTime(time: string): string {
    return time ? time.substring(0, 5) : '';
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

  // Multi-select helpers for work rules
  isWorkRuleSelected(workRuleId: number): boolean {
    const selected = this.createForm.get('workRuleIds')?.value || [];
    return Array.isArray(selected) && selected.includes(workRuleId);
  }

  onWorkRuleToggle(workRuleId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const currentValue = this.createForm.get('workRuleIds')?.value || [];
    let newValue: number[];
    
    if (checkbox.checked) {
      newValue = [...currentValue, workRuleId];
    } else {
      newValue = currentValue.filter((id: number) => id !== workRuleId);
    }
    
    this.createForm.patchValue({ workRuleIds: newValue });
    this.createForm.get('workRuleIds')?.markAsTouched();
  }

  // Edit form helpers
  isWorkRuleSelectedInEdit(workRuleId: number): boolean {
    const selected = this.editForm.get('workRuleIds')?.value || [];
    return Array.isArray(selected) && selected.includes(workRuleId);
  }

  onWorkRuleToggleEdit(workRuleId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const currentValue = this.editForm.get('workRuleIds')?.value || [];
    let newValue: number[];
    
    if (checkbox.checked) {
      newValue = [...currentValue, workRuleId];
    } else {
      newValue = currentValue.filter((id: number) => id !== workRuleId);
    }
    
    this.editForm.patchValue({ workRuleIds: newValue });
    this.editForm.get('workRuleIds')?.markAsTouched();
  }

  // Convert time from API format "HH:mm:ss" to HTML input format "HH:mm"
  formatTimeForInput(time: string): string {
    if (!time) return '';
    // If in HH:mm:ss format, return HH:mm
    if (time.length >= 5) return time.substring(0, 5);
    return time;
  }

  // Initialize edit form
  showEditForm(shift: ShiftDto): void {
    this.editingShiftId = shift.id;
    this.showEdit = true;
    this.showCreate = false;
    
    // Get selected work rule IDs from shift
    const selectedWorkRuleIds = shift.workRules?.map(wr => wr.workRule.id) || [];
    
    // Convert time format from "HH:mm:ss" or "HH:mm" to "HH:mm" for HTML input
    const formatTime = (time: string): string => {
      if (!time) return '';
      return time.length >= 5 ? time.substring(0, 5) : time;
    };

    this.editForm = this.fb.group({
      name: [shift.name || '', [Validators.required, Validators.maxLength(100)]],
      workRuleIds: [selectedWorkRuleIds, [this.atLeastOneValidatorFunction]],
      startTime: [formatTime(shift.startTime), Validators.required],
      endTime: [formatTime(shift.endTime), Validators.required],
      isOvernight: [shift.isOvernight || false],
      isThereBreak: [shift.isThereBreak || false],
      isBreakFixed: [shift.isBreakFixed || false],
      breakStartTime: [shift.breakStartTime ? formatTime(shift.breakStartTime) : ''],
      breakEndTime: [shift.breakEndTime ? formatTime(shift.breakEndTime) : '']
    });
  }

  cancelEdit(): void {
    this.showEdit = false;
    this.editingShiftId = null;
    this.editForm = this.fb.group({});
  }

  submitUpdate(): void {
    // Prevent double submission
    if (this.isSubmittingEdit) {
      return;
    }

    if (this.editForm.invalid || !this.editingShiftId) {
      this.editForm.markAllAsTouched();
      return;
    }
    
    this.isSubmittingEdit = true;
    
    const formValue = this.editForm.value;
    
    // Convert time format from "HH:mm" to "HH:mm:ss" for API
    const formatTimeForAPI = (time: string): string => {
      if (!time) return '';
      if (time.length === 8) return time;
      return time + ':00';
    };
    
    const payload: UpdateShiftDto = {
      name: formValue.name,
      workRuleIds: formValue.workRuleIds || [],
      startTime: formatTimeForAPI(formValue.startTime),
      endTime: formatTimeForAPI(formValue.endTime),
      isOvernight: formValue.isOvernight || false,
      isThereBreak: formValue.isThereBreak || false,
      isBreakFixed: formValue.isBreakFixed || false
    };
    
    // Add break times only if isThereBreak is true AND isBreakFixed is true
    if (formValue.isThereBreak && formValue.isBreakFixed) {
      payload.breakStartTime = formValue.breakStartTime ? formatTimeForAPI(formValue.breakStartTime) : undefined;
      payload.breakEndTime = formValue.breakEndTime ? formatTimeForAPI(formValue.breakEndTime) : undefined;
    }

    // Validate at least one work rule is selected
    if (!payload.workRuleIds || payload.workRuleIds.length === 0) {
      this.isSubmittingEdit = false;
      this.showErrorDialog('SelectAtLeastOneWorkRule');
      return;
    }

    this.financialService.updateShift(this.editingShiftId, payload).subscribe({
      next: (res) => {
        this.isSubmittingEdit = false;
        if (res.isSuccess && res.data) {
          this.showEdit = false;
          this.editingShiftId = null;
          this.showSuccessDialog('SUCCESS.SHIFT_UPDATED');
          this.loadShifts();
        } else {
          const errorMsg = res.message || 'UpdateFailed';
          this.showErrorDialog(errorMsg);
        }
      },
      error: (err) => {
        this.isSubmittingEdit = false;
        console.error('Update shift error', err);
        const errorMsg = err?.error?.message || 'UpdateFailed';
        this.showErrorDialog(errorMsg);
      }
    });
  }

  // Time picker methods
  openTimePicker(fieldName: string, currentValue?: string): void {
    this.timePickerField = fieldName;
    this.timePickerValue = currentValue || '';
    
    // Set localized label based on field name
    const labelMap: { [key: string]: string } = {
      'startTime': 'Start',
      'endTime': 'End',
      'breakStartTime': 'BreakStartTime',
      'breakEndTime': 'BreakEndTime'
    };
    
    this.timePickerLabel = labelMap[fieldName] || 'SelectTime';
    this.showTimePicker = true;
  }

  onTimeSelected(time: string): void {
    if (this.timePickerField) {
      const form = this.showEdit ? this.editForm : this.createForm;
      if (form) {
        form.patchValue({ [this.timePickerField]: time });
      }
    }
    // Don't close the dialog here - it should only close when user clicks Confirm/Cancel
    // The dialog will be closed by the closeTimePicker() method when user clicks Confirm/Cancel
  }

  closeTimePicker(): void {
    this.showTimePicker = false;
    this.timePickerField = null;
    this.timePickerLabel = '';
  }

  getTimeValue(fieldName: string): string {
    const form = this.showEdit ? this.editForm : this.createForm;
    return form?.get(fieldName)?.value || '';
  }

  deleteShift(shift: ShiftDto): void {
    const confirmMessage = this.translate.instant('CONFIRM_DELETE_SHIFT', { name: shift.name });
    const confirmTitle = this.translate.instant('ConfirmDeletion');
    
    // Use browser confirm for now (can be replaced with custom dialog)
    if (confirm(confirmMessage)) {
      this.financialService.deleteShift(shift.id).subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.showSuccessDialog('SUCCESS.SHIFT_DELETED');
            this.loadShifts();
          } else {
            const errorMsg = res.message || 'DeletionFailed';
            this.showErrorDialog(errorMsg);
          }
        },
        error: (err) => {
          console.error('Delete shift error', err);
          const errorMsg = err?.error?.message || 'DeletionFailed';
          this.showErrorDialog(errorMsg);
        }
      });
    }
  }
}
