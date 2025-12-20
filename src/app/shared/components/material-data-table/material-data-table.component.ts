import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges, inject, ViewChild, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ScreenSizeService } from '../../services/screen-size.service';
import { Subject, takeUntil } from 'rxjs';
import { EmptyDataComponent } from '../empty-data/empty-data.component';
import { LoadingDataComponent } from '../loading-data/loading-data.component';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  cellTemplate?: TemplateRef<any>;
  headerTemplate?: TemplateRef<any>;
}

export interface TableAction {
  label: string;
  icon: string;
  color?: 'primary' | 'accent' | 'warn' | 'info';
  action: (row: any) => void;
  show?: (row: any) => boolean;
}

@Component({
  selector: 'app-material-data-table',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    EmptyDataComponent,
    LoadingDataComponent
  ],
  templateUrl: './material-data-table.component.html',
  styleUrls: ['./material-data-table.component.css']
})
export class MaterialDataTableComponent<T = any> implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() data: T[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;
  @Input() sortField: string = '';
  @Input() sortOrder: 'asc' | 'desc' = 'asc';
  @Input() actions: TableAction[] = [];
  @Input() emptyMessage: string = 'NoDataAvailable';
  @Input() emptyDescription: string = '';
  @Input() loadingMessage: string = 'Loading';
  @Input() showActions: boolean = true;
  @Input() mobileCardTemplate?: TemplateRef<any>;
  @Input() trackByFn?: (index: number, item: T) => any;

  @Output() sortChange = new EventEmitter<{ field: string; order: 'asc' | 'desc' }>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() retry = new EventEmitter<void>();

  @ViewChild(MatSort) matSort!: MatSort;

  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<T>([]);
  isMobile: boolean = false;
  private destroy$ = new Subject<void>();
  private screenSizeService = inject(ScreenSizeService);

  // Check if error is actually an empty state message (not a real error)
  isEmptyStateError(): boolean {
    if (!this.error) return false;
    const emptyStateErrors = [
      'NoDailyAttendanceFound',
      'NoEmployeeAttendanceHistoryFound',
      'No daily attendance found',
      'No daily attendance found.',
      'No employee attendance history found',
      'No employee attendance history found.',
      'لم يتم العثور على سجلات حضور يومية',
      'لم يتم العثور على تاريخ حضور الموظف'
    ];
    return emptyStateErrors.some(msg => this.error?.includes(msg) || this.error === msg);
  }

  ngOnInit(): void {
    this.screenSizeService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
      });
    
    this.updateDisplayedColumns();
    this.dataSource.data = this.data;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.dataSource.data = this.data;
    }
    
    if (changes['columns']) {
      this.updateDisplayedColumns();
    }
  }

  ngAfterViewInit(): void {
    if (this.matSort) {
      this.dataSource.sort = this.matSort;
      this.matSort.sortChange.subscribe((sort: Sort) => {
        this.onSort(sort.active, sort.direction as 'asc' | 'desc');
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateDisplayedColumns(): void {
    this.displayedColumns = this.columns.map(col => col.key);
    if (this.showActions && this.actions.length > 0) {
      this.displayedColumns.push('actions');
    }
  }

  onSort(field: string, order: 'asc' | 'desc'): void {
    this.sortChange.emit({ field, order });
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  onActionClick(action: TableAction, row: T, event: Event): void {
    event.stopPropagation();
    if (action.show && !action.show(row)) {
      return;
    }
    action.action(row);
  }

  shouldShowAction(action: TableAction, row: T): boolean {
    return action.show ? action.show(row) : true;
  }

  getCellValue(row: T, key: string): any {
    const keys = key.split('.');
    let value: any = row;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined || value === null) break;
    }
    return value;
  }

  getColumnAlign(column: TableColumn): string {
    return column.align || 'center';
  }

  trackBy(index: number, item: T): any {
    return this.trackByFn ? this.trackByFn(index, item) : index;
  }
}

