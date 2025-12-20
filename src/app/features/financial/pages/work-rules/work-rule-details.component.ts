import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  faArrowLeft,
  faClock,
  faUsers,
  faBuilding,
  faPhone,
  faEnvelope,
  faIdCard,
  faCalendar,
  faDollarSign,
  faCheckCircle,
  faTimesCircle,
  faCalendarAlt,
  faEye,
  faUserMinus,
  faPlus,
  faSpinner,
  faExclamationTriangle,
  faInfoCircle,
  faBan,
  faMoneyBill,
  faHourglass,
  faMoon,
  faSun
} from '@fortawesome/free-solid-svg-icons';

import { FinancialService } from '../../../../core/services/financial.service';
import { WorkRuleDetailsDto, AssignedEmployeeDto, ShiftDto, CreateShiftDto } from '../../../../core/interfaces/financial.interface';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { AssignShiftDialogComponent } from './assign-shift-dialog.component';
import { CreateShiftDialogComponent } from './create-shift-dialog.component';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { catchError, forkJoin, map, of } from 'rxjs';

@Component({
  selector: 'app-work-rule-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    FontAwesomeModule,
    ShimmerComponent
  ],
  template: `
    <div class="work-rule-details-container">
      <div class="container-fluid py-4">
        <!-- Enhanced Header -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="page-header">
              <div class="header-left">
                <button class="btn btn-ghost me-3" routerLink="/admin/financial/work-rules">
                  <fa-icon [icon]="faArrowLeft" class="me-2"></fa-icon>
                  {{ 'Back' | translate }}
                </button>
                <div class="header-title">
                  <h2 class="mb-1">
                    <fa-icon [icon]="faEye" class="me-2"></fa-icon>
                    {{ 'WorkRuleDetails' | translate }}
                  </h2>
                  <p class="mb-0" *ngIf="workRuleDetails">
                    {{ workRuleDetails.category }} - {{ getWorkRuleTypeLabel(workRuleDetails.type) }}
                  </p>
                </div>
              </div>
              <div class="header-actions">
                <div class="work-rule-type-badge">
                  <span class="work-rule-type-text" *ngIf="workRuleDetails">
                    {{ getWorkRuleTypeLabel(workRuleDetails.type) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div *ngIf="isLoading; else loadedContent">
          <div class="glass-card h-100">
            <div class="glass-body p-4">
              <app-shimmer></app-shimmer>
            </div>
          </div>
        </div>

        <ng-template #loadedContent>
          <div *ngIf="error; else successContent" class="alert alert-danger" role="alert">
            <fa-icon [icon]="faTimesCircle" class="me-2"></fa-icon>
            {{ error }}
          </div>

          <ng-template #successContent>
            <div *ngIf="workRuleDetails" class="work-rule-content">
              <!-- Main Content Card -->
              <div class="main-card">
                <!-- Work Rule Header -->
                <div class="work-rule-header">
                  <div class="rule-title-section">
                    <h3 class="rule-title">{{ workRuleDetails.category }}</h3>
                    <div class="rule-meta">
                      <span class="rule-type" [ngClass]="'type-' + getWorkRuleTypeClass(workRuleDetails.type)">
                        {{ getWorkRuleTypeLabel(workRuleDetails.type) }}
                      </span>
                      <span class="rule-status" [ngClass]="workRuleDetails.isPrivate ? 'private' : 'public'">
                        {{ workRuleDetails.isPrivate ? ('Private' | translate) : ('Public' | translate) }}
                      </span>
                      <span class="rule-status shift-based" *ngIf="workRuleDetails.isShiftBased">
                        {{ 'ShiftBasedRule' | translate }}
                      </span>
                    </div>
                  </div>
                  <div class="rule-stats">
                    <div class="stat-item">
                      <div class="stat-number">{{ workRuleDetails.totalAssignedEmployees }}</div>
                      <div class="stat-label">{{ 'TotalEmployees' | translate }}</div>
                    </div>
                  </div>
                </div>

                <div class="alert alert-warning validation-warnings" *ngIf="workRuleDetails.validationWarnings?.length">
                  <strong>{{ 'ValidationWarnings' | translate }}:</strong>
                  <ul class="mb-0 mt-2">
                    <li *ngFor="let warning of getLocalizedWarnings(workRuleDetails.validationWarnings)">
                      {{ warning }}
                    </li>
                  </ul>
                </div>

                <!-- Work Rule Details Grid -->
                <div class="details-grid">
                  <!-- Basic Info -->
                  <div class="info-card">
                    <h4 class="card-title">
                      <fa-icon [icon]="faClock" class="me-2"></fa-icon>
                      {{ 'WorkRuleInformation' | translate }}
                    </h4>
                    <div class="info-list">
                      <div class="info-item">
                        <span class="label">{{ 'Category' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.category }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ 'Type' | translate }}:</span>
                        <span class="value type-badge" [ngClass]="'type-' + getWorkRuleTypeClass(workRuleDetails.type)">
                          {{ getWorkRuleTypeLabel(workRuleDetails.type) }}
                        </span>
                      </div>
                      <div class="info-item" *ngIf="workRuleDetails.expectStartTime">
                        <span class="label">{{ 'StartTime' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.expectStartTime }}</span>
                      </div>
                      <div class="info-item" *ngIf="workRuleDetails.expectEndTime">
                        <span class="label">{{ 'EndTime' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.expectEndTime }}</span>
                      </div>
                      <div class="info-item" *ngIf="workRuleDetails.expectedHoursPerDay">
                        <span class="label">{{ 'HoursPerDay' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.expectedHoursPerDay }}</span>
                      </div>
                      <div class="info-item" *ngIf="workRuleDetails.expectedDaysPerWeek">
                        <span class="label">{{ 'DaysPerWeek' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.expectedDaysPerWeek }}</span>
                      </div>
                      <div class="info-item" *ngIf="workRuleDetails.paymentFrequency !== undefined && workRuleDetails.paymentFrequency !== null">
                        <span class="label">{{ 'PaymentFrequency' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.paymentFrequency }}</span>
                      </div>
                      <div class="info-item" *ngIf="workRuleDetails.employeeCount !== undefined && workRuleDetails.employeeCount !== null">
                        <span class="label">{{ 'EmployeeCount' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.employeeCount }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Late & Early Departure Rules -->
                  <div class="info-card">
                    <h4 class="card-title">
                      <fa-icon [icon]="faExclamationTriangle" class="me-2"></fa-icon>
                      {{ 'LateEarlyDepartureRules' | translate }}
                    </h4>
                    <div class="info-list">
                      <div class="info-item">
                        <span class="label">{{ 'LateArrivalToleranceMinutes' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.lateArrivalToleranceMinutes != null ? workRuleDetails.lateArrivalToleranceMinutes : 0 }} {{ 'Minutes' | translate }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ 'EarlyDepartureToleranceMinutes' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.earlyDepartureToleranceMinutes != null ? workRuleDetails.earlyDepartureToleranceMinutes : 0 }} {{ 'Minutes' | translate }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ 'LateDeductionMinutesPerHour' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.lateDeductionMinutesPerHour != null ? workRuleDetails.lateDeductionMinutesPerHour : 0 }} {{ 'MinutesPerHour' | translate }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ 'EarlyDepartureDeductionMinutesPerHour' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.earlyDepartureDeductionMinutesPerHour != null ? workRuleDetails.earlyDepartureDeductionMinutesPerHour : 0 }} {{ 'MinutesPerHour' | translate }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Overtime Rules -->
                  <div class="info-card">
                    <h4 class="card-title">
                      <fa-icon [icon]="faMoneyBill" class="me-2"></fa-icon>
                      {{ 'OvertimeRules' | translate }}
                    </h4>
                    <div class="info-list">
                      <div class="info-item">
                        <span class="label">{{ 'OvertimeMultiplier' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.overtimeMultiplier != null ? workRuleDetails.overtimeMultiplier : 0 }}x</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ 'MinimumOvertimeMinutes' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.minimumOvertimeMinutes != null ? workRuleDetails.minimumOvertimeMinutes : 0 }} {{ 'Minutes' | translate }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Absence Rules -->
                  <div class="info-card">
                    <h4 class="card-title">
                      <fa-icon [icon]="faBan" class="me-2"></fa-icon>
                      {{ 'AbsenceRules' | translate }}
                    </h4>
                    <div class="info-list">
                      <div class="info-item">
                        <span class="label">{{ 'AbsenceDeductionMultiplier' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.absenceDeductionMultiplier != null ? workRuleDetails.absenceDeductionMultiplier : 0 }}x</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ 'AllowedAbsenceDaysPerMonth' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.allowedAbsenceDaysPerMonth != null ? workRuleDetails.allowedAbsenceDaysPerMonth : 0 }} {{ 'Days' | translate }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ 'AreOffDaysPaid' | translate }}:</span>
                        <span class="value">
                          <span class="badge" [ngClass]="workRuleDetails.areOffDaysPaid ? 'badge-success' : 'badge-danger'">
                            {{ workRuleDetails.areOffDaysPaid ? ('Yes' | translate) : ('No' | translate) }}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Off-Day Rules -->
                  <div class="info-card">
                    <h4 class="card-title">
                      <fa-icon [icon]="faCalendarAlt" class="me-2"></fa-icon>
                      {{ 'OffDayRules' | translate }}
                    </h4>
                    <div class="info-list">
                      <div class="info-item">
                        <span class="label">{{ 'AllowWorkDuringOffDays' | translate }}:</span>
                        <span class="value">
                          <span class="badge" [ngClass]="workRuleDetails.allowWorkOnOffDays ? 'badge-success' : 'badge-danger'">
                            {{ workRuleDetails.allowWorkOnOffDays ? ('Yes' | translate) : ('No' | translate) }}
                          </span>
                        </span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ 'TreatOffDayWorkAsOvertime' | translate }}:</span>
                        <span class="value">
                          <span class="badge" [ngClass]="workRuleDetails.treatOffDayWorkAsOvertime ? 'badge-success' : 'badge-danger'">
                            {{ workRuleDetails.treatOffDayWorkAsOvertime ? ('Yes' | translate) : ('No' | translate) }}
                          </span>
                        </span>
                      </div>
                      <div class="info-item" *ngIf="workRuleDetails.offDayOvertimeMultiplier !== null && workRuleDetails.offDayOvertimeMultiplier !== undefined">
                        <span class="label">{{ 'WorkRuleOffDayOvertimeMultiplier' | translate }}:</span>
                        <span class="value">{{ workRuleDetails.offDayOvertimeMultiplier }}x</span>
                      </div>
                      <div class="info-item">
                        <span class="label">{{ 'WorkRuleOffDayHourlyRate' | translate }}:</span>
                        <span class="value">{{ formatCurrency(workRuleDetails.offDayHourlyRate != null ? workRuleDetails.offDayHourlyRate : 0) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Statistics -->
                  <div class="stats-card">
                    <h4 class="card-title">
                      <fa-icon [icon]="faUsers" class="me-2"></fa-icon>
                      {{ 'Statistics' | translate }}
                    </h4>
                    <div class="stats-list">
                      <div class="stat-item">
                        <div class="stat-icon active">
                          <fa-icon [icon]="faCheckCircle"></fa-icon>
                        </div>
                        <div class="stat-info">
                          <div class="stat-number">{{ workRuleDetails.activeEmployees }}</div>
                          <div class="stat-label">{{ 'ActiveEmployees' | translate }}</div>
                        </div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-icon inactive">
                          <fa-icon [icon]="faTimesCircle"></fa-icon>
                        </div>
                        <div class="stat-info">
                          <div class="stat-number">{{ workRuleDetails.inactiveEmployees }}</div>
                          <div class="stat-label">{{ 'InactiveEmployees' | translate }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Off Days -->
                  <div class="off-days-card" *ngIf="workRuleDetails.offDays.length > 0">
                    <h4 class="card-title">
                      <fa-icon [icon]="faCalendarAlt" class="me-2"></fa-icon>
                      {{ 'OffDays' | translate }}
                    </h4>
                    <div class="off-days-list">
                      <span *ngFor="let offDay of workRuleDetails.offDays" class="off-day-item">
                        {{ offDay.dayOfWeek }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="shifts-section" *ngIf="workRuleDetails">
                  <div class="section-header shifts-header">
                    <h4 class="section-title">{{ 'ShiftAssignments' | translate }}</h4>
                    <button class="btn btn-outline-light btn-sm" type="button" (click)="openCreateShiftDialog()">
                      <fa-icon [icon]="faPlus" class="me-2"></fa-icon>
                      {{ 'AddShiftForThisRule' | translate }}
                    </button>
                  </div>

                  <ng-container *ngIf="workRuleDetails.shifts?.length; else emptyShifts">
                    <div class="shifts-grid">
                      <div class="shift-card" *ngFor="let shift of workRuleDetails.shifts">
                        <div class="shift-card-header">
                          <div>
                            <h5 class="shift-name">{{ shift.name }}</h5>
                            <div class="shift-time">
                              <fa-icon [icon]="faClock" class="me-1"></fa-icon>
                              {{ formatShiftRange(shift.startTime, shift.endTime) }}
                              <span class="shift-overnight-badge" *ngIf="shift.isOvernight">
                                <fa-icon [icon]="faMoon" class="me-1"></fa-icon>
                                {{ 'Overnight' | translate }}
                              </span>
                            </div>
                          </div>
                          <div class="shift-actions">
                            <span class="shift-count">
                              {{ (shift.employeeCount ?? shift.employees?.length ?? 0) }} {{ 'Employees' | translate }}
                            </span>
                            <button class="btn btn-ghost btn-sm" type="button" (click)="openAssignShiftDialog(shift)">
                              <fa-icon [icon]="faUsers" class="me-2"></fa-icon>
                              {{ 'Assign' | translate }}
                            </button>
                          </div>
                        </div>
                        
                        <!-- Shift Details -->
                        <div class="shift-details">
                          <div class="shift-detail-item" *ngIf="shift.isOvernight !== undefined">
                            <fa-icon [icon]="shift.isOvernight ? faMoon : faSun" class="me-1"></fa-icon>
                            <span class="detail-label">{{ 'Overnight' | translate }}:</span>
                            <span class="detail-value">
                              <span class="badge" [ngClass]="shift.isOvernight ? 'badge-info' : 'badge-success'">
                                {{ shift.isOvernight ? ('Yes' | translate) : ('No' | translate) }}
                              </span>
                            </span>
                          </div>
                          <div class="shift-detail-item" *ngIf="shift.isThereBreak !== undefined">
                            <fa-icon [icon]="faInfoCircle" class="me-1"></fa-icon>
                            <span class="detail-label">{{ 'HasBreak' | translate }}:</span>
                            <span class="detail-value">
                              <span class="badge" [ngClass]="shift.isThereBreak ? 'badge-success' : 'badge-danger'">
                                {{ shift.isThereBreak ? ('Yes' | translate) : ('No' | translate) }}
                              </span>
                            </span>
                          </div>
                          <div class="shift-detail-item" *ngIf="shift.isBreakFixed !== undefined">
                            <fa-icon [icon]="faInfoCircle" class="me-1"></fa-icon>
                            <span class="detail-label">{{ 'IsBreakFixed' | translate }}:</span>
                            <span class="detail-value">
                              <span class="badge" [ngClass]="shift.isBreakFixed ? 'badge-success' : 'badge-danger'">
                                {{ shift.isBreakFixed ? ('Yes' | translate) : ('No' | translate) }}
                              </span>
                            </span>
                          </div>
                          <div class="shift-detail-item" *ngIf="shift.breakStartTime && shift.breakEndTime">
                            <fa-icon [icon]="faClock" class="me-1"></fa-icon>
                            <span class="detail-label">{{ 'BreakTime' | translate }}:</span>
                            <span class="detail-value">{{ formatShiftRange(shift.breakStartTime, shift.breakEndTime) }}</span>
                          </div>
                          <div class="shift-detail-item" *ngIf="shift.breakMinutes !== undefined && shift.breakMinutes !== null">
                            <fa-icon [icon]="faHourglass" class="me-1"></fa-icon>
                            <span class="detail-label">{{ 'BreakMinutes' | translate }}:</span>
                            <span class="detail-value">{{ shift.breakMinutes }} {{ 'Minutes' | translate }}</span>
                          </div>
                          <div class="shift-detail-item" *ngIf="shift.breakMinutes === null && shift.isThereBreak">
                            <fa-icon [icon]="faHourglass" class="me-1"></fa-icon>
                            <span class="detail-label">{{ 'BreakMinutes' | translate }}:</span>
                            <span class="detail-value">{{ 'NotSpecified' | translate }}</span>
                          </div>
                        </div>
                        <div *ngIf="shift.employees?.length; else noShiftEmployees" class="shift-employees">
                          <div class="shift-employee" *ngFor="let shiftEmployee of shift.employees">
                            <div class="employee-info">
                              <div class="employee-name">{{ shiftEmployee.name }}</div>
                              <div class="employee-meta">
                                <span>{{ shiftEmployee.phone }}</span>
                                <span>{{ shiftEmployee.joinedDate ? formatDate(shiftEmployee.joinedDate) : '' }}</span>
                              </div>
                            </div>
                            <button 
                              class="btn btn-sm btn-unassign" 
                              type="button" 
                              [disabled]="isUnassigningFromShift(shift.id, shiftEmployee.employeeId)"
                              (click)="unassignEmployeeFromShift(shift, shiftEmployee)">
                              <fa-icon 
                                [icon]="isUnassigningFromShift(shift.id, shiftEmployee.employeeId) ? faSpinner : faUserMinus" 
                                [class.fa-spin]="isUnassigningFromShift(shift.id, shiftEmployee.employeeId)"
                                class="me-1"></fa-icon>
                              {{ isUnassigningFromShift(shift.id, shiftEmployee.employeeId) ? ('Unassigning' | translate) : ('Unassign' | translate) }}
                            </button>
                          </div>
                        </div>
                        <ng-template #noShiftEmployees>
                          <div class="empty-state text-center py-3">
                            <p class="empty-text mb-0">{{ 'NoShiftEmployees' | translate }}</p>
                          </div>
                        </ng-template>
                      </div>
                    </div>
                  </ng-container>

                  <ng-template #emptyShifts>
                    <div class="empty-state text-center py-4">
                      <p class="empty-text mb-2">{{ 'NoShifts' | translate }}</p>
                      <small class="text-muted">
                        {{ 'AddShiftForThisRuleHint' | translate }}
                      </small>
                    </div>
                  </ng-template>
                </div>

                <!-- Description -->
                <div class="description-section" *ngIf="workRuleDetails.description">
                  <h4 class="section-title">{{ 'Description' | translate }}</h4>
                  <p class="description-text">{{ workRuleDetails.description }}</p>
                </div>

                <!-- Assigned Employees -->
                <div class="employees-section">
                  <div class="section-header">
                    <h4 class="section-title">
                      <fa-icon [icon]="faUsers" class="me-2"></fa-icon>
                      {{ 'AssignedEmployees' | translate }}
                    </h4>
                    <span class="employee-count">{{ workRuleDetails.assignedEmployees.length }} {{ 'Employees' | translate }}</span>
                  </div>

                  <div *ngIf="workRuleDetails.assignedEmployees.length === 0; else employeesList" class="empty-state">
                    <fa-icon [icon]="faUsers" class="empty-icon"></fa-icon>
                    <p class="empty-text">{{ 'NoAssignedEmployees' | translate }}</p>
                  </div>

                  <ng-template #employeesList>
                    <div class="employees-table">
                      <div class="table-header">
                        <div class="col-name">{{ 'Name' | translate }}</div>
                        <div class="col-phone">{{ 'Phone' | translate }}</div>
                        <div class="col-department">{{ 'Department' | translate }}</div>
                        <div class="col-shift">{{ 'Shifts' | translate }}</div>
                        <div class="col-salary">{{ 'Salary' | translate }}</div>
                        <div class="col-status">{{ 'Status' | translate }}</div>
                        <div class="col-actions">{{ 'Actions' | translate }}</div>
                      </div>
                      <div class="table-body">
                        <div *ngFor="let employee of workRuleDetails.assignedEmployees" class="employee-row">
                          <div class="col-name">
                            <div class="employee-info">
                              <div class="employee-avatar">{{ employee.name.charAt(0).toUpperCase() }}</div>
                              <div class="employee-details">
                                <div class="employee-name">{{ employee.name }}</div>
                                <div class="employee-id">ID: {{ employee.cardNumber }}</div>
                              </div>
                            </div>
                          </div>
                          <div class="col-phone">
                            <fa-icon [icon]="faPhone" class="me-1"></fa-icon>
                            {{ employee.phone }}
                          </div>
                          <div class="col-department">
                            <fa-icon [icon]="faBuilding" class="me-1"></fa-icon>
                            {{ employee.department || 'N/A' }}
                          </div>
                        <div class="col-shift">
                          <fa-icon [icon]="faClock" class="me-1"></fa-icon>
                          {{ employee.shift?.name || ('NotAvailable' | translate) }}
                        </div>
                          <div class="col-salary">
                            <fa-icon [icon]="faDollarSign" class="me-1"></fa-icon>
                            {{ employee.salaryAmount ? formatCurrency(employee.salaryAmount) : 'N/A' }}
                          </div>
                          <div class="col-status">
                            <span class="status-badge" [ngClass]="employee.isActive ? 'active' : 'inactive'">
                              <fa-icon [icon]="employee.isActive ? faCheckCircle : faTimesCircle" class="me-1"></fa-icon>
                              {{ employee.isActive ? ('Active' | translate) : ('Inactive' | translate) }}
                            </span>
                          </div>
                          <div class="col-actions">
                            <button 
                              class="btn btn-sm btn-outline-danger unassign-btn" 
                              (click)="unassignEmployee(employee)"
                              [title]="'UnassignEmployee' | translate">
                              <fa-icon [icon]="faUserMinus"></fa-icon>
                              {{ 'Unassign' | translate }}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ng-template>
                </div>
              </div>
            </div>
          </ng-template>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .work-rule-details-container {
      min-height: 100vh;
      background: #f3f4f6 !important;
      padding: 32px;
      color: #1f2937 !important;
    }

    /* Header Styles */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 15px;
      padding: 2rem 2.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      position: relative;
    }

    .header-left {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .header-center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .header-title {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 2rem;
    }

    .header-title h2 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: #1f2937 !important;
    }

    .header-title h2 fa-icon {
      color: #f97316 !important;
    }

    .header-title p {
      font-size: 1rem;
      opacity: 0.9;
      margin: 0;
      color: #6b7280 !important;
    }

    .work-rule-type-text {
      font-size: 0.9rem;
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #f97316, #ea580c) !important;
      border: 1px solid rgba(249, 115, 22, 0.3);
      border-radius: 12px;
      font-weight: 600;
      color: white !important;
      box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
      transition: all 0.3s ease;
      display: inline-block;
    }

    .work-rule-type-text:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(249, 115, 22, 0.4);
    }

    /* Main Card */
    .main-card {
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 20px;
      padding: 2rem;
      color: #1f2937;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    /* Work Rule Header */
    .work-rule-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(209, 213, 219, 0.8);
      margin-bottom: 2rem;
    }

    .rule-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: #1f2937;
    }

    .rule-meta {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .rule-type, .rule-status {
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .rule-type.type-regular {
      background: linear-gradient(135deg, #74b9ff, #0984e3);
      color: white;
    }

    .rule-type.type-flexible {
      background: linear-gradient(135deg, #fd79a8, #e84393);
      color: white;
    }

    .rule-type.type-shift {
      background: linear-gradient(135deg, #fdcb6e, #e17055);
      color: white;
    }

    .rule-status.private {
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      color: white;
    }

    .rule-status.public {
      background: linear-gradient(135deg, #2ed573, #1e90ff);
      color: white;
    }

    .rule-status.shift-based {
      background: linear-gradient(135deg, #ffd166, #ef476f);
      color: white;
    }

    .rule-stats .stat-item {
      text-align: center;
    }

    .rule-stats .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: #f97316;
      margin-bottom: 0.25rem;
    }

    .rule-stats .stat-label {
      color: #6b7280;
      font-size: 0.9rem;
    }

    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 1400px) {
      .details-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 1200px) {
      .details-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .details-grid {
        grid-template-columns: 1fr;
      }
    }

    .info-card, .stats-card, .off-days-card {
      background: #f9fafb;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 15px;
      padding: 1.5rem;
      min-width: 0; /* Prevent grid item from overflowing */
      display: flex;
      flex-direction: column;
    }

    .card-title {
      color: #1f2937;
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
    }

    .card-title fa-icon {
      color: #f97316 !important;
    }

    /* Info List */
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      flex: 1;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(209, 213, 219, 0.8);
      gap: 1rem;
      min-width: 0; /* Allow flex items to shrink */
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item .label {
      color: #6b7280;
      font-weight: 500;
      font-size: 0.9rem;
      flex-shrink: 0;
      min-width: fit-content;
    }

    .info-item .value {
      color: #1f2937;
      font-weight: 600;
      font-size: 1rem;
      text-align: right;
      flex: 1;
      min-width: 0;
      word-break: break-word;
    }

    .type-badge {
      padding: 0.3rem 0.8rem;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .type-badge.type-regular {
      background: linear-gradient(135deg, #74b9ff, #0984e3);
      color: white;
    }

    .type-badge.type-flexible {
      background: linear-gradient(135deg, #fd79a8, #e84393);
      color: white;
    }

    .type-badge.type-shift {
      background: linear-gradient(135deg, #fdcb6e, #e17055);
      color: white;
    }

    /* Stats List */
    .stats-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }

    .stat-icon.active {
      background: linear-gradient(135deg, #2ed573, #1e90ff);
      color: white;
    }

    .stat-icon.inactive {
      background: linear-gradient(135deg, #ffa502, #ff6348);
      color: white;
    }

    .stat-info {
      flex: 1;
    }

    .stat-info .stat-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .stat-info .stat-label {
      color: #6b7280;
      font-size: 0.85rem;
    }

    /* Off Days */
    .off-days-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .off-day-item {
      background: rgba(249, 115, 22, 0.1);
      color: #f97316;
      padding: 0.5rem 1rem;
      border-radius: 15px;
      font-size: 0.85rem;
      font-weight: 500;
      border: 1px solid rgba(249, 115, 22, 0.3);
    }

    /* Description Section */
    .description-section {
      margin-bottom: 2rem;
    }

    .validation-warnings {
      background: rgba(255, 193, 7, 0.15);
      border: 1px solid rgba(255, 193, 7, 0.4);
      border-radius: 15px;
      color: #1f2937 !important;
      padding: 1rem 1.5rem;
      margin-bottom: 2rem;
    }

    .section-title {
      color: #1f2937 !important;
      font-weight: 600;
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }

    .section-title fa-icon {
      color: #f97316 !important;
    }

    .description-text {
      color: #1f2937 !important;
      font-size: 1rem;
      line-height: 1.6;
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 10px;
      border-left: 4px solid #f97316;
      border: 1px solid rgba(209, 213, 219, 0.8);
    }

    /* Employees Section */
    .employees-section {
      margin-top: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .employee-count {
      background: rgba(249, 115, 22, 0.1);
      color: #f97316 !important;
      padding: 0.5rem 1rem;
      border: 1px solid rgba(249, 115, 22, 0.3);
      border-radius: 12px;
      border-radius: 15px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Employees Table */
    .employees-table {
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 1.3fr 1.3fr 1.2fr 1.2fr 1fr 1.1fr;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #f9fafb;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 12px;
      font-weight: 600;
      color: #1f2937 !important;
      font-size: 0.9rem;
    }

    .table-body {
      max-height: 400px;
      overflow-y: auto;
    }

    .employee-row {
      display: grid;
      grid-template-columns: 2fr 1.3fr 1.3fr 1.2fr 1.2fr 1fr 1.1fr;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(209, 213, 219, 0.8);
      align-items: center;
      background: #ffffff;
      color: #1f2937 !important;
    }

    .employee-row:last-child {
      border-bottom: none;
    }

    .employee-row:hover {
      background: #f9fafb !important;
    }

    .employee-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .shifts-section {
      margin-bottom: 2rem;
    }

    .shifts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .shifts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .shift-card {
      background: #ffffff;
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 15px;
      padding: 1.5rem;
      color: #1f2937;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .shift-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .shift-name {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }

    .shift-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .shift-count {
      background: rgba(249, 115, 22, 0.1);
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      color: #f97316;
      border: 1px solid rgba(249, 115, 22, 0.3);
    }

    .btn-ghost.btn-sm {
      padding: 0.35rem 0.85rem;
      border-radius: 8px;
      font-size: 0.8rem;
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.15)) !important;
      border: 1px solid rgba(249, 115, 22, 0.3) !important;
      color: #f97316 !important;
    }

    .btn-outline-light {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.15)) !important;
      border: 1px solid rgba(249, 115, 22, 0.3) !important;
      color: #f97316 !important;
      transition: all 0.3s ease;
    }

    .btn-outline-light:hover {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(234, 88, 12, 0.25)) !important;
      border-color: rgba(249, 115, 22, 0.5) !important;
      color: #ea580c !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
    }

    .btn-outline-light fa-icon {
      color: inherit !important;
    }

    .shift-time {
      font-size: 0.95rem;
      color: #6b7280;
      margin-bottom: 1rem;
    }

    .shift-employees {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .shift-employee {
      border: 1px solid rgba(209, 213, 219, 0.8);
      border-radius: 10px;
      padding: 0.75rem;
      background: #f9fafb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .shift-employee .employee-info {
      flex: 1;
    }

    .shift-employee .employee-name {
      font-weight: 600;
      margin-bottom: 0.25rem;
      color: #1f2937;
    }

    .shift-employee .employee-meta {
      font-size: 0.85rem;
      color: #6b7280 !important;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .btn-unassign {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fecaca;
      white-space: nowrap;
      transition: all 0.2s ease;
      padding: 0.4rem 0.75rem;
      font-size: 0.8rem;
    }

    .btn-unassign:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.3);
      border-color: rgba(239, 68, 68, 0.6);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    }

    .btn-unassign:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-unassign .fa-spin {
      animation: fa-spin 1s infinite linear;
    }

    @keyframes fa-spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .employee-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
    }

    .employee-details {
      flex: 1;
    }

    .employee-name {
      color: #1f2937 !important;
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }

    .employee-id {
      color: #6b7280 !important;
      font-size: 0.8rem;
    }

    .col-phone, .col-department, .col-shift, .col-salary, .col-actions {
      color: #1f2937 !important;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
    }

    .col-phone fa-icon,
    .col-department fa-icon,
    .col-shift fa-icon,
    .col-salary fa-icon {
      color: #f97316 !important;
    }

    .col-actions {
      justify-content: center;
    }

    .status-badge {
      padding: 0.3rem 0.8rem;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .status-badge.active {
      background: linear-gradient(135deg, #2ed573, #1e90ff);
      color: white;
    }

    .status-badge.inactive {
      background: linear-gradient(135deg, #ffa502, #ff6348);
      color: white;
    }

    /* Unassign Button */
    .unassign-btn {
      background: linear-gradient(135deg, #ff6b6b, #ee5a24) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      color: white !important;
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .unassign-btn:hover {
      background: linear-gradient(135deg, #ff5252, #d63031) !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
    }

    .unassign-btn:focus {
      box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.5);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
    }

    .empty-icon {
      font-size: 3rem;
      color: #f97316 !important;
      margin-bottom: 1rem;
    }

    .empty-text {
      color: #6b7280;
      font-size: 1rem;
    }

    /* Badge Styles */
    .badge-success {
      background: linear-gradient(135deg, #2ed573, #1e90ff);
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 600;
      display: inline-block;
    }

    .badge-danger {
      background: linear-gradient(135deg, #ffa502, #ff6348);
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 600;
      display: inline-block;
    }

    .badge-info {
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 600;
      display: inline-block;
    }

    /* Shift Details */
    .shift-details {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(209, 213, 219, 0.8);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .shift-detail-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #1f2937;
    }

    .shift-detail-item fa-icon {
      color: #f97316 !important;
    }

    .detail-label {
      color: #6b7280;
      font-weight: 500;
    }

    .detail-value {
      color: #1f2937;
      font-weight: 600;
    }

    .shift-overnight-badge {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      border: 1px solid rgba(139, 92, 246, 0.3);
      margin-left: 0.5rem;
      display: inline-flex;
      align-items: center;
    }

    .shift-overnight-badge fa-icon {
      color: #8b5cf6 !important;
    }

    /* Button Styles */
    .btn-ghost {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.15)) !important;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(249, 115, 22, 0.3) !important;
      color: #f97316 !important;
      transition: all 0.3s ease;
      padding: 1rem 1.75rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }

    .btn-ghost::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }

    .btn-ghost:hover::before {
      left: 100%;
    }

    .btn-ghost:hover {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(234, 88, 12, 0.25)) !important;
      border-color: rgba(249, 115, 22, 0.5) !important;
      transform: translateY(-3px);
      color: #ea580c !important;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
    }

    .btn-ghost:active {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
        padding: 1.5rem 2rem;
      }

      .header-left {
        flex-direction: column;
        gap: 1rem;
      }

      .header-title h2 {
        font-size: 1.6rem;
      }

      .header-title p {
        font-size: 0.9rem;
      }

      .btn-ghost {
        padding: 0.875rem 1.5rem;
        font-size: 0.9rem;
      }

      .work-rule-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .table-header, .employee-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .table-header > div, .employee-row > div {
        padding: 0.5rem 0;
      }

      .col-actions {
        justify-content: flex-start;
      }

      .employee-info {
        justify-content: center;
      }
    }
  `]
})
export class WorkRuleDetailsComponent implements OnInit {
  private financialService = inject(FinancialService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // FontAwesome Icons
  faArrowLeft = faArrowLeft;
  faClock = faClock;
  faUsers = faUsers;
  faBuilding = faBuilding;
  faPhone = faPhone;
  faEnvelope = faEnvelope;
  faIdCard = faIdCard;
  faCalendar = faCalendar;
  faDollarSign = faDollarSign;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faCalendarAlt = faCalendarAlt;
  faEye = faEye;
  faUserMinus = faUserMinus;
  faPlus = faPlus;
  faSpinner = faSpinner;
  faExclamationTriangle = faExclamationTriangle;
  faInfoCircle = faInfoCircle;
  faBan = faBan;
  faMoneyBill = faMoneyBill;
  faHourglass = faHourglass;
  faMoon = faMoon;
  faSun = faSun;

  // Data properties
  workRuleDetails: WorkRuleDetailsDto | null = null;
  isLoading = true;
  error: string | null = null;
  private loadingDialogRef: MatDialogRef<NotificationDialogComponent> | null = null;
  private unassigningFromShift = new Map<string, boolean>(); // Track unassigning state: key = "shiftId-employeeId"

  // Get work rule ID from route
  get workRuleId(): number {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? +id : 0;
  }

  ngOnInit(): void {
    this.loadWorkRuleDetails();
  }

  loadWorkRuleDetails(): void {
    this.isLoading = true;
    this.error = null;

    this.financialService.getWorkRuleDetails(this.workRuleId).pipe(
      catchError(err => {
        this.error = this.translate.instant('ERROR.FAILED_TO_LOAD_WORK_RULE_DETAILS');
        console.error('Error fetching work rule details:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess && response.data) {
        this.workRuleDetails = response.data;
        // Debug: Log the data to see what fields are available
        console.log('Work Rule Details loaded:', this.workRuleDetails);
        console.log('lateArrivalToleranceMinutes:', this.workRuleDetails.lateArrivalToleranceMinutes, 'Type:', typeof this.workRuleDetails.lateArrivalToleranceMinutes);
        console.log('lateDeductionMinutesPerHour:', this.workRuleDetails.lateDeductionMinutesPerHour, 'Type:', typeof this.workRuleDetails.lateDeductionMinutesPerHour);
        console.log('overtimeMultiplier:', this.workRuleDetails.overtimeMultiplier, 'Type:', typeof this.workRuleDetails.overtimeMultiplier);
        console.log('absenceDeductionMultiplier:', this.workRuleDetails.absenceDeductionMultiplier, 'Type:', typeof this.workRuleDetails.absenceDeductionMultiplier);
        console.log('Full response.data:', JSON.stringify(response.data, null, 2));
      } else if (!this.error) {
        this.error = response.message || this.translate.instant('ERROR.UNKNOWN_ERROR_FETCHING_WORK_RULE_DETAILS');
      }
      this.isLoading = false;
    });
  }

  getWorkRuleTypeLabel(type: string | number): string {
    // Handle both string and number types
    const typeValue = typeof type === 'number' ? type.toString() : type;
    
    const typeMap: { [key: string]: string } = {
      '1': 'Daily',
      '2': 'Weekly', 
      '3': 'Monthly',
      '4': 'Hourly',
      '5': 'Custom',
      '6': 'Shifts',
      'Daily': 'Daily',
      'Weekly': 'Weekly',
      'Monthly': 'Monthly',
      'Hourly': 'Hourly',
      'Custom': 'Custom',
      'Shifts': 'Shifts',
      'Shift': 'Shifts'
    };
    
    const mappedType = typeMap[typeValue] || 'Custom'; // Default to Custom for unknown types
    const translatedValue = this.translate.instant(`WorkRuleType.${mappedType}`);
    
    // If translation doesn't exist, return the mapped type directly
    return translatedValue !== `WorkRuleType.${mappedType}` ? translatedValue : mappedType;
  }

  getWorkRuleTypeLabelArabic(type: string | number): string {
    // Handle both string and number types
    const typeValue = typeof type === 'number' ? type.toString() : type;
    
    const typeMap: { [key: string]: string } = {
      '1': 'يومي',
      '2': 'أسبوعي', 
      '3': 'شهري',
      '4': 'بالساعة',
      '5': 'مخصص',
      '6': 'شيفتات',
      'Daily': 'يومي',
      'Weekly': 'أسبوعي',
      'Monthly': 'شهري',
      'Hourly': 'بالساعة',
      'Custom': 'مخصص',
      'Shifts': 'شيفتات',
      'Shift': 'شيفتات'
    };
    
    return typeMap[typeValue] || typeValue;
  }

  getWorkRuleTypeClass(type: string | number): string {
    // Handle both string and number types for CSS classes
    const typeValue = typeof type === 'number' ? type.toString() : type;
    
    const typeMap: { [key: string]: string } = {
      '1': 'regular',
      '2': 'flexible', 
      '3': 'monthly',
      '4': 'hourly',
      '5': 'custom',
      '6': 'shift',
      'Daily': 'regular',
      'Weekly': 'flexible',
      'Monthly': 'monthly',
      'Hourly': 'hourly',
      'Custom': 'custom',
      'Shifts': 'shift',
      'Shift': 'shift'
    };
    
    return typeMap[typeValue] || typeValue.toLowerCase();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  }

  formatTime(timeString: string | undefined): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  }

  formatShiftRange(startTime?: string, endTime?: string): string {
    const start = this.formatTime(startTime) || '--:--';
    const end = this.formatTime(endTime) || '--:--';
    return `${start} - ${end}`;
  }

  openAssignShiftDialog(shift: ShiftDto): void {
    if (!this.workRuleDetails) {
      return;
    }

    const eligibleEmployees = this.getEligibleEmployeesForShift(shift);
    if (!eligibleEmployees.length) {
      this.dialog.open(NotificationDialogComponent, {
        panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
        width: '500px',
        maxWidth: '90vw',
        data: {
          title: this.translate.instant('ERROR.TITLE'),
          message: this.translate.instant('NoEligibleEmployeesForShift'),
          isSuccess: false
        }
      });
      return;
    }

    const dialogRef = this.dialog.open(AssignShiftDialogComponent, {
      panelClass: 'glass-dialog-panel',
      data: {
        shiftId: shift.id,
        shiftName: shift.name,
        availableEmployees: eligibleEmployees
      }
    });

    dialogRef.afterClosed().subscribe((selectedIds: number[] | null) => {
      if (selectedIds?.length) {
        this.assignEmployeesToShift(shift.id, selectedIds);
      }
    });
  }

  openCreateShiftDialog(): void {
    if (!this.workRuleDetails) {
      return;
    }

    const dialogRef = this.dialog.open(CreateShiftDialogComponent, {
      panelClass: 'glass-dialog-panel',
      width: '90vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      data: {
        workRuleName: this.workRuleDetails.category,
        workRuleOptions: [{ id: this.workRuleDetails.id, category: this.workRuleDetails.category }]
      }
    });

    dialogRef.afterClosed().subscribe((payload: CreateShiftDto | null) => {
      if (!payload) {
        return;
      }

      // Show loading dialog
      this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
        panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
        data: {
          title: this.translate.instant('LOADING.TITLE'),
          message: this.translate.instant('LOADING.CREATE_SHIFT'),
          isSuccess: true // Use true for loading state
        },
        disableClose: true // Prevent closing by clicking outside
      });

      this.financialService.createShift(payload).subscribe({
        next: response => {
          // Close loading dialog
          if (this.loadingDialogRef) {
            this.loadingDialogRef.close();
            this.loadingDialogRef = null;
          }

          if (response.isSuccess) {
            this.dialog.open(NotificationDialogComponent, {
              panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
              width: '500px',
              maxWidth: '90vw',
              data: {
                title: this.translate.instant('SUCCESS.TITLE'),
                message: this.translate.instant('SUCCESS.SHIFT_CREATED'),
                isSuccess: true
              }
            });
            this.loadWorkRuleDetails();
          } else {
            const errorMessage = this.localizeErrorMessage(response.message || 'ERROR.SHIFT_CREATED');
            this.dialog.open(NotificationDialogComponent, {
              panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
              width: '500px',
              maxWidth: '90vw',
              data: {
                title: this.translate.instant('ERROR.TITLE'),
                message: errorMessage,
                isSuccess: false
              }
            });
          }
        },
        error: error => {
          console.error('Error creating shift:', error);
          
          // Close loading dialog
          if (this.loadingDialogRef) {
            this.loadingDialogRef.close();
            this.loadingDialogRef = null;
          }

          const errorMessage = this.localizeErrorMessage(error?.error?.message || error?.message || 'ERROR.SHIFT_CREATED');
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            width: '500px',
            maxWidth: '90vw',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: errorMessage,
              isSuccess: false
            }
          });
        }
      });
    });
  }

  isUnassigningFromShift(shiftId: number, employeeId: number): boolean {
    const key = `${shiftId}-${employeeId}`;
    return this.unassigningFromShift.get(key) || false;
  }

  unassignEmployeeFromShift(shift: ShiftDto, employee: any): void {
    const confirmMessage = this.translate.instant('UnassignEmployeeFromShiftConfirm', { 
      employeeName: employee.name, 
      shiftName: shift.name 
    });
    
    const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      backdropClass: 'transparent-backdrop',
      data: {
        title: this.translate.instant('ConfirmDeletion'),
        message: confirmMessage,
        confirmButtonText: this.translate.instant('Unassign'),
        cancelButtonText: this.translate.instant('Cancel')
      }
    });

    confirmDialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const key = `${shift.id}-${employee.employeeId}`;
        this.unassigningFromShift.set(key, true);

        // Show loading dialog
        this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: this.translate.instant('LOADING.TITLE'),
            message: this.translate.instant('LOADING.UNASSIGN_EMPLOYEE_FROM_SHIFT'),
            isSuccess: true // Use true for loading state
          },
          disableClose: true // Prevent closing by clicking outside
        });

        this.financialService.unassignEmployeeFromShift(shift.id, employee.employeeId).subscribe({
          next: (response) => {
            this.unassigningFromShift.set(key, false);
            
            // Close loading dialog
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
              this.loadingDialogRef = null;
            }

            if (response.isSuccess) {
              this.dialog.open(NotificationDialogComponent, {
                panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
                width: '500px',
                maxWidth: '90vw',
                data: {
                  title: this.translate.instant('SUCCESS.TITLE'),
                  message: this.translate.instant('SUCCESS.UNASSIGN_EMPLOYEE_FROM_SHIFT'),
                  isSuccess: true
                }
              });
              // Reload work rule details to refresh the shift employees list
              this.loadWorkRuleDetails();
            } else {
              const errorMessage = this.localizeErrorMessage(response.message || 'ERROR.UNASSIGN_EMPLOYEE_FROM_SHIFT_FAILED');
              this.dialog.open(NotificationDialogComponent, {
                panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
                width: '500px',
                maxWidth: '90vw',
                data: {
                  title: this.translate.instant('ERROR.TITLE'),
                  message: errorMessage,
                  isSuccess: false
                }
              });
            }
          },
          error: (error) => {
            console.error('Error unassigning employee from shift:', error);
            this.unassigningFromShift.set(key, false);
            
            // Close loading dialog
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
              this.loadingDialogRef = null;
            }

            const errorMessage = this.localizeErrorMessage(error?.error?.message || error?.message || 'ERROR.UNASSIGN_EMPLOYEE_FROM_SHIFT_FAILED');
            this.dialog.open(NotificationDialogComponent, {
              panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
              width: '500px',
              maxWidth: '90vw',
              data: {
                title: this.translate.instant('ERROR.TITLE'),
                message: errorMessage,
                isSuccess: false
              }
            });
          }
        });
      }
    });
  }

  private getEligibleEmployeesForShift(shift: ShiftDto): AssignedEmployeeDto[] {
    const assignedIds = new Set((shift.employees ?? []).map(employee => employee.employeeId));
    return (this.workRuleDetails?.assignedEmployees ?? []).filter(employee => !assignedIds.has(employee.id));
  }

  private assignEmployeesToShift(shiftId: number, employeeIds: number[]): void {
    // Show loading dialog
    this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title: this.translate.instant('LOADING.TITLE'),
        message: this.translate.instant('LOADING.ASSIGN_SHIFT'),
        isSuccess: true // Use true for loading state
      },
      disableClose: true // Prevent closing by clicking outside
    });

    const assignments = employeeIds.map(employeeId =>
      this.financialService.assignEmployeeToShift(shiftId, employeeId).pipe(
        map(response => ({ isSuccess: response.isSuccess, message: response.message })),
        catchError(error => {
          console.error('Error assigning employee to shift:', error);
          return of({ isSuccess: false, message: error?.error?.message || error.message || '' });
        })
      )
    );

    forkJoin(assignments).subscribe(results => {
      // Close loading dialog
      if (this.loadingDialogRef) {
        this.loadingDialogRef.close();
        this.loadingDialogRef = null;
      }

      const failed = results.find(result => !result.isSuccess);
      if (failed) {
        const errorMessage = this.localizeErrorMessage(failed.message || 'ERROR.SHIFT_ASSIGNMENT_FAILED');
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          width: '500px',
          maxWidth: '90vw',
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: errorMessage,
            isSuccess: false
          }
        });
      } else {
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          width: '500px',
          maxWidth: '90vw',
          data: {
            title: this.translate.instant('SUCCESS.TITLE'),
            message: this.translate.instant('SUCCESS.SHIFT_ASSIGNMENT'),
            isSuccess: true
          }
        });
      }
      this.loadWorkRuleDetails();
    });
  }

  getSalaryTypeLabel(type: string | undefined): string {
    if (!type) return '';
    const typeMap: { [key: string]: string } = {
      'PerDay': 'Per Day',
      'PerMonth': 'Per Month',
      'PerHour': 'Per Hour',
      'Custom': 'Custom'
    };
    return this.translate.instant(`SalaryType.${type}`) || typeMap[type] || type;
  }

  unassignEmployee(employee: AssignedEmployeeDto): void {
    const confirmMessage = this.translate.instant('UnassignEmployeeConfirm');
    const employeeName = employee.name;
    
    const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      backdropClass: 'transparent-backdrop',
      data: {
        title: this.translate.instant('ConfirmDeletion'),
        message: `${confirmMessage}\n\n${this.translate.instant('Employee')}: ${employeeName}`,
        confirmButtonText: this.translate.instant('Confirm'),
        cancelButtonText: this.translate.instant('Cancel')
      }
    });

    confirmDialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // Show loading dialog
        this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: this.translate.instant('LOADING.TITLE'),
            message: this.translate.instant('LOADING.UNASSIGN_EMPLOYEE'),
            isSuccess: true // Use true for loading state
          },
          disableClose: true // Prevent closing by clicking outside
        });

        this.financialService.unassignWorkRule(this.workRuleId, {
          employeeIds: [employee.id]
        }).subscribe({
          next: (response) => {
            // Close loading dialog
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
              this.loadingDialogRef = null;
            }

            if (response.isSuccess) {
              this.dialog.open(NotificationDialogComponent, {
                panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
                width: '500px',
                maxWidth: '90vw',
                data: {
                  title: this.translate.instant('SUCCESS.TITLE'),
                  message: this.translate.instant('UnassignEmployeeSuccess'),
                  isSuccess: true
                }
              });
              // Reload the work rule details to refresh the employee list
              this.loadWorkRuleDetails();
            } else {
              const errorMessage = this.localizeErrorMessage(response.message || 'UnassignEmployeeError');
              this.dialog.open(NotificationDialogComponent, {
                panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
                width: '500px',
                maxWidth: '90vw',
                data: {
                  title: this.translate.instant('ERROR.TITLE'),
                  message: errorMessage,
                  isSuccess: false
                }
              });
            }
          },
          error: (error) => {
            console.error('Error unassigning employee:', error);
            
            // Close loading dialog
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
              this.loadingDialogRef = null;
            }

            const errorMessage = this.localizeErrorMessage(error?.error?.message || error?.message || 'UnassignEmployeeError');
            this.dialog.open(NotificationDialogComponent, {
              panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
              width: '500px',
              maxWidth: '90vw',
              data: {
                title: this.translate.instant('ERROR.TITLE'),
                message: errorMessage,
                isSuccess: false
              }
            });
          }
        });
      }
    });
  }

  private localizeErrorMessage(message: string): string {
    if (!message) {
      return this.translate.instant('ERROR.UNKNOWN_ERROR');
    }

    // Map common error messages to translation keys
    const errorMap: { [key: string]: string } = {
      'Internal server error': 'InternalServerError',
      'Internal Server Error': 'InternalServerError',
      'INTERNAL_SERVER_ERROR': 'InternalServerError',
      'EmployeeAlreadyAssignedAnotherShift': 'ERROR.EMPLOYEE_ALREADY_ASSIGNED_ANOTHER_SHIFT',
      'Employee already assigned to another shift': 'ERROR.EMPLOYEE_ALREADY_ASSIGNED_ANOTHER_SHIFT'
    };

    // Check if message matches any known error
    const normalizedMessage = message.trim();
    const translationKey = errorMap[normalizedMessage];

    if (translationKey) {
      return this.translate.instant(translationKey);
    }

    // Try to translate if it's already a translation key
    const translated = this.translate.instant(normalizedMessage);
    if (translated !== normalizedMessage) {
      return translated;
    }

    // If message contains "Internal server error" or similar, use the translation
    if (normalizedMessage.toLowerCase().includes('internal server error')) {
      return this.translate.instant('InternalServerError');
    }

    // If message contains "EmployeeAlreadyAssignedAnotherShift", use the translation
    if (normalizedMessage.includes('EmployeeAlreadyAssignedAnotherShift') || 
        normalizedMessage.toLowerCase().includes('employee already assigned')) {
      return this.translate.instant('ERROR.EMPLOYEE_ALREADY_ASSIGNED_ANOTHER_SHIFT');
    }

    // Return the message as-is if no translation found
    return normalizedMessage;
  }

  getLocalizedWarnings(warnings: string[] | undefined): string[] {
    if (!warnings || warnings.length === 0) {
      return [];
    }

    return warnings.map(warning => {
      // Check if the warning matches the pattern "Employees missing shift assignment: name1, name2, ..."
      const missingShiftPattern = /^Employees missing shift assignment:\s*(.+)$/i;
      const match = warning.match(missingShiftPattern);
      
      if (match) {
        // Extract the employee names
        const names = match[1].trim();
        // Use the translation key with the names as parameter
        return this.translate.instant('ERROR.EMPLOYEES_MISSING_SHIFT', { names });
      }
      
      // If no pattern matches, return the warning as-is (it might already be localized or in a different format)
      return warning;
    });
  }
}
