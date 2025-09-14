import { environment } from '../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;
export const API_ENDPOINTS = {
  LOGIN: '/api/Auth/login',
  REGISTER: '/api/Auth/employee-register',
  DASHBOARD_STATS: '/api/Dashboard',
  REQUESTS: '/api/Request',
  LatestRequestsDashboard: '/api/Request/GetLatestApprovedRequests',
  UPDATE_REQUEST_STATUS: '/api/Request/update-status',
  EMPLOYEE: '/api/Employee',
  AllEmployeesAttendances: '/api/Attendance/daily',
  EmployeeAttendanceHistory: '/api/Attendance/history',
  AddEmployeeAttendance: '/api/Attendance',
  UpdateEmployeeAttendance: '/api/Attendance',
  DeleteEmployeeAttendance: '/api/Attendance',
  WHATSAPP_SEND_SINGLE_MESSAGE: '/api/Whatsapp/send-single',
  WHATSAPP_SEND_GROUP_MESSAGE: '/api/Whatsapp/send-group',
};
