import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { CreateEmployeeDto, EmployeeDto } from '../core/interfaces/employee.interface';
import { EmployeeService } from '../core/employee.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface AddEmployeeState {
  employee: CreateEmployeeDto | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

const initialState: AddEmployeeState = {
  employee: null,
  isLoading: false,
  error: null,
  isSuccess: false,
};

export const AddEmployeeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const employeeService = inject(EmployeeService);
    const translate = inject(TranslateService);

    return {
      addEmployee(employee: CreateEmployeeDto) {
        patchState(store, { isLoading: true, error: null, isSuccess: false });

        employeeService.createEmployee(employee).pipe(
          tap({
            next: (response) => {
              if (response.isSuccess && response.data) {
                patchState(store, { employee: response.data, isLoading: false, isSuccess: true });
              } else {
                patchState(store, { error: response.message || translate.instant('ERROR.ADD_EMPLOYEE_FAILED'), isLoading: false, isSuccess: false });
              }
            },
            error: (err) => {
              console.error('Error adding employee:', err);
              patchState(store, { error: translate.instant('ERROR.ADD_EMPLOYEE_ERROR'), isLoading: false, isSuccess: false });
            },
          })
        ).subscribe();
      },
      updateEmployee(employee: EmployeeDto) {
        patchState(store, { isLoading: true, error: null, isSuccess: false });

        employeeService.updateEmployee(employee).pipe(
          tap({
            next: (response) => {
              if (response.isSuccess && response.data) {
                patchState(store, { employee: response.data, isLoading: false, isSuccess: true });
              } else {
                patchState(store, { error: response.message || translate.instant('ERROR.UPDATE_EMPLOYEE_FAILED'), isLoading: false, isSuccess: false });
              }
            },
            error: (err) => {
              console.error('Error updating employee:', err);
              patchState(store, { error: translate.instant('ERROR.UPDATE_EMPLOYEE_ERROR'), isLoading: false, isSuccess: false });
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
