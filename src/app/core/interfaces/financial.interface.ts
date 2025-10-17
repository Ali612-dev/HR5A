// Financial Module Interfaces

export interface ApiResponse<T> {
  data: T | null;
  message: string;
  isSuccess: boolean;
  errors: string[];
}

// Work Rules
export enum WorkRuleType {
  Regular = 'Regular',
  Flexible = 'Flexible',
  Shift = 'Shift'
}

export interface WorkRuleDto {
  id: number;
  category: string;
  type: WorkRuleType | number; // API returns numbers, interface expects enum
  expectStartTime?: string; // "HH:mm:ss"
  expectEndTime?: string; // "HH:mm:ss"
  expectedHoursPerDay?: number;
  expectedDaysPerWeek?: number;
  paymentFrequency?: number;
  description?: string;
  isPrivate: boolean;
  employeeId?: number;
  employeeCount: number;
  // New fields from detailed response
  lateArrivalToleranceMinutes?: number;
  earlyDepartureToleranceMinutes?: number;
  lateDeductionMinutesPerHour?: number;
  earlyDepartureDeductionMinutesPerHour?: number;
  overtimeMultiplier?: number;
  minimumOvertimeMinutes?: number;
  absenceDeductionMultiplier?: number;
  allowedAbsenceDaysPerMonth?: number;
  areOffDaysPaid?: boolean;
}

export interface CreateWorkRuleDto {
  category: string; // Required, max 100 chars
  type: WorkRuleType; // Required
  expectStartTime?: string; // "HH:mm:ss"
  expectEndTime?: string; // "HH:mm:ss"
  expectedHoursPerDay?: number; // 1-24
  expectedDaysPerWeek?: number; // 1-7
  description?: string;
  isPrivate?: boolean; // Default: false
  employeeId?: number;
}

export interface UpdateWorkRuleDto {
  category?: string; // Max 100 chars
  type?: WorkRuleType;
  expectStartTime?: string;
  expectEndTime?: string;
  expectedHoursPerDay?: number; // 1-24
  expectedDaysPerWeek?: number; // 1-7
  description?: string;
  isPrivate?: boolean;
  employeeId?: number;
}

// Employee Salaries
export enum SalaryType {
  PerDay = 0,
  PerMonth = 1,
  PerHour = 2,
  Custom = 3
}

export interface EmployeeSalaryDto {
  id: number;
  employeeId: number;
  employeeName?: string;
  salaryType: SalaryType | number; // API returns numbers, interface expects strings
  amount: number;
  notes?: string;
  hourlyRate?: number;
  overtimeRate?: number;
  workRule?: WorkRuleDto; // New field for work rule information
}

