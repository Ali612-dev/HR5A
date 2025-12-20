import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { TimePickerDialogComponent } from '../../../../shared/components/time-picker-dialog/time-picker-dialog.component';

interface CreateShiftDialogData {
  workRuleName?: string;
  workRuleOptions?: { id: number; category: string }[];
}

@Component({
  selector: 'app-create-shift-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, TranslateModule, FontAwesomeModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="create-shift-dialog">
      <div class="dialog-header">
        <div class="header-text">
          <p class="eyebrow">{{ 'CreateShift' | translate }}</p>
          <h2>{{ 'CreateShiftForRule' | translate:{ name: data.workRuleName || '' } }}</h2>
          <p class="subtitle">{{ 'CreateShiftSubtitle' | translate }}</p>
        </div>
        <button type="button" class="btn-close" (click)="close()">{{ 'Cancel' | translate }}</button>
      </div>

      <div class="dialog-body">
        <div class="form-field">
          <label>{{ 'ShiftName' | translate }}</label>
          <input type="text" formControlName="name" [placeholder]="'ShiftNamePlaceholder' | translate" />
          <small class="error" *ngIf="form.get('name')?.invalid && form.get('name')?.touched">
            {{ 'ShiftNameRequired' | translate }}
          </small>
        </div>

        <div class="form-field">
          <label>{{ 'WorkRules' | translate }}</label>
          <div class="work-rules-list" [class.invalid]="form.get('workRuleIds')?.invalid && form.get('workRuleIds')?.touched">
            <ng-container *ngIf="workRuleOptions.length; else noWorkRules">
              <label class="work-rule-chip"
                     *ngFor="let option of workRuleOptions"
                     [class.selected]="isWorkRuleSelected(option.id)">
                <input type="checkbox"
                       [checked]="isWorkRuleSelected(option.id)"
                       (change)="toggleWorkRule(option.id, $event)">
                <span>{{ option.category }}</span>
              </label>
            </ng-container>
          </div>
          <small class="field-hint">{{ 'WorkRuleForShiftMulti' | translate }}</small>
          <small class="error" *ngIf="form.get('workRuleIds')?.invalid && form.get('workRuleIds')?.touched">
            {{ 'SelectAtLeastOneWorkRule' | translate }}
          </small>
          <ng-template #noWorkRules>
            <div class="empty-state">{{ 'NoWorkRulesAvailable' | translate }}</div>
          </ng-template>
        </div>

        <div class="time-grid">
          <div class="form-field">
            <label>{{ 'ShiftStartTime' | translate }}</label>
            <div class="input-wrapper">
              <input type="time" formControlName="startTime" readonly (click)="openTimePicker('startTime')">
              <button type="button" class="clock-btn" (click)="openTimePicker('startTime')">
                <fa-icon [icon]="faClock"></fa-icon>
              </button>
            </div>
            <small class="error" *ngIf="form.get('startTime')?.invalid && form.get('startTime')?.touched">
              {{ 'ShiftStartRequired' | translate }}
            </small>
          </div>

          <div class="form-field">
            <label>{{ 'ShiftEndTime' | translate }}</label>
            <div class="input-wrapper">
              <input type="time" formControlName="endTime" readonly (click)="openTimePicker('endTime')">
              <button type="button" class="clock-btn" (click)="openTimePicker('endTime')">
                <fa-icon [icon]="faClock"></fa-icon>
              </button>
            </div>
            <small class="error" *ngIf="form.get('endTime')?.invalid && form.get('endTime')?.touched">
              {{ 'ShiftEndRequired' | translate }}
            </small>
          </div>
        </div>

        <div class="toggle-row">
          <div class="toggle-field">
            <label>{{ 'IsThereBreak' | translate }}</label>
            <label class="switch">
              <input type="checkbox" formControlName="isThereBreak">
              <span class="slider"></span>
            </label>
          </div>
          <div class="toggle-field" *ngIf="form.get('isThereBreak')?.value">
            <label>{{ 'IsBreakFixed' | translate }}</label>
            <label class="switch">
              <input type="checkbox" formControlName="isBreakFixed">
              <span class="slider"></span>
            </label>
          </div>
          <div class="toggle-field">
            <label>{{ 'Overnight' | translate }}</label>
            <label class="switch">
              <input type="checkbox" formControlName="isOvernight">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="time-grid" *ngIf="form.get('isThereBreak')?.value && form.get('isBreakFixed')?.value">
          <div class="form-field">
            <label>{{ 'BreakStartTime' | translate }}</label>
            <div class="input-wrapper">
              <input type="time" formControlName="breakStartTime" readonly (click)="openTimePicker('breakStartTime')">
              <button type="button" class="clock-btn" (click)="openTimePicker('breakStartTime')">
                <fa-icon [icon]="faClock"></fa-icon>
              </button>
            </div>
            <small class="error" *ngIf="form.get('breakStartTime')?.invalid && form.get('breakStartTime')?.touched">
              {{ 'ThisFieldIsRequired' | translate }}
            </small>
          </div>
          <div class="form-field">
            <label>{{ 'BreakEndTime' | translate }}</label>
            <div class="input-wrapper">
              <input type="time" formControlName="breakEndTime" readonly (click)="openTimePicker('breakEndTime')">
              <button type="button" class="clock-btn" (click)="openTimePicker('breakEndTime')">
                <fa-icon [icon]="faClock"></fa-icon>
              </button>
            </div>
            <small class="error" *ngIf="form.get('breakEndTime')?.invalid && form.get('breakEndTime')?.touched">
              {{ 'ThisFieldIsRequired' | translate }}
            </small>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button type="button" class="btn ghost" (click)="close()">
          {{ 'Cancel' | translate }}
        </button>
        <button type="submit" class="btn primary" [disabled]="form.invalid">
          {{ 'CreateShift' | translate }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .create-shift-dialog {
      min-width: 900px;
      max-width: 1200px;
      width: 90vw;
      max-height: 90vh;
      padding: 0;
      border-radius: 20px;
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      color: #1f2937;
      display: flex;
      flex-direction: column;
      gap: 0;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid rgba(209, 213, 219, 0.8);
      background: #ffffff;
    }

    .header-text h2 {
      margin: 0.1rem 0;
      font-size: 1.6rem;
      font-weight: 700;
      color: #1f2937;
    }

    .header-text .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 0.75rem;
      color: #6b7280;
      margin: 0;
    }

    .header-text .subtitle {
      margin: 0;
      color: #6b7280;
    }

    .btn-close {
      border: none;
      background: transparent;
      color: #6b7280;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 0.5rem;
      border-radius: 8px;
    }

    .btn-close:hover {
      background: #f9fafb;
      color: #1f2937;
    }

    .dialog-body {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 2rem;
      flex: 1;
      min-height: 0;
      background: #ffffff;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .dialog-body::-webkit-scrollbar {
      width: 0px;
      background: transparent;
    }

    .dialog-body::-webkit-scrollbar-track {
      background: transparent;
    }

    .dialog-body::-webkit-scrollbar-thumb {
      background: transparent;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-field label {
      font-weight: 600;
      color: #1f2937;
    }

    .form-field input[type="text"],
    .form-field input[type="time"],
    .form-field input[type="number"] {
      width: 100%;
      padding: 0.85rem 1rem;
      padding-right: 3.5rem;
      border-radius: 14px;
      border: 1px solid rgba(209, 213, 219, 0.8);
      background: #ffffff;
      color: #1f2937;
    }

    .input-wrapper input[type="time"] {
      padding-right: 3.5rem;
    }

    .form-field input:focus {
      outline: none;
      border-color: #f97316;
      box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.2), 0 4px 15px rgba(249, 115, 22, 0.15);
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .clock-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      right: 0.75rem;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 8px;
      padding: 0.4rem;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #f97316;
    }

    .clock-btn:hover {
      background: rgba(249, 115, 22, 0.1);
      border-color: rgba(249, 115, 22, 0.4);
      transform: translateY(-50%) scale(1.05);
    }

    .clock-btn:active {
      transform: translateY(-50%) scale(0.95);
    }

    .input-wrapper input[type="time"]:read-only {
      cursor: pointer;
    }

    .time-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .work-rules-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 12px;
      background: #f9fafb;
      border: 1px solid rgba(209, 213, 219, 0.8);
    }

    .work-rules-list.invalid {
      border-color: rgba(239, 68, 68, 0.7);
    }

    .work-rule-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.85rem;
      border-radius: 999px;
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.9rem;
      color: #1f2937;
    }

    .work-rule-chip.selected {
      border-color: rgba(249, 115, 22, 0.6);
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.15));
      box-shadow: 0 6px 18px rgba(249, 115, 22, 0.25);
      color: #f97316;
    }

    .work-rule-chip input {
      display: none;
    }

    .toggle-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: space-between;
    }

    .toggle-field {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 26px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.3);
      transition: .3s;
      border-radius: 34px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }

    .switch input:checked + .slider {
      background: linear-gradient(135deg, #f97316, #ea580c);
    }

    .switch input:checked + .slider:before {
      transform: translateX(22px);
    }

    .error {
      color: #ef4444;
      font-size: 0.8rem;
    }

    .empty-state {
      padding: 0.75rem 0;
      color: #6b7280;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem 2rem;
      border-top: 1px solid rgba(209, 213, 219, 0.8);
      background: #ffffff;
    }

    .btn {
      border: none;
      border-radius: 10px;
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 130px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    }

    .btn.primary {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.2));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(249, 115, 22, 0.4);
      color: #f97316;
      position: relative;
      overflow: hidden;
    }

    .btn.primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transition: left 0.5s ease;
    }

    .btn.primary:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(234, 88, 12, 0.3));
      border-color: rgba(249, 115, 22, 0.6);
      color: #ea580c;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
    }

    .btn.primary:hover:not(:disabled)::before {
      left: 100%;
    }

    .btn.primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .btn.ghost {
      background: #ffffff;
      color: #1f2937;
      border: 1px solid rgba(209, 213, 219, 0.8);
    }

    .btn.ghost:hover {
      background: #f9fafb;
      border-color: rgba(156, 163, 175, 0.8);
      color: #1f2937;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    @media (max-width: 1024px) {
      .create-shift-dialog {
        min-width: 95vw;
        max-width: 95vw;
        width: 95vw;
      }
    }
  `]
})
export class CreateShiftDialogComponent {
  faClock = faClock;
  form: FormGroup;
  workRuleOptions: { id: number; category: string }[] = [];
  private selectedWorkRules = new Set<number>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateShiftDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: CreateShiftDialogData
  ) {
    this.workRuleOptions = data.workRuleOptions ?? [];
    this.form = this.fb.group({
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

    const defaultSelection = this.workRuleOptions.length ? [this.workRuleOptions[0].id] : [];
    if (defaultSelection.length) {
      this.setWorkRuleSelection(defaultSelection);
    }

    this.form.get('isThereBreak')?.valueChanges.subscribe(() => this.updateBreakValidators());
    this.form.get('isBreakFixed')?.valueChanges.subscribe(() => this.updateBreakValidators());
  }

  close(): void {
    this.dialogRef.close(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const formValue = this.form.value;
    const payload = {
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

    this.dialogRef.close(payload);
  }

  isWorkRuleSelected(id: number): boolean {
    return this.selectedWorkRules.has(id);
  }

  toggleWorkRule(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedWorkRules.add(id);
    } else {
      this.selectedWorkRules.delete(id);
    }
    this.form.get('workRuleIds')?.setValue(Array.from(this.selectedWorkRules));
    this.form.get('workRuleIds')?.updateValueAndValidity();
  }

  private setWorkRuleSelection(ids: number[]): void {
    this.selectedWorkRules = new Set(ids);
    this.form.get('workRuleIds')?.setValue(ids);
  }

  private atLeastOneWorkRuleValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    return Array.isArray(value) && value.length > 0 ? null : { required: true };
  }

  private updateBreakValidators(): void {
    const isThereBreak = this.form.get('isThereBreak')?.value;
    const isBreakFixed = this.form.get('isBreakFixed')?.value;
    const breakStart = this.form.get('breakStartTime');
    const breakEnd = this.form.get('breakEndTime');

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

  private toApiTime(time: string): string {
    if (!time) {
      return '';
    }
    return time.length === 8 ? time : `${time}:00`;
  }

  openTimePicker(fieldName: 'startTime' | 'endTime' | 'breakStartTime' | 'breakEndTime'): void {
    const currentValue = this.form.get(fieldName)?.value || '';
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
        this.form.get(fieldName)?.setValue(timeValue);
        this.form.get(fieldName)?.markAsTouched();
      }
    });
  }
}

