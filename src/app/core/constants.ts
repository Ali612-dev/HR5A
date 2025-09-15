import { environment } from '../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

// Check if we're using the proxy (production) or direct API (development)
const isUsingProxy = environment.apiBaseUrl.includes('/api/proxy');

export const API_ENDPOINTS = {
  LOGIN: isUsingProxy ? '/Auth/login' : '/api/Auth/login',
  REGISTER: isUsingProxy ? '/Auth/employee-register' : '/api/Auth/employee-register',
  DASHBOARD_STATS: isUsingProxy ? '/Dashboard' : '/api/Dashboard',
  REQUESTS: isUsingProxy ? '/Request' : '/api/Request',
  LatestRequestsDashboard: isUsingProxy ? '/Request/GetLatestApprovedRequests' : '/api/Request/GetLatestApprovedRequests',
  UPDATE_REQUEST_STATUS: isUsingProxy ? '/Request/update-status' : '/api/Request/update-status',
  EMPLOYEE: isUsingProxy ? '/Employee' : '/api/Employee',
  AllEmployeesAttendances: isUsingProxy ? '/Attendance/daily' : '/api/Attendance/daily',
  EmployeeAttendanceHistory: isUsingProxy ? '/Attendance/history' : '/api/Attendance/history',
  AddEmployeeAttendance: isUsingProxy ? '/Attendance' : '/api/Attendance',
  UpdateEmployeeAttendance: isUsingProxy ? '/Attendance' : '/api/Attendance',
  DeleteEmployeeAttendance: isUsingProxy ? '/Attendance' : '/api/Attendance',
  WHATSAPP_SEND_SINGLE_MESSAGE: isUsingProxy ? '/Whatsapp/send-single' : '/api/Whatsapp/send-single',
  WHATSAPP_SEND_GROUP_MESSAGE: isUsingProxy ? '/Whatsapp/send-group' : '/api/Whatsapp/send-group',
};
