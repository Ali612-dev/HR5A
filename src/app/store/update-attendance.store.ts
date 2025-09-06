import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AttendanceViewModel, UpdateAttendanceDto } from '../core/interfaces/attendance.interface';
import { AttendanceService } from '../core/attendance.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface UpdateAttendanceState {
  attendance: AttendanceViewModel | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

const initialState: UpdateAttendanceState = {
  attendance: null,
  isLoading: false,
  error: null,
  isSuccess: false,
};

export const UpdateAttendanceStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const attendanceService = inject(AttendanceService);
    const translate = inject(TranslateService);

    return {
      updateAttendance(attendance: UpdateAttendanceDto) {
        patchState(store, { isLoading: true, error: null, isSuccess: false });

        attendanceService.updateAttendance(attendance).pipe(
          tap({
            next: (response) => {
              if (response.isSuccess && response.data) {
                patchState(store, { attendance: response.data, isLoading: false, isSuccess: true });
              } else {
                patchState(store, { error: response.message || translate.instant('ERROR.UPDATE_ATTENDANCE_FAILED'), isLoading: false, isSuccess: false });
              }
            },
            error: (err) => {
              console.error('Error updating attendance:', err);
              let errorMessage = translate.instant('ERROR.UPDATE_ATTENDANCE_ERROR'); // Default generic error

              if (err.status === 500) {
                errorMessage = translate.instant('ERROR.SERVER_ERROR');
              } else if (err.error && err.error.message) {
                errorMessage = err.error.message;
              } else if (err.message) {
                errorMessage = err.message;
              }
              patchState(store, { error: errorMessage, isLoading: false, isSuccess: false });
            },
          })
        ).subscribe();
      },
      resetState() {
        patchState(store, initialState);
      },
    };
  })
);