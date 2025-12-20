import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';

export interface TimePickerDialogData {
  initialTime?: string; // Format: "HH:mm" or "HH:mm:ss"
  label?: string;
}

@Component({
  selector: 'app-time-picker-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, TranslateModule, FontAwesomeModule],
  template: `
    <div class="time-picker-dialog">
      <div class="picker-header">
        <h3>{{ data.label || ('SelectTime' | translate) }}</h3>
        <button type="button" class="btn-close" (click)="close()">
          <fa-icon [icon]="faClock"></fa-icon>
        </button>
      </div>

      <div class="picker-body">
        <div class="time-display">
          <div class="time-segment hours">
            <button type="button" class="btn-increment" (click)="incrementHours()">
              <fa-icon [icon]="faChevronUp"></fa-icon>
            </button>
            <div class="time-value">{{ formatNumber(hours) }}</div>
            <button type="button" class="btn-decrement" (click)="decrementHours()">
              <fa-icon [icon]="faChevronDown"></fa-icon>
            </button>
          </div>

          <div class="time-separator">:</div>

          <div class="time-segment minutes">
            <button type="button" class="btn-increment" (click)="incrementMinutes()">
              <fa-icon [icon]="faChevronUp"></fa-icon>
            </button>
            <div class="time-value">{{ formatNumber(minutes) }}</div>
            <button type="button" class="btn-decrement" (click)="decrementMinutes()">
              <fa-icon [icon]="faChevronDown"></fa-icon>
            </button>
          </div>
        </div>

        <div class="quick-actions">
          <button type="button" class="quick-btn" (click)="setCurrentTime()">
            {{ 'CurrentTime' | translate }}
          </button>
          <button type="button" class="quick-btn" (click)="setTime(8, 0)">
            08:00
          </button>
          <button type="button" class="quick-btn" (click)="setTime(12, 0)">
            12:00
          </button>
          <button type="button" class="quick-btn" (click)="setTime(17, 0)">
            17:00
          </button>
        </div>
      </div>

      <div class="picker-actions">
        <button type="button" class="btn cancel" (click)="close()">
          {{ 'Cancel' | translate }}
        </button>
        <button type="button" class="btn confirm" (click)="confirm()">
          {{ 'Confirm' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .time-picker-dialog {
      min-width: 320px;
      max-width: 400px;
      padding: 0;
      border-radius: 20px;
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      color: #1f2937;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
      overflow: hidden;
    }

    .picker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid rgba(209, 213, 219, 0.8);
      background: #ffffff;
    }

    .picker-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    }

    .btn-close {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 12px;
      border: none;
      background: transparent;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-close:hover {
      background: #f9fafb;
      color: #1f2937;
      transform: scale(1.05);
    }

    .btn-close fa-icon {
      color: #f97316;
    }

    .picker-body {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      align-items: center;
      padding: 2rem;
      background: #ffffff;
    }

    .time-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 20px;
      border: 1px solid rgba(209, 213, 219, 0.8);
    }

    .time-segment {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      min-width: 80px;
    }

    .time-separator {
      font-size: 2.5rem;
      font-weight: 700;
      color: #6b7280;
      padding: 0 0.5rem;
    }

    .time-value {
      font-size: 3rem;
      font-weight: 700;
      min-width: 80px;
      text-align: center;
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.1));
      padding: 0.75rem 1rem;
      border-radius: 16px;
      border: 1px solid rgba(249, 115, 22, 0.3);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
      color: #f97316;
    }

    .btn-increment,
    .btn-decrement {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 10px;
      border: 1px solid rgba(209, 213, 219, 0.8);
      background: #ffffff;
      color: #1f2937;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-increment:hover,
    .btn-decrement:hover {
      background: rgba(249, 115, 22, 0.1);
      border-color: rgba(249, 115, 22, 0.4);
      color: #f97316;
      transform: scale(1.1);
    }

    .btn-increment:active,
    .btn-decrement:active {
      transform: scale(0.95);
    }

    .btn-increment fa-icon,
    .btn-decrement fa-icon {
      color: inherit;
    }

    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
      width: 100%;
    }

    .quick-btn {
      padding: 0.6rem 1.2rem;
      border-radius: 12px;
      border: 1px solid rgba(209, 213, 219, 0.8);
      background: #ffffff;
      color: #1f2937;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .quick-btn:hover {
      background: rgba(249, 115, 22, 0.1);
      border-color: rgba(249, 115, 22, 0.4);
      color: #f97316;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
    }

    .picker-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem 2rem;
      background: #ffffff;
      border-top: 1px solid rgba(209, 213, 219, 0.8);
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 130px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    }

    .btn.cancel {
      background: #ffffff;
      color: #1f2937;
      border: 1px solid rgba(209, 213, 219, 0.8);
    }

    .btn.cancel:hover {
      background: #f9fafb;
      border-color: rgba(156, 163, 175, 0.8);
      color: #1f2937;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .btn.confirm {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.2));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(249, 115, 22, 0.4);
      color: #f97316;
      position: relative;
      overflow: hidden;
    }

    .btn.confirm::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transition: left 0.5s ease;
    }

    .btn.confirm:hover {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(234, 88, 12, 0.3));
      border-color: rgba(249, 115, 22, 0.6);
      color: #ea580c;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
    }

    .btn.confirm:hover::before {
      left: 100%;
    }
  `]
})
export class TimePickerDialogComponent {
  faClock = faClock;
  faChevronUp = faChevronUp;
  faChevronDown = faChevronDown;

  hours: number = 0;
  minutes: number = 0;

  constructor(
    private dialogRef: MatDialogRef<TimePickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TimePickerDialogData
  ) {
    this.initializeTime();
  }

  private initializeTime(): void {
    if (this.data.initialTime) {
      const timeParts = this.data.initialTime.split(':');
      this.hours = parseInt(timeParts[0]) || 0;
      this.minutes = parseInt(timeParts[1]) || 0;
    } else {
      const now = new Date();
      this.hours = now.getHours();
      this.minutes = now.getMinutes();
    }
  }

  formatNumber(value: number): string {
    return value.toString().padStart(2, '0');
  }

  incrementHours(): void {
    this.hours = (this.hours + 1) % 24;
  }

  decrementHours(): void {
    this.hours = (this.hours - 1 + 24) % 24;
  }

  incrementMinutes(): void {
    this.minutes = (this.minutes + 1) % 60;
  }

  decrementMinutes(): void {
    this.minutes = (this.minutes - 1 + 60) % 60;
  }

  setTime(hours: number, minutes: number): void {
    this.hours = hours;
    this.minutes = minutes;
  }

  setCurrentTime(): void {
    const now = new Date();
    this.hours = now.getHours();
    this.minutes = now.getMinutes();
  }

  confirm(): void {
    const timeString = `${this.formatNumber(this.hours)}:${this.formatNumber(this.minutes)}:00`;
    this.dialogRef.close(timeString);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}

