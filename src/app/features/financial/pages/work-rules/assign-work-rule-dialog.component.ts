import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { EmployeeSelectorComponent } from '../../../employees/components/employee-selector/employee-selector.component';

interface AssignDialogData { 
  workRuleId: number | null; 
  isForNewRule?: boolean; 
}

@Component({
  selector: 'app-assign-work-rule-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, EmployeeSelectorComponent],
  template: `
    <div class="assign-dialog">
      <div class="dialog-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">{{ 'Assign' | translate }}</h5>
        <small class="text-muted">
          {{ data.isForNewRule ? ('SelectedEmployee' | translate) : ('Selected' | translate) }}: 
          {{ data.isForNewRule ? (selectedEmployee ? '1' : '0') : selected.size }}
        </small>
      </div>

      <div class="dialog-body">
        <app-employee-selector 
          [singleSelection]="data.isForNewRule || false"
          (selectedChange)="onSelected($event)" 
          (selectedEmployeesChange)="onSelectedEmployees($event)">
        </app-employee-selector>
      </div>

      <div class="dialog-actions d-flex justify-content-end mt-3">
        <button class="btn btn-secondary me-2" (click)="close()">{{ 'Cancel' | translate }}</button>
        <button class="btn btn-primary" (click)="confirm()" [disabled]="!canConfirm()">{{ 'Assign' | translate }}</button>
      </div>
    </div>
  `,
  styles: [`
    .assign-dialog { 
      min-width: 1200px; 
      max-width: 100%; 
      background: #f3f4f6;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
    }
    .dialog-header { 
      background: #ffffff;
      border-bottom: 1px solid rgba(209, 213, 219, 0.8);
      padding: 1.5rem 2rem; 
      margin-bottom: 0;
    }
    .dialog-header h5 {
      color: #1f2937;
      font-weight: 600;
      margin: 0;
      font-size: 1.25rem;
    }
    .dialog-header small {
      color: #6b7280;
      font-weight: 500;
      font-size: 0.9rem;
    }
    .dialog-body { 
      background: #ffffff;
      padding: 2rem; 
      min-height: 400px;
      max-height: 60vh;
      overflow-y: auto;
    }
    .dialog-actions { 
      background: #ffffff;
      border-top: 1px solid rgba(209, 213, 219, 0.8);
      padding: 1.5rem 2rem;
      margin-top: 0;
    }
    .dialog-actions .btn { 
      min-width: 140px; 
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    }
    .dialog-actions .btn-primary {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.2)) !important;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(249, 115, 22, 0.4) !important;
      color: #f97316 !important;
      position: relative;
      overflow: hidden;
    }
    .dialog-actions .btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transition: left 0.5s ease;
    }
    .dialog-actions .btn-primary:hover {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(234, 88, 12, 0.3)) !important;
      border-color: rgba(249, 115, 22, 0.6) !important;
      color: #ea580c !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
    }
    .dialog-actions .btn-primary:hover::before {
      left: 100%;
    }
    .dialog-actions .btn-secondary {
      background: #ffffff !important;
      border: 1px solid rgba(209, 213, 219, 0.8) !important;
      color: #1f2937 !important;
    }
    .dialog-actions .btn-secondary:hover {
      background: #f9fafb !important;
      border-color: rgba(156, 163, 175, 0.8) !important;
      color: #1f2937 !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
  `]
})
export class AssignWorkRuleDialogComponent implements OnInit {
  private translate = inject(TranslateService);

  selected = new Set<number>();
  selectedEmployee: any = null;
  allEmployees: any[] = [];

  constructor(
    private ref: MatDialogRef<AssignWorkRuleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignDialogData
  ) {}

  ngOnInit(): void {
    // employees load via embedded selector
  }

  onSelected(ids: number[]): void { 
    this.selected = new Set(ids); 
  }

  onSelectedEmployees(employees: any[]): void {
    // For new rule, we need exactly one employee
    if (this.data.isForNewRule && employees.length === 1) {
      this.selectedEmployee = employees[0];
    } else if (this.data.isForNewRule && employees.length === 0) {
      this.selectedEmployee = null;
    }
  }


  canConfirm(): boolean {
    if (this.data.isForNewRule) {
      return this.selectedEmployee !== null;
    } else {
      return this.selected.size > 0;
    }
  }

  close(): void { this.ref.close(null); }
  
  confirm(): void { 
    if (this.data.isForNewRule) {
      this.ref.close(this.selectedEmployee);
    } else {
      this.ref.close(Array.from(this.selected));
    }
  }
}

