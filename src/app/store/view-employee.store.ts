
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { EmployeeDto } from '../core/interfaces/employee.interface';
import { EmployeeService } from '../core/employee.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface ViewEmployeeState {
  employee: EmployeeDto | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ViewEmployeeState = {
  employee: null,
  isLoading: false,
  error: null,
};

export const ViewEmployeeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const employeeService = inject(EmployeeService);
    const translate = inject(TranslateService);

    return {
      loadEmployee(id: number) {
        patchState(store, { isLoading: true, error: null });

        employeeService.getEmployeeById(id).pipe(
          tap({
            next: (response) => {
              if (response.isSuccess && response.data) {
                patchState(store, { employee: response.data, isLoading: false });
              } else {
                patchState(store, { error: response.message || translate.instant('ERROR.LOAD_EMPLOYEE_FAILED'), isLoading: false });
              }
            },
            error: (err) => {
              console.error('Error loading employee:', err);
              patchState(store, { error: translate.instant('ERROR.LOAD_EMPLOYEE_ERROR'), isLoading: false });
            },
          })
        ).subscribe();
      },
    };
  })
);