// Paginated response structure for Employee Salaries
export interface EmployeeSalaryResponse {
  items: EmployeeSalaryDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateEmployeeSalaryDto {
  employeeId: number; // Required
  salaryType: number; // Required - API expects numbers (0, 1, 2, 3)
  amount: number; // Required, >= 0
  notes?: string; // Max 300 chars
  hourlyRate?: number; // >= 0
  overtimeRate?: number; // >= 0
}

export interface UpdateEmployeeSalaryDto {
  salaryType?: number; // API expects numbers (0, 1, 2, 3)
  amount?: number; // >= 0
  notes?: string; // Max 300 chars
  hourlyRate?: number; // >= 0
  overtimeRate?: number; // >= 0
}

// Salary Reports
export interface SalaryReportDto {
  id: number;
  employeeId: number;
  employeeName?: string;
  employeePhoneNumber?: string;
  employeeCardNumber?: string;
  reportMonth: number; // 1-12
  reportYear: number;
  startDate: string; // ISO date
  endDate: string; // ISO date
  baseSalary: number;
  actualBaseSalary?: number; // New field
  totalExpectedHours: number;
  totalWorkedHours: number;
  expectedWorkingDays: number;
  actualAttendanceDays?: number; // New field
  totalOvertimeHours: number;
  totalOvertimePay: number;
  totalDeductions: number;
  totalBonuses: number;
  netCalculatedSalary: number;
  isPaid: boolean;
  paidDate?: string; // ISO date
  notes?: string;
  generatedDate: string; // ISO date
  deductions: DeductionDto[];
  bonuses: BonusDto[];
  workRule?: WorkRuleDto; // New field
}

// Detailed Salary Report with calculation breakdown and attendance analysis
export interface DetailedSalaryReportDto extends SalaryReportDto {
  deductionDetails: DeductionDto[];
  bonusDetails: BonusDto[];
  calculationBreakdown: CalculationBreakdownDto;
  attendanceAnalysis: AttendanceAnalysisDto;
}

export interface CalculationBreakdownDto {
  baseSalaryAmount: number;
  baseSalaryDescription: string;
  expectedHours: number;
  workedHours: number;
  hoursDeficit: number;
  hoursSurplus: number;
  hoursDescription: string;
  overtimeHours: number;
  overtimeRate: number;
  overtimePayment: number;
  overtimeDescription: string;
  totalDeductionsAmount: number;
  deductionsCount: number;
  deductionsDescription: string;
  totalBonusesAmount: number;
  bonusesCount: number;
  bonusesDescription: string;
  grossSalary: number;
  netSalary: number;
  finalCalculationDescription: string;
}

export interface AttendanceAnalysisDto {
  totalWorkingDays: number;
  daysWithAttendance: number;
  daysWithoutAttendance: number;
  regularDays: number;
  irregularDays: number;
  totalExpectedHours: number;
  totalWorkedHours: number;
  hoursDeficit: number;
  hoursSurplus: number;
  irregularAttendances: IrregularAttendanceDto[];
  regularDaysDescription: string;
  irregularDaysDescription: string;
  hoursAnalysisDescription: string;
}

export interface IrregularAttendanceDto {
  date: string; // ISO date
  formattedDate: string;
  dayOfWeek: string;
  expectedStartTime: string;
  expectedEndTime: string;
  expectedStartTimeFormatted: string;
  expectedEndTimeFormatted: string;
  actualTimeIn?: string; // ISO date-time
  actualTimeOut?: string; // ISO date-time
  actualTimeInFormatted: string;
  actualTimeOutFormatted: string;
  isLateArrival: boolean;
  isEarlyArrival: boolean;
  isLateDeparture: boolean;
  isEarlyDeparture: boolean;
  isAbsent: boolean;
  arrivalDifference?: string; // TimeSpan format
  departureDifference?: string; // TimeSpan format
  arrivalDifferenceFormatted: string;
  departureDifferenceFormatted: string;
  hoursWorked: number;
  expectedHours: number;
  hoursDifference: number;
  status: string;
  description: string;
  severity: 'Minor' | 'Moderate' | 'Major';
}

export interface CreateSalaryReportDto {
  employeeId: number; // Required
  reportMonth: number; // Required, 1-12
  reportYear: number; // Required, 2020-2030
  notes?: string; // Max 500 chars
}

// Bonuses
export interface BonusDto {
  id: number;
  employeeId: number;
  employeeName?: string;
  salaryReportId?: number;
  amount: number;
  reason: string;
  date: string; // ISO date
  isApplied: boolean;
}

export interface CreateBonusDto {
  employeeId: number; // Required
  amount: number; // Required, >= 0
  reason: string; // Required, max 500 chars
  date: string; // Required, ISO date
}

// Deductions
export interface DeductionDto {
  id: number;
  employeeId: number;
  employeeName?: string;
  salaryReportId?: number;
  amount: number;
  reason: string;
  date: string; // ISO date
  isApplied: boolean;
}

export interface CreateDeductionDto {
  employeeId: number; // Required
  amount: number; // Required, >= 0
  reason: string; // Required, max 500 chars
  date: string; // Required, ISO date
}

// Financial Dashboard Statistics
export interface FinancialStatsDto {
  totalWorkRules: number;
  generalWorkRules: number;
  customizedWorkRules: number;
  totalEmployeeSalaries: number;
  perMonthSalaries: number;
  perDaySalaries: number;
  perHourSalaries: number;
  totalBaseSalaries: number;
  totalSalaryReports: number;
  paidReports: number;
  unpaidReports: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  totalBonuses: number;
  appliedBonuses: number;
  unappliedBonuses: number;
  totalBonusAmount: number;
  unappliedBonusAmount: number;
  totalDeductions: number;
  appliedDeductions: number;
  unappliedDeductions: number;
  totalDeductionAmount: number;
  unappliedDeductionAmount: number;
  currentMonthReports: number;
  currentMonthTotalPayout: number;
  currentMonthPaidCount: number;
  currentMonthUnpaidCount: number;
}

// Request/Response interfaces for pagination
export interface FinancialRequest {
  pageNumber?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  searchTerm?: string;
  employeeId?: number;
  month?: number;
  year?: number;
  isPaid?: boolean;
  startDate?: string; // ISO date-time string
  endDate?: string;   // ISO date-time string
}

export interface FinancialResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Assign Work Rule
export interface AssignWorkRuleDto {
  employeeIds: number[];
}

// Work Rule Details
export interface AssignedEmployeeDto {
  id: number;
  name: string;
  phone: string;
  department?: string;
  email?: string;
  cardNumber: string;
  isActive: boolean;
  joinedDate?: string;
  salaryType?: string; // 'PerMonth' | 'PerDay' | 'PerHour'
  salaryAmount?: number;
}

export interface WorkRuleOffDayDto {
  id: number;
  dayOfWeek: string; // 'Monday' | 'Tuesday' | etc.
}

export interface WorkRuleDetailsDto {
  // Work Rule Info
  id: number;
  category: string;
  type: string | number; // 'Regular' | 'Flexible' | 'Shift' or 1 | 2 | 3
  expectStartTime?: string; // "08:00"
  expectEndTime?: string; // "16:00"
  expectedHoursPerDay?: number;
  expectedDaysPerWeek?: number;
  description?: string;
  isPrivate: boolean;
  employeeId?: number;
  
  // Assigned Employees
  assignedEmployees: AssignedEmployeeDto[];
  
  // Off Days
  offDays: WorkRuleOffDayDto[];
  
  // Statistics
  totalAssignedEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
}
