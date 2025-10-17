import { environment } from '../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

// Check if we're using Vercel proxy (production only)
const isUsingVercelProxy = environment.apiBaseUrl === '/api/proxy';

export const API_ENDPOINTS = {
  LOGIN: isUsingVercelProxy ? '?path=/api/Auth/admin-login' : '/api/Auth/admin-login',
  REGISTER: isUsingVercelProxy ? '?path=/api/Auth/employee-register' : '/api/Auth/employee-register',
  DASHBOARD_STATS: isUsingVercelProxy ? '?path=/api/Dashboard' : '/api/Dashboard',
  REQUESTS: isUsingVercelProxy ? '?path=/api/Request' : '/api/Request',
  LatestRequestsDashboard: isUsingVercelProxy ? '?path=/api/Request/GetLatestApprovedRequests' : '/api/Request/GetLatestApprovedRequests',
  UPDATE_REQUEST_STATUS: isUsingVercelProxy ? '?path=/api/Request/update-status' : '/api/Request/update-status',
  EMPLOYEE: isUsingVercelProxy ? '?path=/api/Employee' : '/api/Employee',
  AllEmployeesAttendances: isUsingVercelProxy ? '?path=/api/Attendance/daily' : '/api/Attendance/daily',
  EmployeeAttendanceHistory: isUsingVercelProxy ? '?path=/api/Attendance/history' : '/api/Attendance/history',
  AddEmployeeAttendance: isUsingVercelProxy ? '?path=/api/Attendance' : '/api/Attendance',
  UpdateEmployeeAttendance: isUsingVercelProxy ? '?path=/api/Attendance' : '/api/Attendance',
  DeleteEmployeeAttendance: isUsingVercelProxy ? '?path=/api/Attendance' : '/api/Attendance',
  WHATSAPP_SEND_SINGLE_MESSAGE: isUsingVercelProxy ? '?path=/api/Whatsapp/send-single' : '/api/Whatsapp/send-single',
  WHATSAPP_SEND_GROUP_MESSAGE: isUsingVercelProxy ? '?path=/api/Whatsapp/send-group' : '/api/Whatsapp/send-group',
  // Financial Module Endpoints
  WORK_RULES: isUsingVercelProxy ? '?path=/api/WorkRule' : '/api/WorkRule',
  WORK_RULE_DETAILS: isUsingVercelProxy ? '?path=/api/WorkRule' : '/api/WorkRule',
  WORK_RULE_UNASSIGN: isUsingVercelProxy ? '?path=/api/WorkRule' : '/api/WorkRule',
  EMPLOYEE_SALARIES: isUsingVercelProxy ? '?path=/api/EmployeeSalary' : '/api/EmployeeSalary',
  SALARY_REPORTS: isUsingVercelProxy ? '?path=/api/SalaryReport' : '/api/SalaryReport',
  BONUSES: isUsingVercelProxy ? '?path=/api/Bonus' : '/api/Bonus',
  DEDUCTIONS: isUsingVercelProxy ? '?path=/api/Deduction' : '/api/Deduction',
  FINANCIAL_STATS: isUsingVercelProxy ? '?path=/api/FinancialDashboard' : '/api/FinancialDashboard',
};
