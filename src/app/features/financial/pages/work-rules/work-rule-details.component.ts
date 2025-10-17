import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialog } from '@angular/material/dialog';
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
  faUserMinus
} from '@fortawesome/free-solid-svg-icons';

import { FinancialService } from '../../../../core/services/financial.service';
import { WorkRuleDetailsDto, AssignedEmployeeDto } from '../../../../core/interfaces/financial.interface';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { catchError, of } from 'rxjs';

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
                  <h2 class="text-white mb-1">
                    <fa-icon [icon]="faEye" class="me-2"></fa-icon>
                    {{ 'WorkRuleDetails' | translate }}
                  </h2>
                  <p class="text-white-50 mb-0" *ngIf="workRuleDetails">
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
                    </div>
                  </div>
                  <div class="rule-stats">
                    <div class="stat-item">
                      <div class="stat-number">{{ workRuleDetails.totalAssignedEmployees }}</div>
                      <div class="stat-label">{{ 'TotalEmployees' | translate }}</div>
                    </div>
                  </div>
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      padding: 32px;
    }

    /* Header Styles */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 15px;
      padding: 2rem 2.5rem;
      margin-bottom: 2rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .header-title h2 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: #fff !important;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .header-title p {
      font-size: 1rem;
      opacity: 0.9;
      margin: 0;
      color: rgba(255, 255, 255, 0.8) !important;
    }

    .work-rule-type-text {
      font-size: 0.9rem;
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #667eea, #764ba2) !important;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      font-weight: 600;
      color: white !important;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
      display: inline-block;
    }

    .work-rule-type-text:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    /* Main Card */
    .main-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 2rem;
      color: #fff;
      box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.4);
    }

    /* Work Rule Header */
    .work-rule-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      margin-bottom: 2rem;
    }

    .rule-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: #fff;
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

    .rule-stats .stat-item {
      text-align: center;
    }

    .rule-stats .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: #C084FC;
      margin-bottom: 0.25rem;
    }

    .rule-stats .stat-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .info-card, .stats-card, .off-days-card {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 15px;
      padding: 1.5rem;
    }

    .card-title {
      color: #C084FC;
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
    }

    /* Info List */
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item .label {
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
      font-size: 0.9rem;
    }

    .info-item .value {
      color: #fff;
      font-weight: 600;
      font-size: 1rem;
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
      color: #fff;
      margin-bottom: 0.25rem;
    }

    .stat-info .stat-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.85rem;
    }

    /* Off Days */
    .off-days-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .off-day-item {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 15px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    /* Description Section */
    .description-section {
      margin-bottom: 2rem;
    }

    .section-title {
      color: #C084FC;
      font-weight: 600;
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }

    .description-text {
      color: #fff;
      font-size: 1rem;
      line-height: 1.6;
      background: rgba(255, 255, 255, 0.08);
      padding: 1.5rem;
      border-radius: 10px;
      border-left: 4px solid #C084FC;
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
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 15px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Employees Table */
    .employees-table {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 15px;
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr 1fr 1.2fr;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: rgba(255, 255, 255, 0.1);
      font-weight: 600;
      color: #C084FC;
      font-size: 0.9rem;
    }

    .table-body {
      max-height: 400px;
      overflow-y: auto;
    }

    .employee-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr 1fr 1.2fr;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      align-items: center;
    }

    .employee-row:last-child {
      border-bottom: none;
    }

    .employee-row:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .employee-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .employee-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
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
      color: #fff;
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }

    .employee-id {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.8rem;
    }

    .col-phone, .col-department, .col-salary, .col-actions {
      color: #fff;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
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
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 1rem;
    }

    .empty-text {
      color: rgba(255, 255, 255, 0.7);
      font-size: 1rem;
    }

    /* Button Styles */
    .btn-ghost {
      background: rgba(255, 255, 255, 0.15) !important;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.25) !important;
      color: white !important;
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
      background: rgba(255, 255, 255, 0.25) !important;
      border-color: rgba(255, 255, 255, 0.4) !important;
      transform: translateY(-3px);
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

  // Data properties
  workRuleDetails: WorkRuleDetailsDto | null = null;
  isLoading = true;
  error: string | null = null;

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
      '1': 'Regular',
      '2': 'Flexible', 
      '3': 'Shift',
      '4': 'Hourly',
      '5': 'Custom',
      'Regular': 'Regular',
      'Flexible': 'Flexible',
      'Shift': 'Shift',
      'Hourly': 'Hourly',
      'Custom': 'Custom'
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
      '1': 'عادي',
      '2': 'مرن', 
      '3': 'نوبات',
      'Regular': 'عادي',
      'Flexible': 'مرن',
      'Shift': 'نوبات'
    };
    
    return typeMap[typeValue] || typeValue;
  }

  getWorkRuleTypeClass(type: string | number): string {
    // Handle both string and number types for CSS classes
    const typeValue = typeof type === 'number' ? type.toString() : type;
    
    const typeMap: { [key: string]: string } = {
      '1': 'regular',
      '2': 'flexible', 
      '3': 'shift',
      'Regular': 'regular',
      'Flexible': 'flexible',
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
    
    if (confirm(`${confirmMessage}\n\nEmployee: ${employeeName}`)) {
      this.financialService.unassignWorkRule(this.workRuleId, {
        employeeIds: [employee.id]
      }).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            // Show success message
            alert(this.translate.instant('UnassignEmployeeSuccess'));
            // Reload the work rule details to refresh the employee list
            this.loadWorkRuleDetails();
          } else {
            // Show error message
            alert(this.translate.instant('UnassignEmployeeError') + ': ' + (response.message || 'Unknown error'));
          }
        },
        error: (error) => {
          console.error('Error unassigning employee:', error);
          alert(this.translate.instant('UnassignEmployeeError') + ': ' + (error.message || 'Unknown error'));
        }
      });
    }
  }
}
