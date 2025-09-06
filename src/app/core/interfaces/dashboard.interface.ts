export interface DashboardStatsResponseData {
  totalEmployees: number;
  employeesAttendedToday: number;
  pendingRequestsCount: number;
  approvedRequestsCount: number;
  rejectedRequestsCount: number;
}

export interface ApiResponse<T> {
  data: T | null;
  message: string | null;
  isSuccess: boolean;
  errors: string[];
}
