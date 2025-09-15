import { environment } from '../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

// Check if we're using the proxy (production) or direct API (development)
const isUsingProxy = environment.apiBaseUrl.includes('/api/proxy');

export const API_ENDPOINTS = {
  LOGIN: isUsingProxy ? '?path=Auth/login' : '/api/Auth/login',
  REGISTER: isUsingProxy ? '?path=Auth/employee-register' : '/api/Auth/employee-register',
  DASHBOARD_STATS: isUsingProxy ? '?path=Dashboard' : '/api/Dashboard',
  REQUESTS: isUsingProxy ? '?path=Request' : '/api/Request',
  LatestRequestsDashboard: isUsingProxy ? '?path=Request/GetLatestApprovedRequests' : '/api/Request/GetLatestApprovedRequests',
  UPDATE_REQUEST_STATUS: isUsingProxy ? '?path=Request/update-status' : '/api/Request/update-status',
  EMPLOYEE: isUsingProxy ? '?path=Employee' : '/api/Employee',
  AllEmployeesAttendances: isUsingProxy ? '?path=Attendance/daily' : '/api/Attendance/daily',
  EmployeeAttendanceHistory: isUsingProxy ? '?path=Attendance/history' : '/api/Attendance/history',
  AddEmployeeAttendance: isUsingProxy ? '?path=Attendance' : '/api/Attendance',
  UpdateEmployeeAttendance: isUsingProxy ? '?path=Attendance' : '/api/Attendance',
  DeleteEmployeeAttendance: isUsingProxy ? '?path=Attendance' : '/api/Attendance',
  WHATSAPP_SEND_SINGLE_MESSAGE: isUsingProxy ? '?path=Whatsapp/send-single' : '/api/Whatsapp/send-single',
  WHATSAPP_SEND_GROUP_MESSAGE: isUsingProxy ? '?path=Whatsapp/send-group' : '/api/Whatsapp/send-group',
};
