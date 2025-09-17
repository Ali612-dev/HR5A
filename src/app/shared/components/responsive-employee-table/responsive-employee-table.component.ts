
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { NotificationDialogComponent } from '../notification-dialog/notification-dialog.component';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { PaginationComponent } from '../pagination/pagination.component';
import { WhatsAppService } from '../../../core/services/whatsapp.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSort, faSortUp, faSortDown, faEdit, faTrash, faEye, faPhone, faEnvelope, faBuilding, faIdCard, faCalendarAlt, faEllipsisV, faSpinner } from '@fortawesome/free-solid-svg-icons';
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
    ErrorComponent,
    PaginationComponent,
    CustomTooltipDirective,
    MessageDialogComponent,
    NotificationDialogComponent,
    ErrorDialogComponent
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
  private translate = inject(TranslateService);
  
  // Loading states for WhatsApp buttons
  whatsappLoadingStates: { [key: number]: boolean } = {};
  groupWhatsappLoading = false;

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
  faSpinner = faSpinner;

  isMobile: boolean = false;
  private destroy$ = new Subject<void>();

  private screenSizeService = inject(ScreenSizeService);

  // Computed property for select all checkbox state
  get isAllSelected(): boolean {
    return this.employees.length > 0 && this.employees.every(emp => emp.selected);
  }

  get isSomeSelected(): boolean {
    return this.employees.some(emp => emp.selected);
  }

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

  isWhatsappLoading(employeeId: number): boolean {
    return this.whatsappLoadingStates[employeeId] || false;
  }

  private getUserFriendlyErrorMessage(error: any): string {
    // Handle different types of errors
    if (error.status === 0) {
      return 'Server is not available. Please check your internet connection and try again later.';
    }
    
    if (error.status === 500) {
      return 'Server error occurred. Please try again later.';
    }
    
    if (error.status === 404) {
      return 'WhatsApp service not found. Please contact support.';
    }
    
    if (error.status === 401 || error.status === 403) {
      return 'You are not authorized to send WhatsApp messages. Please contact your administrator.';
    }
    
    if (error.status >= 400 && error.status < 500) {
      return 'Invalid request. Please check your message and try again.';
    }
    
    if (error.status >= 500) {
      return 'Server error occurred. Please try again later.';
    }
    
    // Handle API response errors
    if (error.error && error.error.message) {
      return error.error.message;
    }
    
    if (error.error && error.error.errors && error.error.errors.length > 0) {
      return error.error.errors.join(', ');
    }
    
    // Handle network errors
    if (error.message && error.message.includes('Network')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    // Default fallback
    return 'An unexpected error occurred while sending the WhatsApp message. Please try again later.';
  }

  openMessageDialog(employee: EmployeeDto): void {
    const employeeName = employee.name;
    const dialogRef = this.dialog.open(MessageDialogComponent, {
      width: '400px',
      data: { employeeNames: [employeeName] },
      panelClass: 'glass-dialog-panel',
      backdropClass: 'transparent-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Set loading state for this specific employee
        this.whatsappLoadingStates[employee.id] = true;
        
        this.whatsAppService.sendGroupWhatsAppMessage([employee.phone], result).subscribe({
          next: (response) => {
            // Clear loading state
            this.whatsappLoadingStates[employee.id] = false;
            
            if (response.isSuccess) {
              this.dialog.open(NotificationDialogComponent, {
                width: '400px',
                panelClass: 'glass-dialog-panel',
                backdropClass: 'transparent-backdrop',
                data: { 
                  title: this.translate.instant('Success'),
                  message: response.message || this.translate.instant('WhatsAppMessageSentSuccessfully'),
                  isSuccess: true
                }
              });
            } else {
              this.dialog.open(ErrorDialogComponent, {
                width: '400px',
                panelClass: 'glass-dialog-panel',
                backdropClass: 'transparent-backdrop',
                data: { 
                  title: this.translate.instant('Error'),
                  message: response.message || this.translate.instant('FailedToSendWhatsAppMessage')
                }
              });
            }
          },
          error: (err) => {
            // Clear loading state
            this.whatsappLoadingStates[employee.id] = false;
            
            this.dialog.open(ErrorDialogComponent, {
              width: '400px',
              panelClass: 'glass-dialog-panel',
              backdropClass: 'transparent-backdrop',
              data: { 
                title: this.translate.instant('Error'),
                message: this.getUserFriendlyErrorMessage(err)
              }
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
      panelClass: 'glass-dialog-panel',
      backdropClass: 'transparent-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Set loading state for group message
        this.groupWhatsappLoading = true;
        
        const phoneNumbers = this.selectedEmployees.map(emp => emp.phone);
        this.whatsAppService.sendGroupWhatsAppMessage(phoneNumbers, result).subscribe({
          next: (response) => {
            // Clear loading state
            this.groupWhatsappLoading = false;
            
            if (response.isSuccess) {
              this.dialog.open(NotificationDialogComponent, {
                width: '400px',
                panelClass: 'glass-dialog-panel',
                backdropClass: 'transparent-backdrop',
                data: { 
                  title: this.translate.instant('Success'),
                  message: response.message || this.translate.instant('WhatsAppGroupMessageSentSuccessfully'),
                  isSuccess: true
                }
              });
            } else {
              this.dialog.open(ErrorDialogComponent, {
                width: '400px',
                panelClass: 'glass-dialog-panel',
                backdropClass: 'transparent-backdrop',
                data: { 
                  title: this.translate.instant('Error'),
                  message: response.message || this.translate.instant('FailedToSendWhatsAppGroupMessage')
                }
              });
            }
          },
          error: (err) => {
            // Clear loading state
            this.groupWhatsappLoading = false;
            
            this.dialog.open(ErrorDialogComponent, {
              width: '400px',
              panelClass: 'glass-dialog-panel',
              backdropClass: 'transparent-backdrop',
              data: { 
                title: this.translate.instant('Error'),
                message: this.getUserFriendlyErrorMessage(err)
              }
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
    console.log('🔘 Responsive Table: onToggleSelection called with:', employee ? employee.name : 'null (select all)');
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
