import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faFilter } from '@fortawesome/free-solid-svg-icons';

import { EmployeeAttendanceHistoryStore } from '../../../../store/employee-attendance-history.store';
import { ResponsiveAttendanceTableComponent } from '../../../../shared/components/responsive-attendance-table/responsive-attendance-table.component';

@Component({
  selector: 'app-employee-history',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    RouterLink,
    ResponsiveAttendanceTableComponent
  ],
  templateUrl: './employee-history.component.html',
  styleUrls: ['./employee-history.component.css']
})
export class EmployeeHistoryComponent implements OnInit {
  readonly store = inject(EmployeeAttendanceHistoryStore);
  filterForm!: FormGroup;

  faArrowLeft = faArrowLeft;
  faFilter = faFilter;

  isFilterCollapsed: boolean = true;

  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    const employeeId = this.route.snapshot.paramMap.get('employeeId');
    if (employeeId) {
      this.store.setEmployeeId(Number(employeeId));
    }

    this.filterForm = this.fb.group({
      startDate: [this.store.request().startDate || null],
      endDate: [this.store.request().endDate || null]
    });

    this.store.loadEmployeeAttendanceHistory();

    this.filterForm.valueChanges.subscribe(() => {
      this.onFilter();
    });
  }

  onFilter(): void {
    const startDateValue = this.filterForm.get('startDate')?.value;
    const endDateValue = this.filterForm.get('endDate')?.value;

    this.store.updateRequest({
      startDate: startDateValue ? new Date(startDateValue).toISOString().split('T')[0] : null,
      endDate: endDateValue ? new Date(endDateValue).toISOString().split('T')[0] : null,
      pageNumber: 1
    });
  }

  onResetFilters(): void {
    this.filterForm.reset({
      startDate: null,
      endDate: null
    });
    this.onFilter();
  }

  toggleFilter(): void {
    this.isFilterCollapsed = !this.isFilterCollapsed;
  }

  onPageChange(pageNumber: number): void {
    this.store.updateRequest({ pageNumber });
  }

  onSort(sortField: string): void {
    const currentSortField = this.store.request().sortField;
    const currentSortOrder = this.store.request().sortOrder;

    const sortOrder = currentSortField === sortField && currentSortOrder === 'asc' ? 'desc' : 'asc';
    this.store.updateRequest({ sortField, sortOrder });
  }
}
