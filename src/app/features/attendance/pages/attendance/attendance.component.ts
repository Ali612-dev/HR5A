import { Component, OnInit, inject, computed, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faFilter } from '@fortawesome/free-solid-svg-icons';

import { AttendanceStore } from '../../../../store/attendance.store';
import { AttendanceViewModel } from '../../../../core/interfaces/attendance.interface';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { ErrorDialogComponent } from '../../../../shared/components/error-dialog/error-dialog.component';
import { DeleteAttendanceStore } from '../../../../store/delete-attendance.store'; // Reusing for now, will create specific attendance delete store later
import { effect } from '@angular/core';
import { ResponsiveAttendanceTableComponent } from '../../../../shared/components/responsive-attendance-table/responsive-attendance-table.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    RouterLink,
    ResponsiveAttendanceTableComponent,
    PaginationComponent
  ],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css']
})
export class AttendanceComponent implements OnInit, OnDestroy {
  readonly store = inject(AttendanceStore);
  filterForm!: FormGroup;

  faPlus = faPlus;
  faFilter = faFilter;

  isFilterCollapsed: boolean = true;

  private loadingDialogRef: any; // Declare loadingDialogRef

  readonly deleteStore = inject(DeleteAttendanceStore);
  private dialog = inject(MatDialog);

  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);
  private destroy$ = new Subject<void>();
  private translate = inject(TranslateService);

  filteredAttendances = computed(() => {
    const attendances = this.store.attendances();
    const employeeNameFilter = this.filterForm.get('employeeName')?.value?.toLowerCase();

    if (employeeNameFilter) {
      return attendances.filter(att => att.employeeName.toLowerCase().includes(employeeNameFilter));
    }

    return attendances;
  });

  constructor() {
    effect(() => {
      console.log('Delete Store State:', this.deleteStore.isLoading(), this.deleteStore.isSuccess(), this.deleteStore.error());

      if (this.deleteStore.isLoading()) {
        // Close any existing dialog before opening a new loading dialog
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
          this.loadingDialogRef = undefined;
        }
        this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
          panelClass: 'glass-dialog-panel',
          data: {
            title: this.translate.instant('LOADING.TITLE'),
            message: this.translate.instant('LOADING.DELETE_ATTENDANCE'),
            isSuccess: true // Use true for loading state to show spinner if implemented
          },
          disableClose: true // Prevent closing by clicking outside
        });
      } else if (this.loadingDialogRef) {
        // Close loading dialog when isLoading becomes false
        this.loadingDialogRef.close();
        this.loadingDialogRef = undefined;

        if (this.deleteStore.isSuccess()) {
          this.store.loadDailyAttendances(); // Reload attendances after delete
          this.dialog.open(NotificationDialogComponent, {
            panelClass: 'glass-dialog-panel',
            data: {
              title: this.translate.instant('SUCCESS.TITLE'),
              message: this.translate.instant('SUCCESS.DELETE_ATTENDANCE'),
              isSuccess: true
            }
          });
          this.deleteStore.resetState();
        } else if (this.deleteStore.error()) {
          this.dialog.open(ErrorDialogComponent, {
            panelClass: 'glass-dialog-panel',
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: this.deleteStore.error()
            }
          });
          this.deleteStore.resetState();
        }
      }
    });
  }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      date: [this.store.request().date || null],
      employeeName: ['']
    });

    this.store.loadDailyAttendances();

    this.filterForm.get('employeeName')?.valueChanges.pipe(
      debounceTime(300), // Wait for 300ms after the last keystroke
      distinctUntilChanged(), // Only emit if the value has changed
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // The computed signal `filteredAttendances` will automatically react to changes
      // No explicit action needed here other than triggering change detection if necessary
    });

    this.filterForm.get('date')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.onFilter();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilter(): void {
    const dateValue = this.filterForm.get('date')?.value;
    this.store.updateRequest({ date: dateValue ? new Date(dateValue).toISOString().split('T')[0] : undefined, pageNumber: 1 });

    // Explicitly trigger re-evaluation of employeeName filter
    const currentEmployeeName = this.filterForm.get('employeeName')?.value;
    this.filterForm.get('employeeName')?.setValue(currentEmployeeName, { emitEvent: true });
  }

  onResetFilters(): void {
    this.filterForm.reset({
      date: null,
      employeeName: ''
    });
    this.onFilter(); // Re-apply date filter after reset
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

  onDelete(attendance: AttendanceViewModel): void {
    const formattedDate = this.datePipe.transform(attendance.date, 'shortDate');
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      backdropClass: 'transparent-backdrop',
      data: {
        title: this.translate.instant('ConfirmDeletion'),
        message: this.translate.instant('DeleteConfirmation', { employeeName: attendance.employeeName, date: formattedDate }),
        confirmButtonText: this.translate.instant('Delete'),
        cancelButtonText: this.translate.instant('Cancel')
      }
    });
    console.log('Confirmation Dialog Message:', this.translate.instant('DeleteConfirmation', { employeeName: attendance.employeeName, date: formattedDate }));

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deleteStore.deleteAttendance(attendance.id);
      }
    });
  }

  onRetryLoadAttendances(): void {
    this.store.loadDailyAttendances();
  }
}