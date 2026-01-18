import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { GroupedAttendanceViewModel, GetEmployeeAttendanceHistoryDto } from '../core/interfaces/attendance.interface';
import { AttendanceService } from '../core/attendance.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface EmployeeAttendanceHistoryState {
  attendances: GroupedAttendanceViewModel[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  request: GetEmployeeAttendanceHistoryDto;
}

const initialState: EmployeeAttendanceHistoryState = {
  attendances: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  request: {
    employeeId: 0, // Will be set from route param
    pageNumber: 1,
    pageSize: 10,
    sortField: 'date',
    sortOrder: 'desc',
  },
};

export const EmployeeAttendanceHistoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const attendanceService = inject(AttendanceService);
    const translate = inject(TranslateService);

    return {
      loadEmployeeAttendanceHistory() {
        patchState(store, { isLoading: true, error: null });

        attendanceService.getEmployeeAttendanceHistory(store.request()).pipe(
          tap({
            next: (response) => {
              if (response.isSuccess && response.data) {
                const data = response.data as any;
                const rawAttendances = Array.isArray(data.attendances) ? data.attendances : (data.items || []);

                // Safeguard: Manually group/merge records by date to ensure one row per day
                const mergedAttendances = rawAttendances.reduce((acc: any[], current: any) => {
                  if (!current) return acc;

                  const dateKey = current.date?.split('T')[0] || 'no-date';
                  const key = dateKey; // Simple key for history as it's for one employee

                  const existingIndex = acc.findIndex(a => (a.date?.split('T')[0] || 'no-date') === key);

                  if (existingIndex > -1) {
                    const existing = acc[existingIndex];
                    const allSessions = [...(existing.sessions || []), ...(current.sessions || [])];
                    existing.sessions = Array.from(new Map(allSessions.map(s => [s.id, s])).values());
                    existing.sessionsCount = existing.sessions.length;

                    if (current.firstCheckIn && (!existing.firstCheckIn || new Date(current.firstCheckIn) < new Date(existing.firstCheckIn))) {
                      existing.firstCheckIn = current.firstCheckIn;
                    }
                    if (current.lastCheckOut && (!existing.lastCheckOut || new Date(current.lastCheckOut) > new Date(existing.lastCheckOut))) {
                      existing.lastCheckOut = current.lastCheckOut;
                    }
                    if (current.status === 'Present' || existing.status === 'Present') {
                      existing.status = 'Present';
                    }
                    existing.totalWorkedHours = existing.sessions.reduce((sum: number, s: any) => sum + (s.hours || 0), 0);
                    acc[existingIndex] = existing;
                  } else {
                    acc.push({ ...current });
                  }
                  return acc;
                }, []);

                patchState(store, {
                  attendances: mergedAttendances as GroupedAttendanceViewModel[],
                  totalCount: data.totalCount || data.totalItemCount || mergedAttendances.length,
                  isLoading: false,
                });
              } else if (response.isSuccess && !response.data) {
                patchState(store, { attendances: [], totalCount: 0, isLoading: false });
              } else {
                patchState(store, { error: response.message || translate.instant('ERROR.FAILED_TO_LOAD_EMPLOYEE_HISTORY'), isLoading: false });
              }
            },
            error: (err) => {
              console.error(err);
              patchState(store, { error: 'ERROR.FETCH_EMPLOYEE_HISTORY_ERROR', isLoading: false });
            },
          })
        ).subscribe();
      },
      updateRequest(request: Partial<GetEmployeeAttendanceHistoryDto>) {
        patchState(store, { request: { ...store.request(), ...request } });
        this.loadEmployeeAttendanceHistory();
      },
      setEmployeeId(employeeId: number) {
        patchState(store, { request: { ...store.request(), employeeId } });
      }
    };
  })
);
