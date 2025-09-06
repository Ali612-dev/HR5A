import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AttendanceService } from '../core/attendance.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface DeleteAttendanceState {
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

const initialState: DeleteAttendanceState = {
  isLoading: false,
  error: null,
  isSuccess: false,
};

export const DeleteAttendanceStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const attendanceService = inject(AttendanceService);
    const translate = inject(TranslateService);

    return {
      deleteAttendance(id: number) {
        patchState(store, { isLoading: true, error: null, isSuccess: false });

        attendanceService.deleteAttendance(id).pipe(
          tap({
            next: (response) => {
              if (response.isSuccess) {
                patchState(store, { isLoading: false, isSuccess: true });
              } else {
                patchState(store, { error: response.message || translate.instant('ERROR.DELETE_ATTENDANCE_FAILED'), isLoading: false });
              }
            },
            error: (err) => {
              console.error('Error deleting attendance:', err);
              patchState(store, { error: translate.instant('ERROR.DELETE_ATTENDANCE_ERROR'), isLoading: false });
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