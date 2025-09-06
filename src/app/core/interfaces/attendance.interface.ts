export interface AddAttendanceDto {
  employeeId: number;
  date: string; // ISO date string
  timeIn?: string; // ISO datetime string
  timeOut?: string; // ISO datetime string
  latitude?: number;
  longitude?: number;
  outLatitude?: number;
  outLongitude?: number;
  locationName?: string;
  time: string; // TimeSpan as string (e.g., "08:00:00")
  status?: string;
  attType: number;
}

export interface AttendanceViewModel {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string; // ISO date string
  timeIn?: string; // ISO datetime string
  timeOut?: string; // ISO datetime string
  latitude?: number;
  longitude?: number;
  outLatitude?: number;
  outLongitude?: number;
  locationName?: string;
  createdAt: string; // ISO datetime string
  time: string; // TimeSpan as string
  status?: string;
  attType: number;
}

export interface GetDailyAttendanceDto {
  date?: string; // ISO date string
  pageNumber?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetEmployeeAttendanceHistoryDto {
  employeeId: number;
  startDate?: string | null; // ISO date string
  endDate?: string | null; // ISO date string
  pageNumber?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedAttendanceResponseDto {
  attendances: AttendanceViewModel[];
  totalCount: number;
}

export interface PaginatedEmployeeAttendanceHistoryResponseDto {
  attendances: AttendanceViewModel[];
  totalCount: number;
}

export type UpdateAttendanceDto = Partial<AddAttendanceDto> & { id: number };
