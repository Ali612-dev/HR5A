import { environment } from '../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

// Check if we're using Vercel API proxy (production) or direct API (development)
const isUsingVercelAPI = environment.apiBaseUrl === '/api';

export const API_ENDPOINTS = {
  LOGIN: isUsingVercelAPI ? '/auth/login' : '/api/Auth/login',
  REGISTER: isUsingVercelAPI ? '/auth/employee-register' : '/api/Auth/employee-register',
  DASHBOARD_STATS: isUsingVercelAPI ? '/dashboard/stats' : '/api/Dashboard',
  REQUESTS: isUsingVercelAPI ? '/request' : '/api/Request',
  LatestRequestsDashboard: isUsingVercelAPI ? '/request/latest' : '/api/Request/GetLatestApprovedRequests',
  UPDATE_REQUEST_STATUS: isUsingVercelAPI ? '/request/update-status' : '/api/Request/update-status',
  EMPLOYEE: isUsingVercelAPI ? '/employee' : '/api/Employee',
  AllEmployeesAttendances: isUsingVercelAPI ? '/attendance/daily' : '/api/Attendance/daily',
  EmployeeAttendanceHistory: isUsingVercelAPI ? '/attendance/history' : '/api/Attendance/history',
  AddEmployeeAttendance: isUsingVercelAPI ? '/attendance' : '/api/Attendance',
  UpdateEmployeeAttendance: isUsingVercelAPI ? '/attendance' : '/api/Attendance',
  DeleteEmployeeAttendance: isUsingVercelAPI ? '/attendance' : '/api/Attendance',
  WHATSAPP_SEND_SINGLE_MESSAGE: isUsingVercelAPI ? '/whatsapp/send-single' : '/api/Whatsapp/send-single',
  WHATSAPP_SEND_GROUP_MESSAGE: isUsingVercelAPI ? '/whatsapp/send-group' : '/api/Whatsapp/send-group',
};
