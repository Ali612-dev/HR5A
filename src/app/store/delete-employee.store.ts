import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { EmployeeService } from '../core/employee.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface DeleteEmployeeState {
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

const initialState: DeleteEmployeeState = {
  isLoading: false,
  error: null,
  isSuccess: false,
};

export const DeleteEmployeeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const employeeService = inject(EmployeeService);
    const translate = inject(TranslateService);

    return {
      deleteEmployee(id: number) {
        patchState(store, { isLoading: true, error: null, isSuccess: false });

        employeeService.deleteEmployee(id).pipe(
          tap({
            next: (response) => {
              if (response.isSuccess) {
                patchState(store, { isLoading: false, isSuccess: true });
              } else {
                patchState(store, { error: response.message || translate.instant('ERROR.DELETE_EMPLOYEE_FAILED'), isLoading: false });
              }
            },
            error: (err) => {
              console.error('Error deleting employee:', err);
              patchState(store, { error: translate.instant('ERROR.DELETE_EMPLOYEE_ERROR'), isLoading: false });
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