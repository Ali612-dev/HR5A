import { Component, OnInit, inject, ViewChild, TemplateRef, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faFilter, faClock, faPlus, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

import { EmployeeAttendanceHistoryStore } from '../../../../store/employee-attendance-history.store';
import { MaterialDataTableComponent, TableColumn, TableAction } from '../../../../shared/components/material-data-table';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AttendanceDataService } from '../../../../core/attendance-data.service';
import { AttendanceSession, GroupedAttendanceViewModel } from '../../../../core/interfaces/attendance.interface';
import { DeleteAttendanceStore } from '../../../../store/delete-attendance.store';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { ErrorDialogComponent } from '../../../../shared/components/error-dialog/error-dialog.component';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-employee-history',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    RouterLink,
    MaterialDataTableComponent,
    PaginationComponent,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ],
  providers: [DatePipe],
  templateUrl: './employee-history.component.html',
  styleUrls: ['./employee-history.component.css']
})
export class EmployeeHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly store = inject(EmployeeAttendanceHistoryStore);
  readonly deleteStore = inject(DeleteAttendanceStore);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private attendanceDataService = inject(AttendanceDataService);
  private datePipe = inject(DatePipe);
  public translate = inject(TranslateService);

  filterForm!: FormGroup;

  faArrowLeft = faArrowLeft;
  faFilter = faFilter;
  faClock = faClock;
  faPlus = faPlus;
  faMapMarkerAlt = faMapMarkerAlt;

  isFilterCollapsed: boolean = true;
  isMobile: boolean = false;

  private loadingDialogRef: any;

  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // Material Data Table
  tableColumns: TableColumn[] = [];
  tableActions: TableAction[] = [];

  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;
  @ViewChild('timeInTemplate') timeInTemplate!: TemplateRef<any>;
  @ViewChild('timeOutTemplate') timeOutTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('sessionsTemplate') sessionsTemplate!: TemplateRef<any>;
  @ViewChild('sessionsDialogTemplate') sessionsDialogTemplate!: TemplateRef<any>;

  constructor() {
    effect(() => {
      if (this.deleteStore.isLoading()) {
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
        }
        this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
          panelClass: 'glass-dialog-panel',
          data: {
            title: this.translate.instant('LOADING.TITLE'),
            message: this.translate.instant('LOADING.DELETE_ATTENDANCE'),
            isSuccess: true
          },
          disableClose: true
        });
      } else if (this.loadingDialogRef) {
        this.loadingDialogRef.close();
        this.loadingDialogRef = undefined;

        if (this.deleteStore.isSuccess()) {
          this.store.loadEmployeeAttendanceHistory();
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

    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);
  }

  ngAfterViewInit(): void {
    this.initializeTableColumns();
    this.initializeTableActions();
  }

  private resizeHandler = () => {
    this.isMobile = window.innerWidth <= 768;
  };

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.resizeHandler);
  }

  private initializeTableColumns(): void {
    this.tableColumns = [
      {
        key: 'date',
        label: 'Date',
        sortable: true,
        cellTemplate: this.dateTemplate
      },
      {
        key: 'firstCheckIn',
        label: 'TimeIn',
        sortable: true,
        cellTemplate: this.timeInTemplate
      },
      {
        key: 'lastCheckOut',
        label: 'TimeOut',
        sortable: true,
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
      }
    ];
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

  onSort(event: { field: string, order: 'asc' | 'desc' }): void {
    this.store.updateRequest({ sortField: event.field, sortOrder: event.order, pageNumber: 1 });
  }

  isMultipleDates(attendance: GroupedAttendanceViewModel): boolean {
    if (!attendance.firstCheckIn || !attendance.lastCheckOut) return false;
    const timeInDate = new Date(attendance.firstCheckIn);
    const timeOutDate = new Date(attendance.lastCheckOut);
    return timeInDate.toDateString() !== timeOutDate.toDateString();
  }

  getCheckInDate(attendance: GroupedAttendanceViewModel): string {
    if (!attendance.firstCheckIn) return '';
    const date = new Date(attendance.firstCheckIn);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  getCheckOutDate(attendance: GroupedAttendanceViewModel): string {
    if (!attendance.lastCheckOut) return '';
    const date = new Date(attendance.lastCheckOut);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
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
}
