import { environment } from '../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

// Check if we're using Vercel proxy
const isUsingProxy = environment.apiBaseUrl === '/api/proxy';

export const API_ENDPOINTS = {
  LOGIN: isUsingProxy ? '?path=/api/Auth/login' : '/api/Auth/login',
  REGISTER: isUsingProxy ? '?path=/api/Auth/employee-register' : '/api/Auth/employee-register',
  DASHBOARD_STATS: isUsingProxy ? '?path=/api/Dashboard' : '/api/Dashboard',
  REQUESTS: isUsingProxy ? '?path=/api/Request' : '/api/Request',
  LatestRequestsDashboard: isUsingProxy ? '?path=/api/Request/GetLatestApprovedRequests' : '/api/Request/GetLatestApprovedRequests',
  UPDATE_REQUEST_STATUS: isUsingProxy ? '?path=/api/Request/update-status' : '/api/Request/update-status',
  EMPLOYEE: isUsingProxy ? '?path=/api/Employee' : '/api/Employee',
  AllEmployeesAttendances: isUsingProxy ? '?path=/api/Attendance/daily' : '/api/Attendance/daily',
  EmployeeAttendanceHistory: isUsingProxy ? '?path=/api/Attendance/history' : '/api/Attendance/history',
  AddEmployeeAttendance: isUsingProxy ? '?path=/api/Attendance' : '/api/Attendance',
  UpdateEmployeeAttendance: isUsingProxy ? '?path=/api/Attendance' : '/api/Attendance',
  DeleteEmployeeAttendance: isUsingProxy ? '?path=/api/Attendance' : '/api/Attendance',
  WHATSAPP_SEND_SINGLE_MESSAGE: isUsingProxy ? '?path=/api/Whatsapp/send-single' : '/api/Whatsapp/send-single',
  WHATSAPP_SEND_GROUP_MESSAGE: isUsingProxy ? '?path=/api/Whatsapp/send-group' : '/api/Whatsapp/send-group',
};
