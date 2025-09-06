import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AttendanceViewModel, GetEmployeeAttendanceHistoryDto, PaginatedEmployeeAttendanceHistoryResponseDto } from '../core/interfaces/attendance.interface';
import { AttendanceService } from '../core/attendance.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface EmployeeAttendanceHistoryState {
  attendances: AttendanceViewModel[];
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
                patchState(store, {
                  attendances: response.data.attendances,
                  totalCount: response.data.totalCount,
                  isLoading: false,
                });
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
