import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faTimes, faUsers, faBriefcase } from '@fortawesome/free-solid-svg-icons';
import { ShiftDto } from '../../../../core/interfaces/financial.interface';

@Component({
  selector: 'app-view-shift-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, TranslateModule, FontAwesomeModule],
  template: `
    <div class="view-shift-dialog">
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-icon-wrapper">
            <div class="header-icon">
              <fa-icon [icon]="faClock"></fa-icon>
            </div>
          </div>
          <div class="header-text">
            <h3 class="dialog-title">{{ 'ShiftDetails' | translate }}</h3>
            <p class="dialog-subtitle">{{ data.name }}</p>
          </div>
        </div>
        <button type="button" class="btn-close" (click)="close()">
          <fa-icon [icon]="faTimes"></fa-icon>
        </button>
      </div>

      <div class="dialog-body">
        <!-- Basic Information -->
        <div class="info-section">
          <h4 class="section-title">
            <fa-icon [icon]="faClock" class="me-2"></fa-icon>
            {{ 'BasicInformation' | translate }}
          </h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">{{ 'ShiftName' | translate }}</span>
              <span class="info-value">{{ data.name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ 'Start' | translate }}</span>
              <span class="info-value">{{ formatTime(data.startTime) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ 'End' | translate }}</span>
              <span class="info-value">{{ formatTime(data.endTime) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ 'Overnight' | translate }}</span>
              <span class="info-value">
                <span class="badge" [class.badge-yes]="data.isOvernight" [class.badge-no]="!data.isOvernight">
                  {{ data.isOvernight ? ('Yes' | translate) : ('No' | translate) }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Break Information -->
        <div class="info-section" *ngIf="data.isThereBreak">
          <h4 class="section-title">
            <fa-icon [icon]="faClock" class="me-2"></fa-icon>
            {{ 'BreakInformation' | translate }}
          </h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">{{ 'IsThereBreak' | translate }}</span>
              <span class="info-value">
                <span class="badge badge-yes">{{ 'Yes' | translate }}</span>
              </span>
            </div>
            <div class="info-item" *ngIf="data.isBreakFixed">
              <span class="info-label">{{ 'IsBreakFixed' | translate }}</span>
              <span class="info-value">
                <span class="badge badge-yes">{{ 'Fixed' | translate }}</span>
              </span>
            </div>
            <div class="info-item" *ngIf="data.breakStartTime && data.breakEndTime">
              <span class="info-label">{{ 'BreakTime' | translate }}</span>
              <span class="info-value">
                {{ formatTime(data.breakStartTime) }} - {{ formatTime(data.breakEndTime) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Work Rules -->
        <div class="info-section" *ngIf="data.workRules && data.workRules.length > 0">
          <h4 class="section-title">
            <fa-icon [icon]="faBriefcase" class="me-2"></fa-icon>
            {{ 'WorkRules' | translate }}
          </h4>
          <div class="work-rules-list">
            <div class="work-rule-item" *ngFor="let wr of data.workRules">
              <div class="work-rule-name">{{ wr.workRule.category }}</div>
              <div class="work-rule-type" *ngIf="wr.workRule?.type && getWorkRuleTypeText(wr.workRule.type)">
                {{ getWorkRuleTypeText(wr.workRule.type) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Employees -->
        <div class="info-section">
          <h4 class="section-title">
            <fa-icon [icon]="faUsers" class="me-2"></fa-icon>
            {{ 'Employees' | translate }}
          </h4>
          <div class="employees-count">
            <span class="count-badge">{{ data.employees?.length || data.employeeCount || 0 }}</span>
            <span class="count-text">{{ 'AssignedEmployees' | translate }}</span>
          </div>
          <div class="employees-list" *ngIf="data.employees && data.employees.length > 0">
            <div class="employee-item" *ngFor="let emp of data.employees">
              <div class="employee-name">{{ emp.name || ('Employee' | translate) + ' #' + emp.employeeId }}</div>
            </div>
          </div>
          <div class="no-employees" *ngIf="(!data.employees || data.employees.length === 0) && (!data.employeeCount || data.employeeCount === 0)">
            <p>{{ 'NoEmployeesAssignedToShift' | translate }}</p>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button type="button" class="btn btn-primary" (click)="close()">
          {{ 'Close' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .view-shift-dialog {
      min-width: 600px;
      max-width: 800px;
      padding: 0;
      border-radius: 20px;
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      color: #1f2937;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: #ffffff;
      border-bottom: 1px solid rgba(209, 213, 219, 0.8);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .header-icon-wrapper {
      flex-shrink: 0;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.2));
      border: 1px solid rgba(249, 115, 22, 0.4);
      color: #f97316;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
    }

    .header-icon fa-icon {
      font-size: 22px;
    }

    .header-text {
      flex: 1;
    }

    .dialog-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
      color: #1f2937;
    }

    .dialog-subtitle {
      margin: 0.25rem 0 0 0;
      font-size: 0.95rem;
      color: #6b7280;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-close:hover {
      background: #f9fafb;
      color: #1f2937;
    }

    .btn-close fa-icon {
      color: #f97316;
    }

    .dialog-body {
      padding: 2rem;
      max-height: 60vh;
      overflow-y: auto;
      background: #ffffff;
    }

    .info-section {
      margin-bottom: 2rem;
    }

    .info-section:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      font-size: 1.1rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 1rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(209, 213, 219, 0.8);
    }

    .section-title fa-icon {
      color: #f97316;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      background: #f9fafb;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 12px;
    }

    .info-label {
      font-size: 0.85rem;
      color: #6b7280;
      font-weight: 600;
    }

    .info-value {
      font-size: 1rem;
      color: #1f2937;
      font-weight: 600;
    }

    .badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .badge-yes {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15));
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }

    .badge-no {
      background: #f9fafb;
      color: #6b7280;
      border: 1px solid rgba(209, 213, 219, 0.8);
    }

    .work-rules-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .work-rule-item {
      padding: 1rem;
      background: #f9fafb;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 12px;
    }

    .work-rule-name {
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .work-rule-type {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .employees-count {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 12px;
    }

    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      height: 40px;
      padding: 0 0.75rem;
      border-radius: 999px;
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.2));
      border: 1px solid rgba(249, 115, 22, 0.4);
      color: #f97316;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .count-text {
      font-weight: 600;
      color: #1f2937;
    }

    .employees-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .employee-item {
      padding: 0.75rem 1rem;
      background: #f9fafb;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 10px;
    }

    .employee-name {
      font-weight: 600;
      color: #1f2937;
    }

    .no-employees {
      padding: 1.5rem;
      text-align: center;
      color: #6b7280;
      font-style: italic;
    }

    .dialog-footer {
      padding: 1.5rem 2rem;
      border-top: 1px solid rgba(209, 213, 219, 0.8);
      display: flex;
      justify-content: flex-end;
      background: #ffffff;
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

    .btn-primary:hover {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(234, 88, 12, 0.3));
      border-color: rgba(249, 115, 22, 0.6);
      color: #ea580c;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
    }

    .btn-primary:hover::before {
      left: 100%;
    }

    /* Scrollbar styling */
    .dialog-body::-webkit-scrollbar {
      width: 8px;
    }

    .dialog-body::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }

    .dialog-body::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    .dialog-body::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `]
})
export class ViewShiftDialogComponent {
  faClock = faClock;
  faTimes = faTimes;
  faUsers = faUsers;
  faBriefcase = faBriefcase;

  constructor(
    private dialogRef: MatDialogRef<ViewShiftDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ShiftDto
  ) {}

  formatTime(time: string): string {
    if (!time) return '—';
    // Handle both "HH:mm:ss" and "HH:mm" formats
    const parts = time.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return time;
  }

  getWorkRuleTypeText(type: number | undefined): string {
    if (!type) return '';
    // Map work rule type numbers to text
    const typeMap: { [key: number]: string } = {
      5: 'Custom',
      6: 'Shifts'
    };
    return typeMap[type] || '';
  }

  close(): void {
    this.dialogRef.close();
  }
}

