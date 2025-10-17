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
      background: #f8f9fa;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .dialog-header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-bottom: none;
      padding: 1.5rem 2rem; 
      margin-bottom: 0;
    }
    .dialog-header h5 {
      color: white;
      font-weight: 600;
      margin: 0;
      font-size: 1.25rem;
    }
    .dialog-header small {
      color: rgba(255, 255, 255, 0.9);
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
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
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
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .dialog-actions .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border: none;
      color: white;
    }
    .dialog-actions .btn-primary:hover {
      background: linear-gradient(135deg, #5a6fd8, #6a4190);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
    }
    .dialog-actions .btn-secondary {
      background: #6c757d;
      border: 1px solid #6c757d;
      color: white;
    }
    .dialog-actions .btn-secondary:hover {
      background: #5a6268;
      border-color: #545b62;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
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

