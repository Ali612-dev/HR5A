import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AttendanceViewModel, GetDailyAttendanceDto, PaginatedAttendanceResponseDto } from '../core/interfaces/attendance.interface';
import { AttendanceService } from '../core/attendance.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface AttendanceState {
  attendances: AttendanceViewModel[];
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

      attendanceService.getDailyAttendance(store.request()).pipe(
        tap({
          next: (response) => {
            if (response.isSuccess && response.data) {
              patchState(store, {
                attendances: response.data.attendances,
                totalCount: response.data.totalCount,
                isLoading: false,
              });
            } else {
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
      patchState(store, { request: { ...store.request(), ...request } });
      this.loadDailyAttendances();
    },
  }))
);
