import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="toggle-switch-container">
      <div class="custom-toggle-wrapper">
        <div class="custom-toggle">
          <input 
            type="checkbox" 
            [id]="id" 
            [checked]="checked" 
            [disabled]="disabled"
            (change)="onChange($event)"
            class="toggle-input">
          <label [for]="id" class="toggle-label">
            <span class="toggle-slider"></span>
            <span class="toggle-text" *ngIf="showLabel">
              {{ (checked ? (labelChecked || 'Yes') : (labelUnchecked || 'No')) | translate }}
            </span>
          </label>
        </div>
        <small class="toggle-description" *ngIf="description">
          {{ description | translate }}
        </small>
      </div>
    </div>
  `,
  styles: [`
    .toggle-switch-container {
      width: 100%;
    }

    .custom-toggle-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .custom-toggle {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .toggle-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
      gap: 0.75rem;
    }

    .toggle-slider {
      position: relative;
      width: 52px;
      height: 28px;
      background: #d1d5db;
      border-radius: 28px;
      transition: all 0.3s ease;
      border: 2px solid #9ca3af;
      flex-shrink: 0;
    }

    .toggle-slider::before {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #ffffff;
      top: 2px;
      left: 2px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .toggle-input:checked + .toggle-label .toggle-slider {
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-color: #ea580c;
    }

    .toggle-input:checked + .toggle-label .toggle-slider::before {
      transform: translateX(24px);
      background: white;
    }

    .toggle-input:disabled + .toggle-label {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .toggle-input:disabled + .toggle-label .toggle-slider {
      background: #e5e7eb;
      border-color: #d1d5db;
    }

    .toggle-text {
      color: #1f2937 !important;
      font-weight: 500;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .toggle-input:checked + .toggle-label .toggle-text {
      color: #f97316 !important;
      font-weight: 600;
    }

    .toggle-description {
      color: #6b7280 !important;
      font-size: 0.8rem;
      font-style: italic;
      margin-top: 0.25rem;
      transition: all 0.3s ease;
      margin-left: 0;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleSwitchComponent),
      multi: true
    }
  ]
})
export class ToggleSwitchComponent implements ControlValueAccessor {
  @Input() id: string = `toggle-${Math.random().toString(36).substr(2, 9)}`;
  @Input() checked: boolean = false;
  @Input() disabled: boolean = false;
  @Input() showLabel: boolean = true;
  @Input() labelChecked: string = 'Yes';
  @Input() labelUnchecked: string = 'No';
  @Input() description: string = '';

  @Output() checkedChange = new EventEmitter<boolean>();

  private onChangeCallback = (value: boolean) => {};
  private onTouchedCallback = () => {};

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.onChangeCallback(this.checked);
    this.checkedChange.emit(this.checked);
  }

  // ControlValueAccessor implementation
  writeValue(value: boolean): void {
    this.checked = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

