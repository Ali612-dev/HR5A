import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { GroupedAttendanceViewModel, GetDailyAttendanceDto, PaginatedAttendanceResponseDto } from '../core/interfaces/attendance.interface';
import { AttendanceService } from '../core/attendance.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface AttendanceState {
  attendances: GroupedAttendanceViewModel[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  request: GetDailyAttendanceDto;
}

const initialState: AttendanceState = {
  attendances: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  request: {
    date: new Date().toISOString().split('T')[0], // Set current date as default
    pageNumber: 1,
    pageSize: 10,
    sortField: 'date',
    sortOrder: 'desc',
  },
};

export const AttendanceStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, attendanceService = inject(AttendanceService), translate = inject(TranslateService)) => ({
    loadDailyAttendances() {
      patchState(store, { isLoading: true, error: null });

      console.log('🔄 AttendanceStore: Loading attendances with request:', store.request());

      attendanceService.getDailyAttendance(store.request()).pipe(
        tap({
          next: (response) => {
            if (response.isSuccess && response.data) {
              const data = response.data as any;

              // Handle various response structures (array vs object with nested array)
              const rawAttendances = Array.isArray(data) ? data : (data.groupedAttendances || data.attendances || data.items || []);

              // Manually group/merge records by employeeId and date to ensure one row per day
              const mergedAttendances = rawAttendances.reduce((acc: any[], current: any) => {
                if (!current) return acc;

                // Use employeeId and date part as the grouping key
                const dateKey = current.date?.split('T')[0] || 'no-date';
                const key = `${current.employeeId}-${dateKey}`;

                const existingIndex = acc.findIndex(a => {
                  const aDateKey = a.date?.split('T')[0] || 'no-date';
                  return `${a.employeeId}-${aDateKey}` === key;
                });

                if (existingIndex > -1) {
                  const existing = acc[existingIndex];
                  // Merge sessions and ensure uniqueness by session ID
                  const allSessions = [...(existing.sessions || []), ...(current.sessions || [])];
                  existing.sessions = Array.from(new Map(allSessions.map(s => [s.id, s])).values());
                  existing.sessionsCount = existing.sessions.length;

                  // Update stats
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

              const totalCount = data.totalItemCount || data.totalCount || data.count || mergedAttendances.length;

              patchState(store, {
                attendances: mergedAttendances as GroupedAttendanceViewModel[],
                totalCount: totalCount,
                isLoading: false,
                error: null,
              });
            } else if (response.isSuccess && !response.data) {
              patchState(store, {
                attendances: [],
                totalCount: 0,
                isLoading: false,
                error: null,
              });
            } else {
              console.error('❌ AttendanceStore: API failed with response:', response);
              patchState(store, { error: 'ERROR.FAILED_TO_LOAD_ATTENDANCES', isLoading: false });
            }
          },
          error: (err) => {
            const message = err?.error?.message || 'ERROR.FETCH_ATTENDANCES_ERROR';
            patchState(store, { error: message, isLoading: false });
          },
        })
      ).subscribe();
    },
    updateRequest(request: Partial<GetDailyAttendanceDto>) {
      const newRequest = { ...store.request(), ...request };
      console.log('🔄 AttendanceStore: Updating request:', {
        oldRequest: store.request(),
        partialUpdate: request,
        newRequest: newRequest
      });

      patchState(store, { request: newRequest });
      this.loadDailyAttendances();
    },
  }))
);
