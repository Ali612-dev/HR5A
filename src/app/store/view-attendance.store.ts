import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AttendanceViewModel } from '../core/interfaces/attendance.interface';
import { AttendanceService } from '../core/attendance.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface ViewAttendanceState {
  attendance: AttendanceViewModel | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ViewAttendanceState = {
  attendance: null,
  isLoading: false,
  error: null,
};

export const ViewAttendanceStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const attendanceService = inject(AttendanceService);
    const translate = inject(TranslateService);

    return {
      loadAttendance(id: number) {
        patchState(store, { isLoading: true, error: null });

        attendanceService.getAttendanceById(id).pipe(
          tap({
            next: (response) => {
              if (response.isSuccess && response.data) {
                patchState(store, { attendance: response.data, isLoading: false });
              } else {
                // Use translate.get() for async translation
                translate.get('ERROR.LOAD_ATTENDANCE_FAILED').subscribe(translatedMessage => {
                  patchState(store, {
                    error: response.message || translatedMessage,
                    isLoading: false
                  });
                });
              }
            },
            error: (err) => {
              console.error('Error loading attendance:', err);
              // Use translate.get() for async translation
              translate.get('ERROR.LOAD_ATTENDANCE_ERROR').subscribe(translatedMessage => {
                patchState(store, {
                  error: translatedMessage,
                  isLoading: false
                });
              });
            },
          })
        ).subscribe();
      },
    };
  })
);
