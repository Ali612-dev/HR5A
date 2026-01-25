import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AddAttendanceDto, AttendanceViewModel } from '../core/interfaces/attendance.interface';
import { AttendanceService } from '../core/attendance.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface AddAttendanceState {
  attendance: AttendanceViewModel | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

const initialState: AddAttendanceState = {
  attendance: null,
  isLoading: false,
  error: null,
  isSuccess: false,
};

export const AddAttendanceStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const attendanceService = inject(AttendanceService);
    const translate = inject(TranslateService);

    return {
      addAttendance(attendance: AddAttendanceDto) {
        patchState(store, { isLoading: true, error: null, isSuccess: false });

        attendanceService.addAttendance(attendance).pipe(
          tap({
            next: (response) => {
              if (response.isSuccess && response.data) {
                patchState(store, { attendance: response.data, isLoading: false, isSuccess: true });
              } else {
                patchState(store, { error: response.message || translate.instant('ERROR.ADD_ATTENDANCE_FAILED'), isLoading: false, isSuccess: false });
              }
            },
            error: (err) => {
              console.error('Error adding attendance:', err);
              let errorMessage = 'ERROR.ADD_ATTENDANCE_ERROR';

              if (err.status === 400) {
                errorMessage = 'ERROR.BAD_REQUEST';
              } else if (err.status === 500) {
                errorMessage = 'ERROR.SERVER_ERROR';
              } else if (err.error && err.error.message) {
                // If it's a known technical message, we could map it here
                // For now, if it's already a string, we can use it, but prefer localized defaults
                errorMessage = err.error.message;
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
