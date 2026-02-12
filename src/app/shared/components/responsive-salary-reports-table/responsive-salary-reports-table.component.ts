import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { faSort, faSortUp, faSortDown, faEye, faEdit, faTrash, faDownload, faCheckCircle, faTimesCircle, faRefresh, faFileInvoice, faPlus } from '@fortawesome/free-solid-svg-icons';
import { SalaryReportDto } from '../../../core/interfaces/financial.interface';
import { ScreenSizeService } from '../../services/screen-size.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-responsive-salary-reports-table',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FontAwesomeModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './responsive-salary-reports-table.component.html',
  styleUrls: ['./responsive-salary-reports-table.component.css']
})
export class ResponsiveSalaryReportsTableComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() reports: SalaryReportDto[] = [];
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;
  @Input() totalCount: number = 0;
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 10;
  @Input() sortField: string = 'generatedDate';
  @Input() sortOrder: 'asc' | 'desc' = 'desc';

  @Output() sort = new EventEmitter<{ field: string; order: 'asc' | 'desc' }>();
  @Output() view = new EventEmitter<SalaryReportDto>();
  @Output() edit = new EventEmitter<SalaryReportDto>();
  @Output() delete = new EventEmitter<SalaryReportDto>();
  @Output() download = new EventEmitter<SalaryReportDto>();
  @Output() markAsPaid = new EventEmitter<SalaryReportDto>();
  @Output() retry = new EventEmitter<void>();
  @Output() createReport = new EventEmitter<void>();

  // FontAwesome Icons
  faSort = faSort;
  faSortUp = faSortUp;
  faSortDown = faSortDown;
  faEye = faEye;
  faEdit = faEdit;
  faTrash = faTrash;
  faDownload = faDownload;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faRefresh = faRefresh;
  faFileInvoice = faFileInvoice;
  faPlus = faPlus;

  isMobile: boolean = false;
  private destroy$ = new Subject<void>();
  private screenSizeService = inject(ScreenSizeService);

  @ViewChild(MatSort) matSort!: MatSort;

  // Material Table columns
  displayedColumns: string[] = [
    'employeeName',
    'reportMonth',
    'reportYear',
    'baseSalary',
    'netCalculatedSalary',
    'isPaid',
    'generatedDate',
    'actions'
  ];

  dataSource = new MatTableDataSource<SalaryReportDto>([]);

  ngOnInit(): void {
    this.screenSizeService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
      });

    // Update data source when reports change
    this.dataSource.data = this.reports;
  }

  ngAfterViewInit(): void {
    // Set up Material sort
    if (this.matSort) {
      this.dataSource.sort = this.matSort;
      this.matSort.sortChange.subscribe((sort: Sort) => {
        this.onSort(sort.active);
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update data source when reports input changes
    if (changes['reports'] && this.reports) {
      this.dataSource.data = this.reports;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSort(field: string): void {
    let newOrder: 'asc' | 'desc' = 'desc';
    if (this.sortField === field && this.sortOrder === 'desc') {
      newOrder = 'asc';
    }
    this.sort.emit({ field, order: newOrder });
  }

  getSortIcon(field: string): any {
    if (this.sortField !== field) {
      return faSort;
    }
    return this.sortOrder === 'asc' ? faSortUp : faSortDown;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit'
      });
    }
  }

  getStatusBadgeClass(isPaid: boolean): string {
    return isPaid ? 'badge-success' : 'badge-warning';
  }

  getStatusText(isPaid: boolean): string {
    return isPaid ? 'Paid' : 'Unpaid';
  }

  onView(report: SalaryReportDto): void {
    this.view.emit(report);
  }

  onEdit(report: SalaryReportDto): void {
    this.edit.emit(report);
  }

  onDelete(report: SalaryReportDto): void {
    this.delete.emit(report);
  }

  onDownload(report: SalaryReportDto): void {
    this.download.emit(report);
  }

  onMarkAsPaid(report: SalaryReportDto): void {
    this.markAsPaid.emit(report);
  }

  onRetry(): void {
    this.retry.emit();
  }

  onCreateReport(): void {
    this.createReport.emit();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  trackByFn(index: number, report: SalaryReportDto): number {
    return report.id;
  }
}
