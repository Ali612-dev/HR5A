import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { AssignedEmployeeDto } from '../../../../core/interfaces/financial.interface';

interface AssignShiftDialogData {
  shiftId: number;
  shiftName: string;
  availableEmployees: AssignedEmployeeDto[];
}

@Component({
  selector: 'app-assign-shift-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, TranslateModule],
  template: `
    <div class="assign-shift-dialog">
      <div class="dialog-header">
        <div class="header-text">
          <h3 class="mb-1">{{ 'AssignEmployeesToShift' | translate }}</h3>
          <p class="text-muted mb-0">
            {{ 'AssignShiftSubtitle' | translate:{ shift: data.shiftName } }}
          </p>
        </div>
        <button type="button" class="btn-close" (click)="close()">
          {{ 'Cancel' | translate }}
        </button>
      </div>

      <div class="selection-summary" *ngIf="data.availableEmployees.length">
        <span>{{ 'Selected' | translate }}: {{ selectedEmployees.size }}</span>
        <span class="divider"></span>
        <span>{{ 'Employees' | translate }}: {{ data.availableEmployees.length }}</span>
      </div>

      <div class="dialog-body" *ngIf="data.availableEmployees.length; else emptyState">
        <div class="employee-list">
          <label class="employee-item"
                 *ngFor="let employee of data.availableEmployees"
                 [class.selected]="selectedEmployees.has(employee.id)">
            <input type="checkbox"
                   class="employee-checkbox"
                   [value]="employee.id"
                   (change)="toggle(employee.id, $event)"
                   [checked]="selectedEmployees.has(employee.id)">
            <div class="employee-details">
              <div class="name-row">
                <span class="name">{{ employee.name }}</span>
                <span class="status-pill" [class.inactive]="employee.isActive === false">
                  {{ employee.isActive === false ? ('Inactive' | translate) : ('Active' | translate) }}
                </span>
              </div>
              <div class="meta">
                <span>{{ employee.phone || '—' }}</span>
                <span class="dot">•</span>
                <span>{{ employee.department || ('NotAvailable' | translate) }}</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="empty-state text-center py-4" style="padding: 2rem;">
          <p class="mb-1" style="color: #1f2937;">{{ 'NoEligibleEmployeesForShift' | translate }}</p>
          <small style="color: #6b7280;">
            {{ 'AssignShiftRequiresEmployees' | translate }}
          </small>
        </div>
      </ng-template>

      <div class="dialog-actions">
        <button type="button"
                class="btn btn-secondary"
                (click)="close()">
          {{ 'Cancel' | translate }}
        </button>
        <button type="button"
                class="btn btn-primary"
                (click)="confirm()"
                [disabled]="!selectedEmployees.size">
          {{ 'Assign' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .assign-shift-dialog {
      min-width: 520px;
      max-width: 680px;
      padding: 0;
      border-radius: 20px;
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      color: #1f2937;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
      overflow: hidden;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid rgba(209, 213, 219, 0.8);
      background: #ffffff;
    }

    .header-text h3 {
      font-size: 1.35rem;
      font-weight: 700;
      margin: 0;
      color: #1f2937;
    }

    .header-text p {
      margin: 0;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .btn-close {
      border: none;
      background: transparent;
      color: #6b7280;
      font-weight: 600;
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .btn-close:hover {
      background: #f9fafb;
      color: #1f2937;
    }

    .selection-summary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      padding: 1rem 2rem;
      border-radius: 0;
      background: #f9fafb;
      font-size: 0.9rem;
      color: #1f2937;
      border-bottom: 1px solid rgba(209, 213, 219, 0.8);
    }

    .selection-summary .divider {
      width: 1px;
      height: 16px;
      background: rgba(209, 213, 219, 0.8);
    }

    .dialog-body {
      max-height: 360px;
      overflow-y: auto;
      margin: 0;
      padding: 1.5rem 2rem;
      background: #ffffff;
    }

    .employee-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .employee-item {
      display: flex;
      gap: 0.85rem;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      align-items: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .employee-item:hover {
      border-color: rgba(249, 115, 22, 0.4);
      background: #f9fafb;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .employee-item.selected {
      border-color: rgba(249, 115, 22, 0.6);
      background: rgba(249, 115, 22, 0.05);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
      transform: translateY(-1px);
    }

    .employee-checkbox {
      accent-color: #f97316;
      width: 20px;
      height: 20px;
      margin: 0;
      cursor: pointer;
      border: 2px solid #d1d5db;
      border-radius: 4px;
    }

    .employee-checkbox:checked {
      background-color: #f97316;
      border-color: #f97316;
    }

    .employee-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .name-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .name {
      font-weight: 600;
      color: #1f2937;
    }

    .status-pill {
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.7rem;
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .status-pill.inactive {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .meta {
      font-size: 0.85rem;
      color: #6b7280;
      display: flex;
      gap: 0.25rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .meta .dot {
      font-size: 0.6rem;
      opacity: 0.6;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin: 0;
      padding: 1.5rem 2rem;
      background: #ffffff;
      border-top: 1px solid rgba(209, 213, 219, 0.8);
    }

    .btn {
      min-width: 130px;
      border-radius: 10px;
      padding: 0.75rem 1.5rem;
      border: none;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .btn-secondary {
      background: #ffffff;
      color: #1f2937;
      border: 1px solid rgba(209, 213, 219, 0.8);
    }

    .btn-secondary:hover {
      background: #f9fafb;
      border-color: rgba(156, 163, 175, 0.8);
    }

    .btn-primary {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.2));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(249, 115, 22, 0.4);
      color: #f97316;
      position: relative;
      overflow: hidden;
    }

    .btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transition: left 0.5s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(234, 88, 12, 0.3));
      border-color: rgba(249, 115, 22, 0.6);
      color: #ea580c;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
    }

    .btn-primary:hover:not(:disabled)::before {
      left: 100%;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class AssignShiftDialogComponent {
  selectedEmployees = new Set<number>();

  constructor(
    private dialogRef: MatDialogRef<AssignShiftDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignShiftDialogData
  ) {}

  toggle(employeeId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    checked ? this.selectedEmployees.add(employeeId) : this.selectedEmployees.delete(employeeId);
  }

  close(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    if (this.selectedEmployees.size === 0) {
      return;
    }
    this.dialogRef.close(Array.from(this.selectedEmployees));
  }
}

