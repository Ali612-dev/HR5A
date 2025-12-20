import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ShiftDto } from '../../../../core/interfaces/financial.interface';

export interface AssignExistingShiftDialogData {
  shifts: ShiftDto[];
  workRuleId: number;
}

@Component({
  selector: 'app-assign-existing-shift-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    TranslateModule,
    FontAwesomeModule
  ],
  template: `
    <div class="assign-existing-shift-dialog">
      <div class="dialog-header">
        <h3 class="dialog-title">
          <fa-icon [icon]="faClock" class="me-2"></fa-icon>
          {{ 'AssignExistingShift' | translate }}
        </h3>
        <button type="button" class="btn-close" (click)="onCancel()">
          <fa-icon [icon]="faTimes"></fa-icon>
        </button>
      </div>

      <div class="dialog-body">
        <p class="dialog-subtitle mb-3">{{ 'SelectShiftToAssign' | translate }}</p>
        
        <div class="shifts-list" *ngIf="data.shifts.length > 0; else noShifts">
          <div 
            class="shift-item" 
            *ngFor="let shift of data.shifts"
            [class.selected]="selectedShiftId === shift.id"
            (click)="selectShift(shift.id)">
            <div class="shift-info">
              <div class="shift-name">{{ shift.name }}</div>
              <div class="shift-time">
                <fa-icon [icon]="faClock" class="me-1"></fa-icon>
                {{ formatShiftRange(shift.startTime, shift.endTime) }}
              </div>
            </div>
            <div class="shift-check" *ngIf="selectedShiftId === shift.id">
              <fa-icon [icon]="faCheck"></fa-icon>
            </div>
          </div>
        </div>

        <ng-template #noShifts>
          <div class="empty-state text-center py-4">
            <p class="empty-text">{{ 'NoAvailableShiftsToAssign' | translate }}</p>
          </div>
        </ng-template>
      </div>

      <div class="dialog-footer">
        <button type="button" class="btn btn-secondary" (click)="onCancel()">
          {{ 'Cancel' | translate }}
        </button>
        <button 
          type="button" 
          class="btn btn-primary" 
          [disabled]="!selectedShiftId"
          (click)="onConfirm()">
          {{ 'Assign' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .assign-existing-shift-dialog {
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 20px;
      color: #1f2937;
      min-width: 500px;
      max-width: 600px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
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

    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      display: flex;
      align-items: center;
    }

    .dialog-title fa-icon {
      color: #f97316;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .btn-close:hover {
      background: #f9fafb;
      color: #1f2937;
    }

    .btn-close fa-icon {
      color: #f97316;
    }

    .dialog-body {
      padding: 1.5rem 2rem;
      flex: 1;
      overflow-y: auto;
      max-height: calc(80vh - 140px);
      background: #ffffff;
    }

    .dialog-subtitle {
      color: #6b7280;
      font-size: 0.95rem;
    }

    .shifts-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .shift-item {
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 12px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .shift-item:hover {
      background: #f9fafb;
      border-color: rgba(249, 115, 22, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
    }

    .shift-item.selected {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.1));
      border-color: rgba(249, 115, 22, 0.6);
    }

    .shift-info {
      flex: 1;
    }

    .shift-name {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #1f2937;
    }

    .shift-time {
      font-size: 0.85rem;
      color: #6b7280;
      display: flex;
      align-items: center;
    }

    .shift-time fa-icon {
      color: #f97316;
    }

    .shift-check {
      color: #f97316;
      font-size: 1.25rem;
    }

    .empty-state {
      padding: 2rem;
    }

    .empty-text {
      color: #6b7280;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem 2rem;
      border-top: 1px solid rgba(209, 213, 219, 0.8);
      background: #ffffff;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
      min-width: 130px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    }

    .btn-secondary {
      background: #ffffff;
      color: #1f2937;
      border: 1px solid rgba(209, 213, 219, 0.8);
    }

    .btn-secondary:hover {
      background: #f9fafb;
      border-color: rgba(156, 163, 175, 0.8);
      color: #1f2937;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
export class AssignExistingShiftDialogComponent implements OnInit {
  faClock = faClock;
  faCheck = faCheck;
  faTimes = faTimes;
  
  selectedShiftId: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<AssignExistingShiftDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignExistingShiftDialogData,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {}

  selectShift(shiftId: number): void {
    this.selectedShiftId = shiftId;
  }

  formatShiftRange(startTime: string | null | undefined, endTime: string | null | undefined): string {
    if (!startTime || !endTime) {
      return this.translate.instant('NotAvailable');
    }
    return `${startTime} - ${endTime}`;
  }

  onConfirm(): void {
    if (this.selectedShiftId) {
      this.dialogRef.close(this.selectedShiftId);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

