export interface AddAttendanceDto {
  employeeId: number;
  date: string; // ISO date string
  timeIn: string; // ISO datetime string
  timeOut?: string | null; // ISO datetime string
  locationName?: string | null;
  status?: string | null; // e.g., "Present"
  attType?: number;
  type?: number;
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
  checkInLat?: number;
  checkInLng?: number;
  checkOutLat?: number;
  checkOutLng?: number;
  department?: string;
}

export interface GetDailyAttendanceDto {
  date?: string; // ISO date string
  searchName?: string;
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

export interface AttendanceSession {
  id: number;
  timeIn: string; // ISO datetime string
  timeOut?: string; // ISO datetime string
  hours: number;
  latitude: number;
  longitude: number;
  outLatitude?: number;
  outLongitude?: number;
  locationName?: string;
}

export interface GroupedAttendanceViewModel {
  employeeId: number;
  employeeName: string;
  date: string; // ISO date string
  firstCheckIn: string; // ISO datetime string
  lastCheckOut?: string; // ISO datetime string
  totalWorkedHours: number;
  sessionsCount: number;
  hasUnclosedSession: boolean;
  isOvernightShift: boolean;
  sessions: AttendanceSession[];
  status: string;
}

export interface PaginatedAttendanceResponseDto {
  attendances: GroupedAttendanceViewModel[];
  totalCount: number;
  totalItemCount?: number;
}

export interface PaginatedEmployeeAttendanceHistoryResponseDto {
  attendances: AttendanceViewModel[];
  totalCount: number;
}

export interface UpdateAttendanceDto {
  id: number;
  employeeId?: number | null;
  date?: string | null;
  timeIn?: string | null;
  timeOut?: string | null;
  locationName?: string | null;
  status?: string | null;
  attType?: number | null;
  type?: number | null;
}

export interface MonthlyWorkedHoursResponse {
  employeeId: number;
  totalWorkedHours: number;
  month: number;
  year: number;
}
