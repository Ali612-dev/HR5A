import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSort, faSortUp, faSortDown, faEdit, faTrash, faEye, faCalendarAlt, faClock, faLocationDot, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { AttendanceViewModel, GetDailyAttendanceDto } from '../../../core/interfaces/attendance.interface';
import { ShimmerComponent } from '../shimmer/shimmer.component';
import { CustomTooltipDirective } from '../../directives/custom-tooltip.directive';
import { ScreenSizeService } from '../../services/screen-size.service';
import { Subject, takeUntil } from 'rxjs';
import { ErrorComponent } from '../error/error.component';

import { AttendanceDataService } from '../../../core/attendance-data.service';

@Component({
  selector: 'app-responsive-attendance-table',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FontAwesomeModule,
    RouterLink,
    
    CustomTooltipDirective,
    ErrorComponent
  ],
  templateUrl: './responsive-attendance-table.component.html',
  styleUrls: ['./responsive-attendance-table.component.css']
})
export class ResponsiveAttendanceTableComponent implements OnInit, OnDestroy {
  @Input() attendances: AttendanceViewModel[] = [];
  @Input() totalCount: number = 0;
  @Input() request!: GetDailyAttendanceDto;
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;

  @Output() pageChange = new EventEmitter<number>();
  @Output() sort = new EventEmitter<string>();
  @Output() delete = new EventEmitter<AttendanceViewModel>();
  @Output() retry = new EventEmitter<void>();

  faSort = faSort;
  faSortUp = faSortUp;
  faSortDown = faSortDown;
  faEdit = faEdit;
  faTrash = faTrash;
  faEye = faEye;
  faCalendarAlt = faCalendarAlt;
  faClock = faClock;
  faLocationDot = faLocationDot;
  faMapMarkerAlt = faMapMarkerAlt;

  isMobile: boolean = false;
  private destroy$ = new Subject<void>();

  private screenSizeService = inject(ScreenSizeService);
  private attendanceDataService = inject(AttendanceDataService);

  ngOnInit(): void {
    this.screenSizeService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageChange(pageNumber: number): void {
    console.log('🔄 Attendance Table: Page change requested:', {
      newPage: pageNumber,
      currentPage: this.request?.pageNumber,
      totalPages: this.totalPages,
      totalCount: this.totalCount
    });
    this.pageChange.emit(pageNumber);
  }

  onSort(sortField: string): void {
    this.sort.emit(sortField);
  }

  onDelete(attendance: AttendanceViewModel): void {
    this.delete.emit(attendance);
  }

  onRetry(): void {
    this.retry.emit();
  }

  onUpdate(attendance: AttendanceViewModel): void {
    this.attendanceDataService.setAttendanceData(attendance);
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / (this.request.pageSize ?? 10));
  }

  get pages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  isEmptyDataError(): boolean {
    if (!this.error) return false;
    // Check if the error message indicates empty data rather than an actual error
    const emptyDataMessages = [
      'NoDailyAttendanceFound', 
      'NoEmployeeAttendanceHistoryFound', 
      'No daily attendance found', 
      'No daily attendance found.',
      'No employee attendance history found',
      'No employee attendance history found.',
      'لم يتم العثور على سجلات حضور يومية',
      'لم يتم العثور على تاريخ حضور الموظف'
    ];
    return emptyDataMessages.some(msg => this.error?.includes(msg));
  }
}
