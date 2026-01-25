import { Component, OnInit, inject, computed, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faFilter, faMapMarkerAlt, faArrowLeft, faClock, faCalculator } from '@fortawesome/free-solid-svg-icons';

import { AttendanceStore } from '../../../../store/attendance.store';
import { MonthlyWorkedHoursStore } from '../../../../store/monthly-worked-hours.store';
import { GroupedAttendanceViewModel, AttendanceSession } from '../../../../core/interfaces/attendance.interface';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { ErrorDialogComponent } from '../../../../shared/components/error-dialog/error-dialog.component';
import { DeleteAttendanceStore } from '../../../../store/delete-attendance.store'; // Reusing for now, will create specific attendance delete store later
import { effect } from '@angular/core';
import { MaterialDataTableComponent, TableColumn, TableAction } from '../../../../shared/components/material-data-table';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { AttendanceDataService } from '../../../../core/attendance-data.service';
import { AttendanceStateService } from '../../../../core/attendance-state.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';
import { TemplateRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    RouterLink,
    MaterialDataTableComponent,
    PaginationComponent,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css']
})
export class AttendanceComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly store = inject(AttendanceStore);
  private router = inject(Router);
  filterForm!: FormGroup;

  faPlus = faPlus;
  faFilter = faFilter;
  faMapMarkerAlt = faMapMarkerAlt;
  faArrowLeft = faArrowLeft;
  faClock = faClock;
  faCalculator = faCalculator;

  isFilterCollapsed: boolean = true;
  isMobile: boolean = false;

  readonly monthlyHoursStore = inject(MonthlyWorkedHoursStore);

  private loadingDialogRef: any; // Declare loadingDialogRef

  readonly deleteStore = inject(DeleteAttendanceStore);
  private dialog = inject(MatDialog);
  private attendanceDataService = inject(AttendanceDataService);
  private attendanceStateService = inject(AttendanceStateService);

  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);
  private destroy$ = new Subject<void>();
  public translate = inject(TranslateService);

  // Material Data Table
  tableColumns: TableColumn[] = [];
  tableActions: TableAction[] = [];

  @ViewChild('employeeNameTemplate') employeeNameTemplate!: TemplateRef<any>;
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;
  @ViewChild('timeInTemplate') timeInTemplate!: TemplateRef<any>;
  @ViewChild('timeOutTemplate') timeOutTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('sessionsTemplate') sessionsTemplate!: TemplateRef<any>;
  @ViewChild('sessionsDialogTemplate') sessionsDialogTemplate!: TemplateRef<any>;
  @ViewChild('monthlyHoursDialogTemplate') monthlyHoursDialogTemplate!: TemplateRef<any>;

  // No longer needed: client-side filtering removed in favor of server-side SearchName
  filteredAttendances = computed(() => {
    return this.store.attendances();
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

    // Try to restore state from memory service (only during navigation, not from localStorage)
    const savedState = this.attendanceStateService.getState();

    // Get current date as default
    const currentDate = new Date().toISOString().split('T')[0];
    console.log('📅 Attendance: Current date set to:', currentDate);

    // Use saved state if available (from navigation), otherwise use current date
    let defaultDate = savedState?.date || currentDate;
    let defaultEmployeeName = savedState?.employeeName || '';
    let defaultIsFilterCollapsed = savedState?.isFilterCollapsed !== undefined ? savedState.isFilterCollapsed : true;

    if (savedState) {
      console.log('📂 Restoring state from memory:', savedState);

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
    } else {
      console.log('📂 No saved state found, using defaults');
    }

    this.filterForm = this.fb.group({
      date: [defaultDate],
      employeeName: [defaultEmployeeName]
    });

    // Restore filter collapsed state
    this.isFilterCollapsed = defaultIsFilterCollapsed;

    // Update store with the default date - use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.store.updateRequest({ date: defaultDate });
    }, 0);

    this.filterForm.get('employeeName')?.valueChanges.pipe(
      debounceTime(500), // Slightly longer debounce for server-side search
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((searchValue) => {
      // Trigger server-side search
      this.store.updateRequest({ searchName: searchValue || '', pageNumber: 1 });
      this.saveAttendanceState();
    });

    this.filterForm.get('date')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.onFilter();
    });
  }

  ngAfterViewInit(): void {
    // Initialize columns and actions after templates are available
    this.initializeTableColumns();
    this.initializeTableActions();
  }

  private initializeTableColumns(): void {
    this.tableColumns = [
      {
        key: 'employeeName',
        label: 'EmployeeName',
        sortable: true,
        align: 'center',
        cellTemplate: this.employeeNameTemplate
      },
      {
        key: 'date',
        label: 'Date',
        sortable: true,
        align: 'center',
        cellTemplate: this.dateTemplate
      },
      {
        key: 'timeIn',
        label: 'TimeIn',
        sortable: true,
        align: 'center',
        cellTemplate: this.timeInTemplate
      },
      {
        key: 'timeOut',
        label: 'TimeOut',
        sortable: true,
        align: 'center',
        cellTemplate: this.timeOutTemplate
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        align: 'center',
        cellTemplate: this.statusTemplate
      },
      {
        key: 'sessionsCount',
        label: 'Sessions',
        sortable: true,
        align: 'center',
        cellTemplate: this.sessionsTemplate
      }
    ];
  }

  private initializeTableActions(): void {
    this.tableActions = [
      {
        label: 'ViewAttendance',
        icon: 'visibility',
        color: 'primary',
        action: (row: GroupedAttendanceViewModel) => {
          this.attendanceDataService.setAttendanceData(row);
          const id = row.sessionsCount > 0 ? row.sessions[0].id : 0;
          this.router.navigate(['/attendance/view', id]);
        },
        show: (row: GroupedAttendanceViewModel) => row.sessionsCount > 0
      },
      {
        label: 'EditAttendance',
        icon: 'edit',
        color: 'primary',
        action: (row: GroupedAttendanceViewModel) => {
          const session = row.sessionsCount === 1 ? row.sessions[0] : null;
          if (session) {
            this.attendanceDataService.setAttendanceData({
              ...row,
              id: session.id,
              timeIn: session.timeIn,
              timeOut: session.timeOut,
              latitude: session.latitude,
              longitude: session.longitude,
              outLatitude: session.outLatitude,
              outLongitude: session.outLongitude,
              locationName: session.locationName
            } as any);
            this.router.navigate(['/attendance/update', session.id]);
          }
        },
        show: (row: GroupedAttendanceViewModel) => row.sessionsCount === 1
      },
      {
        label: 'ViewOnMap',
        icon: 'location_on',
        color: 'accent',
        action: (row: GroupedAttendanceViewModel) => {
          this.router.navigate(['/attendance/map'], {
            queryParams: { employeeId: row.employeeId, date: row.date }
          });
        },
        show: (row: GroupedAttendanceViewModel) => row.sessionsCount > 0
      },
      {
        label: 'DeleteAttendance',
        icon: 'delete',
        color: 'warn',
        action: (row: GroupedAttendanceViewModel) => {
          this.onDelete(row);
        },
        show: (row: GroupedAttendanceViewModel) => row.sessionsCount === 1
      }
    ];
  }

  private resizeHandler = () => {
    this.isMobile = window.innerWidth <= 768;
    console.log('📱 Mobile detection on resize:', this.isMobile, 'Screen width:', window.innerWidth);
  };

  ngOnDestroy(): void {
    // Save state before component is destroyed (so it persists during navigation)
    this.saveAttendanceState();

    this.destroy$.next();
    this.destroy$.complete();

    // Remove resize event listener
    window.removeEventListener('resize', this.resizeHandler);
  }

  onFilter(): void {
    const dateValue = this.filterForm.get('date')?.value;
    const searchName = this.filterForm.get('employeeName')?.value;

    this.store.updateRequest({
      date: dateValue ? new Date(dateValue).toISOString().split('T')[0] : undefined,
      searchName: searchName || '',
      pageNumber: 1
    });

    // Save state to memory after filtering
    this.saveAttendanceState();
  }

  onResetFilters(): void {
    const currentDate = new Date().toISOString().split('T')[0];
    this.filterForm.reset({
      date: currentDate,
      employeeName: ''
    });
    this.onFilter(); // Re-apply date filter after reset
    this.saveAttendanceState(); // Save state to memory after reset
  }

  toggleFilter(): void {
    this.isFilterCollapsed = !this.isFilterCollapsed;
    this.saveAttendanceState(); // Save filter collapsed state to memory
  }

  closeMobileFilter(): void {
    this.isFilterCollapsed = true;
    console.log('❌ Close mobile filter:', this.isFilterCollapsed);
    this.saveAttendanceState(); // Save filter collapsed state to memory
  }

  onPageChange(pageNumber: number): void {
    console.log('📄 Attendance Page: Handling page change:', {
      newPage: pageNumber,
      currentRequest: this.store.request()
    });
    this.store.updateRequest({ pageNumber });
    this.saveAttendanceState(); // Save pagination state to memory
  }

  onSort(sortData: { field: string; order: 'asc' | 'desc' }): void {
    console.log('🔀 Attendance Sort: Handling sort change:', {
      sortField: sortData.field,
      sortOrder: sortData.order,
      currentRequest: this.store.request()
    });

    this.store.updateRequest({ sortField: sortData.field, sortOrder: sortData.order });
    this.saveAttendanceState(); // Save sorting state to memory
  }

  onDelete(attendance: GroupedAttendanceViewModel): void {
    const session = attendance.sessions[0];
    if (!session) return;

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

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deleteStore.deleteAttendance(session.id);
      }
    });
  }

  onRetryLoadAttendances(): void {
    this.store.loadDailyAttendances();
  }

  private saveAttendanceState(): void {
    const request = this.store.request();
    const state = {
      date: this.filterForm.get('date')?.value || null,
      employeeName: this.filterForm.get('employeeName')?.value || '',
      isFilterCollapsed: this.isFilterCollapsed,
      pageNumber: request.pageNumber || 1,
      sortField: request.sortField || null,
      sortOrder: request.sortOrder || null
    };

    // Save to memory service (not localStorage) - only persists during navigation
    this.attendanceStateService.saveState(state);
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

  goBack(): void {
    // Clear state when navigating away from attendance feature entirely
    this.attendanceStateService.clearState();
    this.router.navigate(['/admin-dashboard']);
  }

  isMultipleDates(attendance: GroupedAttendanceViewModel): boolean {
    if (!attendance.firstCheckIn || !attendance.lastCheckOut) return false;

    const timeInDate = new Date(attendance.firstCheckIn);
    const timeOutDate = new Date(attendance.lastCheckOut);

    // Compare dates ignoring time
    return timeInDate.toDateString() !== timeOutDate.toDateString();
  }

  getDateRangeDisplay(attendance: GroupedAttendanceViewModel): string {
    if (!this.isMultipleDates(attendance)) {
      return '';
    }

    const timeInDate = new Date(attendance.firstCheckIn!);
    const timeOutDate = new Date(attendance.lastCheckOut!);

    // Format both dates
    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    return `${formatDate(timeInDate)} - ${formatDate(timeOutDate)}`;
  }

  getCheckInDate(attendance: GroupedAttendanceViewModel): string {
    if (!attendance.firstCheckIn) return '';
    const timeInDate = new Date(attendance.firstCheckIn);
    const day = timeInDate.getDate().toString().padStart(2, '0');
    const month = (timeInDate.getMonth() + 1).toString().padStart(2, '0');
    const year = timeInDate.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getCheckOutDate(attendance: GroupedAttendanceViewModel): string {
    if (!attendance.lastCheckOut) return '';
    const timeOutDate = new Date(attendance.lastCheckOut);
    const day = timeOutDate.getDate().toString().padStart(2, '0');
    const month = (timeOutDate.getMonth() + 1).toString().padStart(2, '0');
    const year = timeOutDate.getFullYear();
    return `${day}/${month}/${year}`;
  }

  viewSessions(row: GroupedAttendanceViewModel, event: Event): void {
    event.stopPropagation();
    this.dialog.open(this.sessionsDialogTemplate, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'glass-dialog-panel',
      data: row
    });
  }

  onEditSession(session: AttendanceSession, row: GroupedAttendanceViewModel): void {
    // Close the sessions dialog first
    this.dialog.closeAll();

    this.attendanceDataService.setAttendanceData({
      ...row,
      id: session.id,
      timeIn: session.timeIn,
      timeOut: session.timeOut,
      latitude: session.latitude,
      longitude: session.longitude,
      outLatitude: session.outLatitude,
      outLongitude: session.outLongitude,
      locationName: session.locationName
    } as any);
    this.router.navigate(['/attendance/update', session.id]);
  }

  onDeleteSession(session: AttendanceSession, row: GroupedAttendanceViewModel): void {
    const formattedDate = this.datePipe.transform(row.date, 'shortDate');
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title: this.translate.instant('ConfirmDeletion'),
        message: this.translate.instant('DeleteConfirmation', { employeeName: row.employeeName, date: formattedDate }),
        confirmButtonText: this.translate.instant('Delete'),
        cancelButtonText: this.translate.instant('Cancel')
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deleteStore.deleteAttendance(session.id);
      }
    });
  }

  viewMonthlyHours(row: GroupedAttendanceViewModel, event: Event): void {
    event.stopPropagation();
    this.monthlyHoursStore.loadMonthlyHours(row.employeeId);
    this.dialog.open(this.monthlyHoursDialogTemplate, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'glass-dialog-panel',
      data: row
    });
  }

  formatHoursToHHMM(totalHours: number): string {
    if (!totalHours) return '00:00';

    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    if (minutes === 60) {
      return `${(hours + 1).toString().padStart(2, '0')}:00`;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}