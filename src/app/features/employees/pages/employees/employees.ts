import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faSort, faSortUp, faSortDown, faEdit, faTrash, faEye, faFilter, faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

import { EmployeeStore } from '../../../../store/employee.store';
import { EmployeeDto, GetEmployeesRequest } from '../../../../core/interfaces/employee.interface';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MessageDialogComponent } from '../../../../shared/components/message-dialog/message-dialog.component';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { ErrorDialogComponent } from '../../../../shared/components/error-dialog/error-dialog.component';
import { WhatsAppService } from '../../../../core/services/whatsapp.service';
import { DeleteEmployeeStore } from '../../../../store/delete-employee.store';
import { effect } from '@angular/core';
import { ResponsiveEmployeeTableComponent } from '../../../../shared/components/responsive-employee-table/responsive-employee-table.component';

import { CustomDropdownComponent } from '../../../../shared/components/custom-dropdown/custom-dropdown.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    RouterLink,
    ResponsiveEmployeeTableComponent, // Added ResponsiveEmployeeTableComponent
    CustomDropdownComponent
  ],
  templateUrl: './employees.html',
  styleUrls: ['./employees.css']
})
export class Employees implements OnInit {
  readonly store = inject(EmployeeStore);
  filterForm!: FormGroup;

  // Font Awesome Icons (used directly in employees.html)
  faPlus = faPlus;
  faFilter = faFilter;
  whatsappIcon = faWhatsapp;
  faSpinner = faSpinner;
  faArrowLeft = faArrowLeft;

  isFilterCollapsed: boolean = true;

  statusOptions: { value: boolean | null; label: string }[] = [];

  private loadingDialogRef: any; // Declare loadingDialogRef

  readonly deleteStore = inject(DeleteEmployeeStore);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private whatsAppService = inject(WhatsAppService);
  private location = inject(Location);

  // Loading state for group WhatsApp button
  groupWhatsappLoading = false;

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
          panelClass: 'transparent-dialog',
          data: {
            title: this.translate.instant('Loading'),
            message: 'Deleting employee...',
            isSuccess: true // Use true for loading state to show spinner if implemented
          },
          disableClose: true // Prevent closing by clicking outside
        });
      } else if (this.loadingDialogRef) {
        // Close loading dialog when isLoading becomes false
        this.loadingDialogRef.close();
        this.loadingDialogRef = undefined;

        if (this.deleteStore.isSuccess()) {
          this.store.loadEmployees();
          this.dialog.open(NotificationDialogComponent, {
            panelClass: 'transparent-dialog',
            data: {
              title: this.translate.instant('Success'),
              message: 'Employee deleted successfully.',
              isSuccess: true
            }
          });
          this.deleteStore.resetState();
        } else if (this.deleteStore.error()) {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: 'transparent-dialog',
            data: {
              title: 'Error',
              message: this.deleteStore.error(),
              isSuccess: false
            }
          });
          this.deleteStore.resetState();
        }
      }
    });
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

  ngOnInit(): void {
    // Initialize status options with translations
    this.statusOptions = [
      { value: null, label: this.translate.instant('All') },
      { value: true, label: this.translate.instant('Active') },
      { value: false, label: this.translate.instant('Inactive') }
    ];

    this.filterForm = this.fb.group({
      name: [this.store.request().name || ''],
      phone: [this.store.request().phone || ''],
      department: [this.store.request().department || ''],
      isActive: [this.store.request().isActive || null]
    });

    this.store.loadEmployees();

    this.filterForm.valueChanges.subscribe(() => {
      this.onFilter();
    });
  }

  onBack(): void {
    this.location.back();
  }

  onFilter(): void {
    this.store.updateRequest({ ...this.filterForm.value, pageNumber: 1 });
  }

  onResetFilters(): void {
    this.filterForm.reset({
      name: '',
      phone: '',
      department: '',
      isActive: null
    });
    this.onFilter();
  }

  get selectedEmployees(): EmployeeDto[] {
    return this.store.employees().filter(e => e.selected);
  }

  get selectedCount(): number {
    return this.store.employees().filter(e => e.selected).length;
  }

  sendWhatsAppMessage(): void {
    const selectedEmployees = this.store.employees().filter(e => e.selected);
    const employeeNames = selectedEmployees.map(emp => emp.name);

    const dialogRef = this.dialog.open(MessageDialogComponent, {
      width: '400px',
      data: { employeeNames },
      panelClass: 'glass-dialog-panel',
      backdropClass: 'transparent-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Set loading state
        this.groupWhatsappLoading = true;
        
        const phoneNumbers = selectedEmployees.map(emp => emp.phone);
        this.whatsAppService.sendGroupWhatsAppMessage(phoneNumbers, result).subscribe({
          next: (response: any) => {
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
          error: (err: any) => {
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

  toggleFilter(): void {
    this.isFilterCollapsed = !this.isFilterCollapsed;
  }

  // Methods passed to ResponsiveEmployeeTableComponent
  onPageChange(pageNumber: number): void {
    console.log('📄 Employee Page: Handling page change:', {
      newPage: pageNumber,
      currentRequest: this.store.request()
    });
    this.store.updateRequest({ pageNumber });
  }

  onSort(sortField: string): void {
    const currentSortField = this.store.request().sortField;
    const currentSortOrder = this.store.request().sortOrder;

    const sortOrder = currentSortField === sortField && currentSortOrder === 'asc' ? 'desc' : 'asc';
    
    console.log('🔀 Employee Sort: Handling sort change:', {
      sortField,
      newSortOrder: sortOrder,
      currentSortField,
      currentSortOrder,
      currentRequest: this.store.request()
    });
    
    this.store.updateRequest({ sortField, sortOrder });
  }

  onDelete(employee: EmployeeDto): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      backdropClass: 'transparent-backdrop',
      data: {
        title: this.translate.instant('ConfirmDeletion'),
        message: this.translate.instant('DeleteEmployeeConfirmation', { employeeName: employee.name }),
        confirmButtonText: this.translate.instant('Delete'),
        cancelButtonText: this.translate.instant('Cancel')
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deleteStore.deleteEmployee(employee.id);
      }
    });
  }

  onRetryLoadEmployees(): void {
    this.store.loadEmployees();
  }

  toggleSelection(employee: EmployeeDto | null) {
    console.log('🔘 Main Component: toggleSelection called with:', employee ? employee.name : 'null (select all)');
    
    if (employee) {
      // Toggle individual employee selection
      employee.selected = !employee.selected;
      console.log('🔘 Individual selection:', employee.name, 'selected:', employee.selected);
    } else {
      // Toggle all employees selection
      const allSelected = this.store.employees().every(e => e.selected);
      console.log('🔘 Select all - current allSelected:', allSelected);
      
      this.store.employees().forEach(e => {
        e.selected = !allSelected;
        console.log('🔘 Setting', e.name, 'to:', e.selected);
      });
    }
    
    console.log('🔘 Current selected count:', this.selectedCount);
    console.log('🔘 Current selected employees:', this.selectedEmployees.map(e => e.name));
  }
}
