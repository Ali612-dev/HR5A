import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { AttendanceService } from '../core/attendance.service';
import { MonthlyWorkedHoursResponse } from '../core/interfaces/attendance.interface';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface MonthlyWorkedHoursState {
    data: MonthlyWorkedHoursResponse | null;
    isLoading: boolean;
    error: string | null;
    isSuccess: boolean;
}

const initialState: MonthlyWorkedHoursState = {
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
};

export const MonthlyWorkedHoursStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods((store) => {
        const attendanceService = inject(AttendanceService);
        const translate = inject(TranslateService);

        return {
            loadMonthlyHours(employeeId: number) {
                patchState(store, { isLoading: true, error: null, isSuccess: false, data: null });

                attendanceService.getMonthlyWorkedHours(employeeId).pipe(
                    tap({
                        next: (response) => {
                            if (response.isSuccess && response.data) {
                                patchState(store, {
                                    data: response.data,
                                    isLoading: false,
                                    isSuccess: true,
                                });
                            } else {
                                patchState(store, {
                                    error: response.message || translate.instant('ERROR.FETCH_MONTHLY_HOURS_FAILED'),
                                    isLoading: false,
                                });
                            }
                        },
                        error: (err) => {
                            console.error('Error fetching monthly hours:', err);
                            patchState(store, {
                                error: translate.instant('ERROR.FETCH_MONTHLY_HOURS_ERROR'),
                                isLoading: false,
                            });
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
