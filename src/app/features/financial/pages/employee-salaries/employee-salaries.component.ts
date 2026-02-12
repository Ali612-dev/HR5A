import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faDollarSign,
  faPlus,
  faEdit,
  faTrash,
  faUsers,
  faCalendarAlt,
  faClock,
  faRedo,
  faChevronLeft,
  faChevronRight,
  faUser,
  faExclamationTriangle,
  faTimes,
  faSearch,
  faCog,
  faCalculator
} from '@fortawesome/free-solid-svg-icons';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { FinancialService } from '../../../../core/services/financial.service';
import { EmployeeService } from '../../../../core/employee.service';
import {
  EmployeeSalaryDto,
  CreateEmployeeSalaryDto,
  UpdateEmployeeSalaryDto,
  SalaryType,
  CreateSalaryReportDto
} from '../../../../core/interfaces/financial.interface';

@Component({
  selector: 'app-employee-salaries',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TranslateModule,
    FontAwesomeModule
  ],
  templateUrl: './employee-salaries.component.html',
  styleUrls: ['./employee-salaries.component.css']
})
export class EmployeeSalariesComponent implements OnInit, OnDestroy {
  private financialService = inject(FinancialService);
  private employeeService = inject(EmployeeService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // FontAwesome Icons
  faArrowLeft = faArrowLeft;
  faDollarSign = faDollarSign;
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;
  faUsers = faUsers;
  faCalendarAlt = faCalendarAlt;
  faClock = faClock;
  faRedo = faRedo;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faUser = faUser;
  faExclamationTriangle = faExclamationTriangle;
  faTimes = faTimes;
  faSearch = faSearch;
  faCog = faCog;
  faCalculator = faCalculator;

  // Data
  salaries: EmployeeSalaryDto[] = [];
  employees: any[] = [];

  // State
  loading = false;
  saving = false;
  deleting = false;

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 0;

  // Filters
  searchTerm = '';
  filterSalaryType: number | null = null;

  // Stats
  totalSalaries = 0;
  monthlySalaries = 0;
  hourlySalaries = 0;
  totalAmount = 0;

  // Dialog State
  showDialog = false;
  showDeleteDialog = false;
  showCreateReportDialog = false;
  isEditMode = false;
  selectedSalary: EmployeeSalaryDto | null = null;
  salaryToDelete: EmployeeSalaryDto | null = null;
  selectedEmployee: EmployeeSalaryDto | null = null;
  creatingReport = false;

  // Form
  form: {
    employeeId: number | null;
    salaryType: SalaryType;
    amount: number | null;
    notes: string;
    hourlyRate: number | null;
    overtimeRate: number | null;
  } = {
      employeeId: null,
      salaryType: SalaryType.PerMonth, // This is now 1
      amount: null,
      notes: '',
      hourlyRate: null,
      overtimeRate: null
    };

  // Create Report Form
  createReportForm: {
    reportMonth: number | null;
    reportYear: number | null;
    fromDate: string;
    toDate: string;
    notes: string;
  } = {
      reportMonth: null,
      reportYear: null,
      fromDate: '',
      toDate: '',
      notes: ''
    };

  // Options for dropdowns
  monthOptions: { value: number; label: string }[] = [];
  yearOptions: number[] = [];

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.initializeOptions();
    this.loadEmployees();
    this.loadSalaries();
  }

