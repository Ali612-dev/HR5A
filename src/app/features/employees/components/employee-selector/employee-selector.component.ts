import { Component, EventEmitter, OnInit, Output, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { EmployeeService } from '../../../../core/employee.service';

@Component({
  selector: 'app-employee-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="employee-selector-container">
      <!-- Search Row -->
      <div class="search-row d-flex gap-2 mb-3">
        <input class="form-control soft-input" [(ngModel)]="name" (ngModelChange)="load()" [placeholder]="'Search' | translate">
        <input class="form-control soft-input" [(ngModel)]="phone" (ngModelChange)="load()" [placeholder]="'Phone' | translate">
        <input class="form-control soft-input" [(ngModel)]="department" (ngModelChange)="load()" [placeholder]="'Department' | translate">
        <button class="btn btn-secondary btn-sm" (click)="clearFilters()">{{ 'Clear' | translate }}</button>
      </div>

      <!-- Filter Row -->
      <div class="filter-row d-flex gap-2 mb-3 align-items-center">
        <label class="filter-label">{{ 'Status' | translate }}:</label>
        <select class="form-select soft-input" [(ngModel)]="isActiveString" (ngModelChange)="onStatusChange($event)">
          <option value="all">{{ 'All' | translate }}</option>
          <option value="true">{{ 'Active' | translate }}</option>
          <option value="false">{{ 'Inactive' | translate }}</option>
        </select>

        <label class="filter-label">{{ 'Sort By' | translate }}:</label>
        <select class="form-select soft-input" [(ngModel)]="sortField" (ngModelChange)="load()">
          <option value="name">{{ 'Name' | translate }}</option>
          <option value="phone">{{ 'Phone' | translate }}</option>
          <option value="department">{{ 'Department' | translate }}</option>
        </select>

        <select class="form-select soft-input" [(ngModel)]="sortOrder" (ngModelChange)="load()">
          <option value="asc">{{ 'Asc' | translate }}</option>
          <option value="desc">{{ 'Desc' | translate }}</option>
        </select>

        <label class="filter-label">{{ 'Per Page' | translate }}:</label>
        <select class="form-select soft-input" [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange()">
          <option [ngValue]="10">10</option>
          <option [ngValue]="20">20</option>
          <option [ngValue]="50">50</option>
        </select>

        <button class="btn btn-primary btn-sm" (click)="load()">{{ 'Refresh' | translate }}</button>
      </div>
      
      <div class="table-wrapper">
        <div class="table-responsive glass-table">
          <table class="table table-dark table-borderless align-middle">
            <thead>
              <tr>
                <th style="width:50px; text-align: center;" *ngIf="!singleSelection"><input type="checkbox" [checked]="allSelected" (change)="toggleAll($event)"></th>
                <th>{{ 'Name' | translate }}</th>
                <th>{{ 'Phone' | translate }}</th>
                <th>{{ 'Department' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of employees">
                <td style="text-align: center;" *ngIf="!singleSelection"><input type="checkbox" [checked]="selected.has(e.id)" (change)="toggle(e.id, $event)"></td>
                <td style="text-align: center;" *ngIf="singleSelection"><input type="radio" [checked]="selected.has(e.id)" (change)="selectSingle(e.id, $event)"></td>
                <td>{{ e.name || e.fullName }}</td>
                <td>{{ e.phone || e.phoneNumber }}</td>
                <td>{{ e.department }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Pagination Row -->
      <div class="pagination-row d-flex justify-content-between align-items-center">
        <div class="pagination-info">
          <small class="text-muted">{{ 'Selected' | translate }}: {{ singleSelection ? (selected.size > 0 ? '1' : '0') : selected.size }}</small>
          <small class="text-muted ms-3">{{ 'Page' | translate }} {{ page }} {{ 'of' | translate }} {{ totalPages }}</small>
        </div>
        <div class="pagination-controls d-flex gap-1">
          <button class="btn btn-secondary btn-sm" (click)="prev()" [disabled]="page===1">{{ 'Prev' | translate }}</button>
          <button class="btn btn-secondary btn-sm" (click)="next()" [disabled]="page>=totalPages">{{ 'Next' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .employee-selector-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 400px;
    }
    .table-wrapper {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      margin-bottom: 1rem;
    }
    .search-row { 
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .search-row .form-control { 
      flex: 1; 
      min-width: 150px; 
      background: #ffffff;
      border: 1px solid #ced4da;
      color: #495057;
      border-radius: 6px;
      padding: 0.6rem 0.8rem;
      font-size: 0.9rem;
    }
    .search-row .form-control:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    }
    .search-row .form-control::placeholder { 
      color: #6c757d; 
    }
    .search-row .btn {
      background: #6c757d;
      border: 1px solid #6c757d;
      color: white;
      border-radius: 6px;
      padding: 0.6rem 1.2rem;
      font-weight: 500;
      font-size: 0.9rem;
    }
    .search-row .btn:hover {
      background: #5a6268;
      border-color: #545b62;
    }
    
    .filter-row { 
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
    }
    .filter-row .form-select { 
      min-width: 120px; 
      background: #ffffff;
      border: 1px solid #ced4da;
      color: #495057;
      border-radius: 6px;
      padding: 0.5rem 0.7rem;
      font-size: 0.9rem;
    }
    .filter-row .form-select:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    }
    .filter-label { 
      color: #495057; 
      font-size: 0.9rem; 
      margin: 0 0.5rem 0 0; 
      white-space: nowrap; 
      font-weight: 600;
    }
    .filter-row .btn {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border: none;
      color: white;
      border-radius: 6px;
      padding: 0.5rem 1rem;
      font-weight: 500;
      font-size: 0.9rem;
    }
    .filter-row .btn:hover {
      background: linear-gradient(135deg, #5a6fd8, #6a4190);
    }
    
    .glass-table { 
      background: #ffffff;
      border: 1px solid #e9ecef;
      border-radius: 8px; 
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      max-height: 300px;
      overflow-y: auto;
    }
    thead th { 
      color: #495057; 
      border-bottom: 2px solid #e9ecef;
      background: #f8f9fa;
      padding: 1rem 0.75rem;
      font-weight: 600;
      font-size: 0.9rem;
    }
    thead th:first-child {
      text-align: center;
    }
    tbody td {
      padding: 0.875rem 0.75rem;
      border-bottom: 1px solid #f1f3f4;
      color: #495057;
      font-size: 0.9rem;
    }
    tbody td:first-child {
      text-align: center;
    }
    tbody td input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #667eea;
      transform: scale(1.2);
    }
    thead th input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #667eea;
      transform: scale(1.2);
    }
    input[type="checkbox"] {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      width: 18px;
      height: 18px;
      border: 2px solid #ced4da;
      border-radius: 3px;
      background: #ffffff;
      position: relative;
      cursor: pointer;
    }
    input[type="checkbox"]:checked {
      background: #667eea;
      border-color: #667eea;
    }
    input[type="checkbox"]:checked::after {
      content: '✓';
      position: absolute;
      top: -2px;
      left: 2px;
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
    input[type="radio"] {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      width: 18px;
      height: 18px;
      border: 2px solid #ced4da;
      border-radius: 50%;
      background: #ffffff;
      position: relative;
      cursor: pointer;
    }
    input[type="radio"]:checked {
      background: #667eea;
      border-color: #667eea;
    }
    input[type="radio"]:checked::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: white;
    }
    tbody tr:hover { 
      background: #f8f9fa; 
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    
    .pagination-row {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-top: 1.5rem;
      position: relative;
    }
    .pagination-info { 
      display: flex; 
      align-items: center; 
      gap: 1rem;
    }
    .pagination-info small {
      color: #6c757d;
      font-weight: 500;
      font-size: 0.9rem;
    }
    .pagination-controls .btn {
      background: #ffffff;
      border: 1px solid #ced4da;
      color: #495057;
      border-radius: 6px;
      padding: 0.5rem 0.8rem;
      font-weight: 500;
      font-size: 0.9rem;
    }
    .pagination-controls .btn:hover {
      background: #e9ecef;
      border-color: #adb5bd;
    }
    .pagination-controls .btn:disabled {
      background: #f8f9fa;
      color: #adb5bd;
      border-color: #e9ecef;
    }
  `]
})
export class EmployeeSelectorComponent implements OnInit {
  private employeeService = inject(EmployeeService);

  @Input() singleSelection = false;

  employees: any[] = [];
  page = 1;
  pageSize = 10;
  totalPages = 1;

  name = '';
  phone = '';
  department = '';
  isActive: boolean | null = null;
  isActiveString: 'all' | 'true' | 'false' = 'all';
  sortField: 'name' | 'phone' | 'department' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  selected = new Set<number>();
  allSelected = false;

  @Output() selectedChange = new EventEmitter<number[]>();
  @Output() selectedEmployeesChange = new EventEmitter<any[]>();

  ngOnInit(): void { this.load(); }

  load(): void {
    this.employeeService.getAllEmployees({
      pageNumber: this.page,
      pageSize: this.pageSize,
      name: this.name,
      phone: this.phone,
      department: this.department,
      isActive: this.isActive ?? undefined,
      sortField: this.sortField,
      sortOrder: this.sortOrder
    }).subscribe(res => {
      if (res.isSuccess && res.data) {
        const payload: any = res.data as any;
        // API shape: { employees: EmployeeDto[], totalCount }
        this.employees = payload.employees || payload.data || [];
        const totalCount = payload.totalCount || (Array.isArray(this.employees) ? this.employees.length : 0);
        this.totalPages = Math.max(1, Math.ceil(totalCount / this.pageSize));
        this.syncAllSelected();
      }
    });
  }

  onStatusChange(value: 'all'|'true'|'false'): void {
    this.isActiveString = value;
    this.isActive = value === 'all' ? null : value === 'true';
    this.page = 1;
    this.load();
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.load();
  }

  clearFilters(): void {
    this.name = '';
    this.phone = '';
    this.department = '';
    this.isActive = null;
    this.isActiveString = 'all';
    this.sortField = 'name';
    this.sortOrder = 'asc';
    this.page = 1;
    this.load();
  }

  toggle(id: number, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    checked ? this.selected.add(id) : this.selected.delete(id);
    this.syncAllSelected();
    this.emitSelectedData();
  }

  selectSingle(id: number, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (checked) {
      this.selected.clear();
      this.selected.add(id);
    }
    this.emitSelectedData();
  }

  toggleAll(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.allSelected = checked;
    if (checked) this.employees.forEach(e => this.selected.add(e.id));
    else this.selected.clear();
    this.emitSelectedData();
  }

  emitSelectedData(): void {
    const selectedIds = Array.from(this.selected);
    const selectedEmployees = this.employees.filter(e => this.selected.has(e.id));
    this.selectedChange.emit(selectedIds);
    this.selectedEmployeesChange.emit(selectedEmployees);
  }

  syncAllSelected(): void { this.allSelected = this.employees.length>0 && this.employees.every(e => this.selected.has(e.id)); }
  prev(): void { if (this.page>1) { this.page--; this.load(); } }
  next(): void { if (this.page<this.totalPages) { this.page++; this.load(); } }
}

