
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { NotificationDialogComponent } from '../notification-dialog/notification-dialog.component';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { PaginationComponent } from '../pagination/pagination.component';
import { WhatsAppService } from '../../../core/services/whatsapp.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSort, faSortUp, faSortDown, faEdit, faTrash, faEye, faPhone, faEnvelope, faBuilding, faIdCard, faCalendarAlt, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { EmployeeDto, GetEmployeesRequest } from '../../../core/interfaces/employee.interface';
import { ShimmerComponent } from '../shimmer/shimmer.component';
import { CustomTooltipDirective } from '../../directives/custom-tooltip.directive';
import { ScreenSizeService } from '../../services/screen-size.service';
import { Subject, takeUntil } from 'rxjs';

import { ErrorComponent } from '../error/error.component';

@Component({
  selector: 'app-responsive-employee-table',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FontAwesomeModule,
    RouterLink,
    MessageDialogComponent,
    CustomTooltipDirective,
    ErrorComponent,
    NotificationDialogComponent,
    ErrorDialogComponent,
    PaginationComponent
  ],
  templateUrl: './responsive-employee-table.component.html',
  styleUrls: ['./responsive-employee-table.component.css']
})
export class ResponsiveEmployeeTableComponent implements OnInit, OnDestroy {
  @Input() employees: EmployeeDto[] = [];
  @Input() totalCount: number = 0;
  @Input() request!: GetEmployeesRequest;
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;

  @Input() selectedEmployees: EmployeeDto[] = [];

  @Output() pageChange = new EventEmitter<number>();
  @Output() sort = new EventEmitter<string>();
  @Output() delete = new EventEmitter<EmployeeDto>();
  @Output() toggleSelection = new EventEmitter<EmployeeDto | null>();
  @Output() retry = new EventEmitter<void>();

  private dialog = inject(MatDialog);
  private whatsAppService = inject(WhatsAppService);

  faSort = faSort;
  faSortUp = faSortUp;
  faSortDown = faSortDown;
  faEdit = faEdit;
  faTrash = faTrash;
  faEye = faEye;
  faPhone = faPhone;
  faEnvelope = faEnvelope;
  faBuilding = faBuilding;
  faIdCard = faIdCard;
  faCalendarAlt = faCalendarAlt;
  faWhatsapp = faWhatsapp;
  faEllipsisV = faEllipsisV;

  isMobile: boolean = false;
  private destroy$ = new Subject<void>();

  private screenSizeService = inject(ScreenSizeService);

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

  openMessageDialog(employee: EmployeeDto): void {
    const employeeName = employee.name;
    const dialogRef = this.dialog.open(MessageDialogComponent, {
      width: '400px',
      data: { employeeName },
      panelClass: 'glass-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.whatsAppService.sendWhatsAppMessage(employee.phone, result).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.dialog.open(NotificationDialogComponent, {
                width: '400px',
                data: { message: response.message || 'WhatsApp message sent successfully!' }
              });
            } else {
              this.dialog.open(ErrorDialogComponent, {
                width: '400px',
                data: { message: response.message || 'Failed to send WhatsApp message.' }
              });
            }
          },
          error: (err) => {
            this.dialog.open(ErrorDialogComponent, {
              width: '400px',
              data: { message: err.message || 'An error occurred while sending WhatsApp message.' }
            });
          }
        });
      }
    });
  }

  openGroupMessageDialog(): void {
    const employeeNames = this.selectedEmployees.map(emp => emp.name);
    const dialogRef = this.dialog.open(MessageDialogComponent, {
      width: '400px',
      data: { employeeNames },
      panelClass: 'glass-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const phoneNumbers = this.selectedEmployees.map(emp => emp.phone);
        this.whatsAppService.sendGroupWhatsAppMessage(phoneNumbers, result).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.dialog.open(NotificationDialogComponent, {
                width: '400px',
                data: { message: response.message || 'WhatsApp group message sent successfully!' }
              });
            } else {
              this.dialog.open(ErrorDialogComponent, {
                width: '400px',
                data: { message: response.message || 'Failed to send WhatsApp group message.' }
              });
            }
          },
          error: (err) => {
            this.dialog.open(ErrorDialogComponent, {
              width: '400px',
              data: { message: err.message || 'An error occurred while sending WhatsApp group message.' }
            });
          }
        });
      }
    });
  }

  onPageChange(pageNumber: number): void {
    this.pageChange.emit(pageNumber);
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

  onSort(sortField: string): void {
    this.sort.emit(sortField);
  }

  onDelete(employee: EmployeeDto): void {
    this.delete.emit(employee);
  }

  onToggleSelection(employee: EmployeeDto | null): void {
    this.toggleSelection.emit(employee);
  }

  toggleDropdown(employee: EmployeeDto, event: Event): void {
    event.stopPropagation();
    this.employees.forEach(emp => {
      if (emp !== employee) {
        emp.showActions = false;
      }
    });
    employee.showActions = !employee.showActions;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: Event): void {
    if (!(event.target as HTMLElement).closest('.dropdown')) {
      this.employees.forEach(emp => {
        emp.showActions = false;
      });
    }
  }

  onRetry(): void {
    this.retry.emit();
  }
}
