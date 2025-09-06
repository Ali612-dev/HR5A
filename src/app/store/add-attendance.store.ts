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
              patchState(store, { error: err.error.message || 'ERROR.ADD_ATTENDANCE_ERROR', isLoading: false, isSuccess: false });
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