  initializeOptions(): void {
    // Initialize month options
    this.monthOptions = this.financialService.getMonthOptions();

    // Initialize year options
    this.yearOptions = this.financialService.getYearOptions();

    // Set default values to current month and year
    const currentDate = new Date();
    this.createReportForm.reportMonth = currentDate.getMonth() + 1;
    this.createReportForm.reportYear = currentDate.getFullYear();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadSalaries();
      });
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployees({ pageNumber: 1, pageSize: 1000 }).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const employeeData: any = response.data;
          if (Array.isArray(employeeData)) {
            this.employees = employeeData.filter((emp: any) => emp.isActive);
          } else if (employeeData.employees && Array.isArray(employeeData.employees)) {
            this.employees = employeeData.employees.filter((emp: any) => emp.isActive);
          }
        }
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  loadSalaries(): void {
    this.loading = true;
    console.log('🔄 EmployeeSalaries: Loading salaries with request:', { pageNumber: this.currentPage, pageSize: this.pageSize });

    const request: any = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    if (this.searchTerm) {
      request.searchTerm = this.searchTerm;
    }

    console.log('🔄 EmployeeSalaries: Making API call with request:', request);
    this.financialService.getEmployeeSalaries(request).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('✅ EmployeeSalaries: API response received:', response);
        console.log('✅ EmployeeSalaries: Response structure:', {
          isSuccess: response.isSuccess,
          hasData: !!response.data,
          dataType: typeof response.data,
          dataIsArray: Array.isArray(response.data),
          dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
        });

        if (response.isSuccess && response.data) {
          // Handle the actual API response structure
          if (response.data.items && Array.isArray(response.data.items)) {
            this.salaries = response.data.items;
            this.totalCount = response.data.totalCount || response.data.items.length;
            this.totalPages = response.data.totalPages || Math.ceil(this.totalCount / this.pageSize);
            console.log('✅ EmployeeSalaries: Using paginated data structure');
          } else if (Array.isArray(response.data)) {
            this.salaries = response.data;
            this.totalCount = response.data.length;
            this.totalPages = Math.ceil(this.totalCount / this.pageSize);
            console.log('✅ EmployeeSalaries: Using direct array structure');
          } else {
            this.salaries = [];
            this.totalCount = 0;
            this.totalPages = 0;
            console.log('⚠️ EmployeeSalaries: Unknown data structure');
          }

          console.log('✅ EmployeeSalaries: Salaries loaded:', this.salaries.length, 'items');
          console.log('✅ EmployeeSalaries: Total count:', this.totalCount);
          console.log('✅ EmployeeSalaries: Total pages:', this.totalPages);

          // Filter by salary type if needed
          if (this.filterSalaryType !== null) {
            this.salaries = this.salaries.filter(s => s.salaryType === this.filterSalaryType);
          }

          // Calculate stats
          this.calculateStats();
        } else {
          console.log('⚠️ EmployeeSalaries: No data or unsuccessful response');
          this.salaries = [];
          this.totalCount = 0;
          this.totalPages = 0;
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ EmployeeSalaries: Error loading salaries:', error);
        console.error('❌ EmployeeSalaries: Error status:', error.status);
        console.error('❌ EmployeeSalaries: Error message:', error.message);
        this.salaries = [];
      }
    });
  }

  calculateStats(): void {
    this.totalSalaries = this.salaries.length;
    this.monthlySalaries = this.salaries.filter(s => s.salaryType === 1).length;
    this.hourlySalaries = this.salaries.filter(s => s.salaryType === 2).length;
    this.totalAmount = this.salaries.reduce((sum, s) => sum + (s.amount || 0), 0);
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadSalaries();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadSalaries();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterSalaryType = null;
    this.currentPage = 1;
    this.pageSize = 20;
    this.loadSalaries();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadSalaries();
    }
  }

  getSalaryTypeBadgeClass(salaryType: string | number): string {
    // Convert numeric salary types to string format
    let typeString = salaryType;
    if (typeof salaryType === 'number') {
      switch (salaryType) {
        case 0: typeString = 'PerDay'; break;
        case 1: typeString = 'PerWeek'; break;
        case 2: typeString = 'PerMonth'; break;
        case 3: typeString = 'PerHour'; break;
        case 4: typeString = 'Custom'; break;
        default: typeString = 'PerMonth';
      }
    }

    switch (typeString) {
      case 'PerMonth':
        return 'badge-month';
      case 'PerWeek':
        return 'badge-week';
      case 'PerDay':
        return 'badge-day';
      case 'PerHour':
        return 'badge-hour';
      case 'Custom':
        return 'badge-custom';
      default:
        return 'badge-secondary';
    }
  }

  getSalaryTypeString(salaryType: string | number): string {
    // Convert numeric salary types to string format for translation
    if (typeof salaryType === 'number') {
      switch (salaryType) {
        case 0: return 'PerDay';
        case 1: return 'PerWeek';
        case 2: return 'PerMonth';
        case 3: return 'PerHour';
        case 4: return 'Custom';
        default: return 'PerMonth';
      }
    }
    return salaryType;
  }

  getSalaryTypeEnum(salaryType: string | number): SalaryType {
    // Convert numeric salary types to enum format
    if (typeof salaryType === 'number') {
      console.log('🔄 getSalaryTypeEnum: Converting number to enum:', salaryType);
      switch (salaryType) {
        case 0: return SalaryType.PerDay;
        case 1: return SalaryType.PerWeek;
        case 2: return SalaryType.PerMonth;
        case 3: return SalaryType.PerHour;
        case 4: return SalaryType.Custom;
        default: return SalaryType.PerMonth;
      }
    }
    console.log('🔄 getSalaryTypeEnum: Already enum or string:', salaryType);
    return salaryType as unknown as SalaryType;
  }

  convertSalaryTypeToNumber(salaryType: SalaryType): number {
    // Enum now returns integer values directly
    console.log('🔄 convertSalaryTypeToNumber: Input salaryType:', salaryType, 'Type:', typeof salaryType);
    return salaryType as number;
  }

  openCreateDialog(): void {
    this.isEditMode = false;
    this.selectedSalary = null;
    this.resetForm();
    this.showDialog = true;
  }

  openUpdateDialog(salary: EmployeeSalaryDto): void {
    this.isEditMode = true;
    this.selectedSalary = salary;

    console.log('🔄 openUpdateDialog: Original salary:', salary);
    console.log('🔄 openUpdateDialog: salary.salaryType:', salary.salaryType, 'Type:', typeof salary.salaryType);

    const convertedSalaryType = this.getSalaryTypeEnum(salary.salaryType);
    console.log('🔄 openUpdateDialog: Converted salaryType:', convertedSalaryType, 'Type:', typeof convertedSalaryType);

    this.form = {
      employeeId: salary.employeeId,
      salaryType: convertedSalaryType,
      amount: salary.amount,
      notes: salary.notes || '',
      hourlyRate: salary.hourlyRate || null,
      overtimeRate: salary.overtimeRate || null
    };

    console.log('🔄 openUpdateDialog: Final form:', this.form);
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.resetForm();
  }

  resetForm(): void {
    this.form = {
      employeeId: null,
      salaryType: SalaryType.PerMonth, // Default 2
      amount: null,
      notes: '',
      hourlyRate: null,
      overtimeRate: null
    };
  }

  onSalaryTypeChange(): void {
    // If PerHour (3), clear base amount and allow hourly rate
    // Actually per requirement: "when type is hourly disable base salary"
    // We'll enforce this in the UI mostly, but here we can clean up the data.

    if (this.form.salaryType === SalaryType.PerHour) {
      // Base salary might be irrelevant, but we keep it or set to 0? 
      // User asked to DISABLE base salary. We better reset it to 0 or null if it's disabled?
      // Let's keep existing logic primarily but ensure hourly rate is handled.
    } else {
      // Reset hourly rate if not PerHour/Custom (depends on logic)
      this.form.hourlyRate = null;
    }

    // Reset hourly rates if not PerHour type or Custom
    if (this.form.salaryType !== SalaryType.PerHour && this.form.salaryType !== SalaryType.Custom) {
      this.form.hourlyRate = null;
    }
  }

  isFormValid(): boolean {
    if (this.isEditMode) {
      // For edit mode, following partial update logic - no fields are strictly required
      // But if provided, they must meet the constraints

      // Amount constraint: >= 0 if provided
      if (this.form.amount !== null && this.form.amount < 0) {
        return false;
      }

      // Notes constraint: max 300 characters if provided
      if (this.form.notes && this.form.notes.length > 300) {
        return false;
      }

      // Hourly rate constraint: >= 0 if provided
      if (this.form.hourlyRate !== null && this.form.hourlyRate < 0) {
        return false;
      }

      // Overtime rate constraint: >= 0 if provided
      if (this.form.overtimeRate !== null && this.form.overtimeRate < 0) {
        return false;
      }

      return true;
    } else {
      // For create mode:
      // - Employee is always required
      // - For PerHour/Custom types: hourly rate is required, amount is not
      // - For other types: amount is required, hourly rate is not

      const isPerHourOrCustom = this.form.salaryType === SalaryType.PerHour || this.form.salaryType === SalaryType.Custom;

      return (
        this.form.employeeId !== null &&
        // If PerHour/Custom: validate hourly rate, otherwise validate amount
        (isPerHourOrCustom
          ? (this.form.hourlyRate !== null && this.form.hourlyRate >= 0)
          : (this.form.amount !== null && this.form.amount >= 0)
        ) &&
        // Additional constraints for creation
        (!this.form.notes || this.form.notes.length <= 300) &&
        (this.form.overtimeRate === null || this.form.overtimeRate >= 0)
      );
    }
  }

  saveSalary(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.saving = true;

    if (this.isEditMode && this.selectedSalary) {
      // Update - Following business logic for partial updates
      const updateDto: UpdateEmployeeSalaryDto = {};

      // Calculate type change
      const newSalaryTypeNumber = this.convertSalaryTypeToNumber(this.form.salaryType);
      // selectedSalary.salaryType comes as number from API, but we ensure correct comparison
      const oldSalaryTypeEnum = this.getSalaryTypeEnum(this.selectedSalary.salaryType);
      const oldSalaryTypeNumber = this.convertSalaryTypeToNumber(oldSalaryTypeEnum);
      const typeChanged = newSalaryTypeNumber !== oldSalaryTypeNumber;

      // Always include salaryType in update to ensure it's sent properly
      updateDto.salaryType = newSalaryTypeNumber;

      // Handling Amount: If Hourly/Custom, Base Salary should be 0 (or cleared)
      // If user switches from Monthly -> Hourly, amount input is disabled (value remains).
      // We should force it to 0 so the backend knows to clear the base salary.
      let amountToSend = this.form.amount;
      if (newSalaryTypeNumber === SalaryType.PerHour || newSalaryTypeNumber === SalaryType.Custom) {
        amountToSend = 0;
      }

      // Update amount if changed OR if type changed (to force the 0 or new value)
      if (amountToSend !== null && (typeChanged || amountToSend !== this.selectedSalary.amount)) {
        updateDto.amount = amountToSend;
      }

      // Only update notes if they're different (following partial update logic)
      const currentNotes = this.selectedSalary.notes || '';
      if (this.form.notes !== currentNotes) {
        updateDto.notes = this.form.notes || undefined;
      }

      // Only update hourly rate if salary type is PerHour or Custom
      // For PerMonth and PerDay, hourly rate is calculated automatically by the backend
      if (this.form.salaryType === SalaryType.PerHour || this.form.salaryType === SalaryType.Custom) {
        // Always include hourly rate if type involves hourly calculation
        // It's safer to send it even if unchanged, especially when type changes
        // Use undefined if null to satisfy type checker
        updateDto.hourlyRate = this.form.hourlyRate !== null ? this.form.hourlyRate : undefined;
      }

      // Overtime rate is always editable for all salary types
      if (this.form.overtimeRate !== null && this.form.overtimeRate !== (this.selectedSalary.overtimeRate || 0)) {
        updateDto.overtimeRate = this.form.overtimeRate;
      }

      console.log('🔄 EmployeeSalaries: Updating salary with partial data:', updateDto);
      console.log('🔄 EmployeeSalaries: Original salary:', this.selectedSalary);
      console.log('🔄 EmployeeSalaries: Type Changed:', typeChanged);

      this.financialService.updateEmployeeSalary(this.selectedSalary.id, updateDto).subscribe({
        next: (response) => {
          this.saving = false;
          if (response.isSuccess) {
            this.showSuccessMessage(this.translate.instant('SalaryUpdatedSuccessfully'));
            this.closeDialog();
            this.loadSalaries();
          } else {
            this.showErrorMessage(response.message || this.translate.instant('UpdateFailed'));
          }
        },
        error: (error) => {
          this.saving = false;
          console.error('Error updating salary:', error);
          this.showErrorMessage(this.translate.instant('UpdateFailed'));
        }
      });
    } else {
      // Create - Handle different salary types
      const isPerHourOrCustom = this.form.salaryType === SalaryType.PerHour || this.form.salaryType === SalaryType.Custom;

      const createDto: CreateEmployeeSalaryDto = {
        employeeId: this.form.employeeId!,
        salaryType: this.convertSalaryTypeToNumber(this.form.salaryType),
        // For PerHour/Custom: set amount to 0, otherwise use the form amount
        amount: isPerHourOrCustom ? 0 : this.form.amount!,
        notes: this.form.notes || undefined
      };

      // Only include hourly rate for PerHour and Custom types
      // For PerMonth and PerDay, backend will calculate hourly rate automatically
      if (this.form.salaryType === SalaryType.PerHour || this.form.salaryType === SalaryType.Custom) {
        createDto.hourlyRate = this.form.hourlyRate || undefined;
      }

      // Overtime rate is always included if provided (editable for all types)
      if (this.form.overtimeRate !== null && this.form.overtimeRate !== undefined) {
        createDto.overtimeRate = this.form.overtimeRate;
      }

      console.log('🔄 EmployeeSalaries: Creating new salary:', createDto);

      this.financialService.createEmployeeSalary(createDto).subscribe({
        next: (response) => {
          this.saving = false;
          if (response.isSuccess) {
            this.showSuccessMessage(this.translate.instant('SalaryCreatedSuccessfully'));
            this.closeDialog();
            this.loadSalaries();
          } else {
            console.error('❌ EmployeeSalaries: Response failed:', response);
            const msg = response.message || '';
            if (msg.includes('already has') || msg.includes('exists') || msg.includes('Conflict')) {
              this.showErrorMessage(this.translate.instant('EmployeeAlreadyHasSalary'));
            } else {
              this.showErrorMessage(msg || this.translate.instant('CreationFailed'));
            }
          }
        },
        error: (error) => {
          this.saving = false;
          console.error('Error creating salary:', error);

          let isDuplicate = false;

          // Check status code (409 Conflict is standard for duplicates)
          if (error.status === 409) {
            isDuplicate = true;
          }

          // Check error message content
          if (!isDuplicate) {
            const errorBody = error.error;
            const errorMsg = (typeof errorBody === 'string' ? errorBody : errorBody?.message) || error.message || '';

            if (errorMsg.includes('already has') || errorMsg.includes('exists') || errorMsg.includes('Conflict')) {
              isDuplicate = true;
            }
          }

          if (isDuplicate) {
            this.showErrorMessage(this.translate.instant('EmployeeAlreadyHasSalary'));
          } else {
            this.showErrorMessage(this.translate.instant('CreationFailed'));
          }
        }
      });
    }
  }

  confirmDelete(salary: EmployeeSalaryDto): void {
    this.salaryToDelete = salary;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
    this.salaryToDelete = null;
  }

  deleteSalary(): void {
    if (!this.salaryToDelete) {
      return;
    }

    this.deleting = true;

    this.financialService.deleteEmployeeSalary(this.salaryToDelete.id).subscribe({
      next: (response) => {
        this.deleting = false;
        if (response.isSuccess) {
          this.showSuccessMessage(this.translate.instant('SalaryDeletedSuccessfully'));
          this.closeDeleteDialog();
          this.loadSalaries();
        } else {
          this.showErrorMessage(response.message || this.translate.instant('DeletionFailed'));
        }
      },
      error: (error) => {
        this.deleting = false;
        console.error('Error deleting salary:', error);
        this.showErrorMessage(this.translate.instant('DeletionFailed'));
      }
    });
  }

  private showSuccessMessage(message: string): void {
    // You can implement a toast notification service here
    alert(message);
  }

  private showErrorMessage(message: string): void {
    // You can implement a toast notification service here
    alert(message);
  }

  // Create Report Dialog Methods
  openCreateReportDialog(salary: EmployeeSalaryDto): void {
    this.selectedEmployee = salary;
    this.resetCreateReportForm();
    this.showCreateReportDialog = true;
  }

  closeCreateReportDialog(): void {
    this.showCreateReportDialog = false;
    this.selectedEmployee = null;
    this.creatingReport = false;
    this.resetCreateReportForm();
  }

  resetCreateReportForm(): void {
    const currentDate = new Date();
    this.createReportForm = {
      reportMonth: currentDate.getMonth() + 1,
      reportYear: currentDate.getFullYear(),
      fromDate: '',
      toDate: '',
      notes: ''
    };
  }

  createSalaryReport(): void {
    console.log('🔄 EmployeeSalaries: createSalaryReport called');
    console.log('🔄 EmployeeSalaries: selectedEmployee:', this.selectedEmployee);
    console.log('🔄 EmployeeSalaries: createReportForm:', this.createReportForm);

    if (!this.selectedEmployee || !this.createReportForm.reportMonth || !this.createReportForm.reportYear) {
      console.error('❌ EmployeeSalaries: Missing required data:', {
        selectedEmployee: this.selectedEmployee,
        reportMonth: this.createReportForm.reportMonth,
        reportYear: this.createReportForm.reportYear
      });
      return;
    }

    this.creatingReport = true;

    const createReportDto: CreateSalaryReportDto = {
      employeeId: this.selectedEmployee.employeeId,
      reportMonth: this.createReportForm.reportMonth,
      reportYear: this.createReportForm.reportYear,
      fromDate: this.createReportForm.fromDate ? new Date(this.createReportForm.fromDate).toISOString() : undefined,
      toDate: this.createReportForm.toDate ? new Date(this.createReportForm.toDate).toISOString() : undefined,
      notes: this.createReportForm.notes || undefined
    };

    console.log('🔄 EmployeeSalaries: Creating salary report with data:', {
      dto: createReportDto,
      selectedEmployee: this.selectedEmployee,
      form: this.createReportForm
    });

    // Validate data before sending
    if (!createReportDto.employeeId || !createReportDto.reportMonth || !createReportDto.reportYear) {
      console.error('❌ EmployeeSalaries: Invalid data:', createReportDto);
      this.creatingReport = false;
      this.showErrorMessage(this.translate.instant('InvalidData'));
      return;
    }

    // Check if month is valid (1-12)
    if (createReportDto.reportMonth < 1 || createReportDto.reportMonth > 12) {
      console.error('❌ EmployeeSalaries: Invalid month:', createReportDto.reportMonth);
      this.creatingReport = false;
      this.showErrorMessage(this.translate.instant('InvalidMonth'));
      return;
    }

    // Check if year is valid (2020-2030)
    if (createReportDto.reportYear < 2020 || createReportDto.reportYear > 2030) {
      console.error('❌ EmployeeSalaries: Invalid year:', createReportDto.reportYear);
      this.creatingReport = false;
      this.showErrorMessage(this.translate.instant('InvalidYear'));
      return;
    }

    // First, let's check if the employee has the required data
    this.checkEmployeeDataBeforeReport(createReportDto);
  }

  checkEmployeeDataBeforeReport(dto: CreateSalaryReportDto): void {
    console.log('🔍 EmployeeSalaries: Checking employee data before creating report...');

    // Check if employee has salary data
    this.financialService.getEmployeeSalaryByEmployeeId(dto.employeeId).subscribe({
      next: (salaryResponse) => {
        if (!salaryResponse.isSuccess || !salaryResponse.data) {
          console.error('❌ EmployeeSalaries: Employee has no salary data:', salaryResponse);
          this.creatingReport = false;
          this.showErrorMessage(this.translate.instant('EmployeeHasNoSalaryData'));
          return;
        }

        console.log('✅ EmployeeSalaries: Employee salary data found:', salaryResponse.data);

        // Check if employee has work rule assigned from the salary data
        if (!salaryResponse.data.workRule) {
          // Employee doesn't have a work rule assigned
          this.creatingReport = false;
          this.showWorkRuleRequiredDialog();
          return;
        }

        // Employee has work rule, proceed with salary calculation
        console.log('✅ EmployeeSalaries: Employee work rule found, proceeding with report creation');
        this.proceedWithReportCreation(dto);
      },
      error: (error) => {
        console.error('❌ EmployeeSalaries: Error checking employee salary:', error);
        this.creatingReport = false;
        this.showErrorMessage(this.translate.instant('ErrorCheckingEmployeeData'));
      }
    });
  }

  private showWorkRuleRequiredDialog(): void {
    const employeeName = this.selectedEmployee?.employeeName || `Employee #${this.selectedEmployee?.employeeId}`;
    const message = this.translate.instant('WorkRuleRequiredMessage', { employeeName });

    // Show a dialog or alert asking admin to assign work rule
    if (confirm(message + '\n\n' + this.translate.instant('AssignWorkRuleQuestion'))) {
      // Navigate to work rules page
      this.router.navigate(['/admin/financial/work-rules']);
    }
  }

  proceedWithReportCreation(dto: CreateSalaryReportDto): void {
    console.log('🚀 EmployeeSalaries: Proceeding with report creation...');

    this.financialService.calculateSalary(dto).subscribe({
      next: (response) => {
        this.creatingReport = false;
        console.log('📡 EmployeeSalaries: API Response received:', response);

        if (response.isSuccess && response.data) {
          // Show success message
          const employeeName = this.selectedEmployee?.employeeName || `Employee #${this.selectedEmployee?.employeeId}`;
          const successMessage = this.translate.instant('ReportCreatedSuccessfully', { employeeName });
          console.log('✅ EmployeeSalaries: Salary report created successfully:', response.data);

          // Close dialog
          this.closeCreateReportDialog();

          // Navigate to salary report details page
          const reportId = response.data.id;
          console.log('🔄 EmployeeSalaries: Navigating to report details with ID:', reportId);
          this.router.navigate(['/admin/financial/salary-reports', reportId]);
        } else {
          const errorMessage = response.message || this.translate.instant('ReportCreationFailed', {
            employeeName: this.selectedEmployee?.employeeName || `Employee #${this.selectedEmployee?.employeeId}`
          });
          console.error('❌ EmployeeSalaries: Failed to create salary report:', errorMessage);
          this.showErrorMessage(errorMessage);
        }
      },
      error: (error) => {
        this.creatingReport = false;
        console.error('❌ EmployeeSalaries: Error creating salary report:', error);

        // Log detailed error information
        if (error.error) {
          console.error('❌ EmployeeSalaries: Error details:', error.error);
        }

        const errorMessage = this.translate.instant('ReportCreationFailed', {
          employeeName: this.selectedEmployee?.employeeName || `Employee #${this.selectedEmployee?.employeeId}`
        });
        this.showErrorMessage(errorMessage);
      }
    });
  }
}
