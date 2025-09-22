import { Component, OnInit, inject, computed, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faFilter, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

import { AttendanceStore } from '../../../../store/attendance.store';
import { AttendanceViewModel } from '../../../../core/interfaces/attendance.interface';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { ErrorDialogComponent } from '../../../../shared/components/error-dialog/error-dialog.component';
import { DeleteAttendanceStore } from '../../../../store/delete-attendance.store'; // Reusing for now, will create specific attendance delete store later
import { effect } from '@angular/core';
import { ResponsiveAttendanceTableComponent } from '../../../../shared/components/responsive-attendance-table/responsive-attendance-table.component';
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
    ResponsiveAttendanceTableComponent
  ],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css']
})
export class AttendanceComponent implements OnInit, OnDestroy {
  readonly store = inject(AttendanceStore);
  private router = inject(Router);
  filterForm!: FormGroup;

  faPlus = faPlus;
  faFilter = faFilter;
  faMapMarkerAlt = faMapMarkerAlt;

  isFilterCollapsed: boolean = true;
  isMobile: boolean = false;

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
    // Detect mobile device
    this.isMobile = window.innerWidth <= 768;
    console.log('📱 Mobile detection:', this.isMobile, 'Screen width:', window.innerWidth);
    
    // Listen for window resize to update mobile state
    window.addEventListener('resize', this.resizeHandler);

    // Restore saved state from localStorage
    const savedState = this.getSavedAttendanceState();
    
    this.filterForm = this.fb.group({
      date: [savedState.date || this.store.request().date || null],
      employeeName: [savedState.employeeName || '']
    });

    // Restore filter collapsed state
    this.isFilterCollapsed = savedState.isFilterCollapsed !== undefined ? savedState.isFilterCollapsed : true;

    // Restore pagination and sorting if available
    if (savedState.pageNumber) {
      this.store.updateRequest({ pageNumber: savedState.pageNumber });
    }
    if (savedState.sortField && savedState.sortOrder) {
      this.store.updateRequest({ 
        sortField: savedState.sortField, 
        sortOrder: savedState.sortOrder 
      });
    }

    this.store.loadDailyAttendances();

    this.filterForm.get('employeeName')?.valueChanges.pipe(
      debounceTime(300), // Wait for 300ms after the last keystroke
      distinctUntilChanged(), // Only emit if the value has changed
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // The computed signal `filteredAttendances` will automatically react to changes
      // Save state when employee name filter changes
      this.saveAttendanceState();
    });

    this.filterForm.get('date')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.onFilter();
    });
  }

  private resizeHandler = () => {
    this.isMobile = window.innerWidth <= 768;
    console.log('📱 Mobile detection on resize:', this.isMobile, 'Screen width:', window.innerWidth);
  };

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Remove resize event listener
    window.removeEventListener('resize', this.resizeHandler);
  }

  onFilter(): void {
    const dateValue = this.filterForm.get('date')?.value;
    this.store.updateRequest({ date: dateValue ? new Date(dateValue).toISOString().split('T')[0] : undefined, pageNumber: 1 });

    // Explicitly trigger re-evaluation of employeeName filter
    const currentEmployeeName = this.filterForm.get('employeeName')?.value;
    this.filterForm.get('employeeName')?.setValue(currentEmployeeName, { emitEvent: true });

    // Save state after filtering
    this.saveAttendanceState();
  }

  onResetFilters(): void {
    this.filterForm.reset({
      date: null,
      employeeName: ''
    });
    this.onFilter(); // Re-apply date filter after reset
    this.saveAttendanceState(); // Save state after reset
  }

  toggleFilter(): void {
    this.isFilterCollapsed = !this.isFilterCollapsed;
    this.saveAttendanceState(); // Save filter collapsed state
  }

  closeMobileFilter(): void {
    this.isFilterCollapsed = true;
    console.log('❌ Close mobile filter:', this.isFilterCollapsed);
    this.saveAttendanceState(); // Save filter collapsed state
  }

  onPageChange(pageNumber: number): void {
    console.log('📄 Attendance Page: Handling page change:', {
      newPage: pageNumber,
      currentRequest: this.store.request()
    });
    this.store.updateRequest({ pageNumber });
    this.saveAttendanceState(); // Save pagination state
  }

  onSort(sortField: string): void {
    const currentSortField = this.store.request().sortField;
    const currentSortOrder = this.store.request().sortOrder;

    const sortOrder = currentSortField === sortField && currentSortOrder === 'asc' ? 'desc' : 'asc';
    
    console.log('🔀 Attendance Sort: Handling sort change:', {
      sortField,
      newSortOrder: sortOrder,
      currentSortField,
      currentSortOrder,
      currentRequest: this.store.request()
    });
    
    this.store.updateRequest({ sortField, sortOrder });
    this.saveAttendanceState(); // Save sorting state
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

  private saveAttendanceState(): void {
    const state = {
      date: this.filterForm.get('date')?.value,
      employeeName: this.filterForm.get('employeeName')?.value || '',
      isFilterCollapsed: this.isFilterCollapsed,
      pageNumber: this.store.request().pageNumber,
      sortField: this.store.request().sortField,
      sortOrder: this.store.request().sortOrder
    };

    try {
      localStorage.setItem('attendanceScreenState', JSON.stringify(state));
      console.log('💾 Attendance state saved:', state);
    } catch (error) {
      console.error('Failed to save attendance state:', error);
    }
  }

  private getSavedAttendanceState(): any {
    try {
      const saved = localStorage.getItem('attendanceScreenState');
      if (saved) {
        const state = JSON.parse(saved);
        console.log('📂 Attendance state restored:', state);
        return state;
      }
    } catch (error) {
      console.error('Failed to restore attendance state:', error);
    }
    return {};
  }

  // Method to clear saved state (useful for logout or manual reset)
  clearAttendanceState(): void {
    localStorage.removeItem('attendanceScreenState');
    console.log('🗑️ Attendance state cleared');
  }

  onViewAllOnMap(): void {
    const currentAttendances = this.filteredAttendances();
    
    if (!currentAttendances || currentAttendances.length === 0) {
      // Show localized toast message for no records
      this.showNoRecordsToast();
      return;
    }

    // Navigate to map with current date filter
    const dateParam = this.filterForm.get('date')?.value;
    this.router.navigate(['/attendance/map'], {
      queryParams: { date: dateParam }
    });
  }

  private showNoRecordsToast(): void {
    const message = this.translate.instant('NoRecordsToShowOnMap');
    
    // Show notification dialog following exact shared dialog pattern
    const dialogRef = this.dialog.open(NotificationDialogComponent, {
      width: '400px',
      panelClass: 'glass-dialog-panel',
      backdropClass: 'transparent-backdrop',
      data: {
        title: this.translate.instant('Information'),
        message: message,
        isSuccess: false // This will show the close button and OK button
      }
    });

    // Auto close after 3 seconds
    setTimeout(() => {
      dialogRef.close();
    }, 3000);
  }
}