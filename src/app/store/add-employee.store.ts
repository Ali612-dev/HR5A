import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { CreateEmployeeDto, EmployeeDto } from '../core/interfaces/employee.interface';
import { EmployeeService } from '../core/employee.service';
import { inject } from '@angular/core';
import { tap, switchMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../core/auth.service';
import { RegisterRequest, CreateUserRequest, UpdateUserCredentialsRequest } from '../core/interfaces/auth.interface';
import { throwError, EMPTY } from 'rxjs';

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
    const authService = inject(AuthService);

    const coalesceErrors = (errors: unknown): string | null => {
      if (!errors) {
        return null;
      }

      if (Array.isArray(errors)) {
        return errors
          .map((err) => (typeof err === 'string' ? err.trim() : ''))
          .filter((err) => err.length > 0)
          .join(', ');
      }

      if (typeof errors === 'object') {
        const values = Object.values(errors as Record<string, unknown>);
        const collected: string[] = [];

        values.forEach((value) => {
          if (Array.isArray(value)) {
            value.forEach((item) => {
              if (typeof item === 'string' && item.trim().length > 0) {
                collected.push(item.trim());
              }
            });
          } else if (typeof value === 'string' && value.trim().length > 0) {
            collected.push(value.trim());
          }
        });

        if (collected.length > 0) {
          return collected.join(', ');
        }
      }

      if (typeof errors === 'string') {
        return errors.trim();
      }

      return null;
    };

    const buildErrorMessage = (
      message: string | null | undefined,
      errors: unknown,
      fallbackKey: string
    ): string => {
      const extracted = coalesceErrors(errors);
      return (message && message.trim().length > 0)
        ? message
        : (extracted && extracted.length > 0)
          ? extracted
          : translate.instant(fallbackKey);
    };

    return {
      addEmployee(employee: CreateEmployeeDto, user: CreateUserRequest) {
        patchState(store, { isLoading: true, error: null, isSuccess: false });

        const registerRequest: RegisterRequest = {
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          cardNumber: employee.cardNumber,
          email: user.email ?? undefined,
          department: employee.department ?? undefined,
          username: user.username,
          userName: user.username,
          password: user.password
        };

        authService.register(registerRequest).pipe(
          switchMap((registerResponse) => {
            if (!registerResponse.isSuccess) {
              const errorMessage = buildErrorMessage(
                registerResponse.message,
                registerResponse.errors,
                'ERROR.USER_CREATION_FAILED'
              );

              console.error('Error creating user for employee:', registerResponse);
              patchState(store, { error: errorMessage, isLoading: false, isSuccess: false });
              return throwError(() => new Error(errorMessage));
            }

            const userId = registerResponse.data?.userId ?? null;
            const existingEmployeeId = registerResponse.data?.employeeId ?? null;

            if (existingEmployeeId) {
              const registeredEmployee: CreateEmployeeDto = {
                ...employee,
                userId: userId ?? undefined
              };

              patchState(store, { employee: registeredEmployee, isLoading: false, isSuccess: true });
              return EMPTY;
            }

            const employeePayload = userId ? { ...employee, userId } : employee;

            return employeeService.createEmployee(employeePayload);
          }),
          tap({
            next: (response) => {
              if (response.isSuccess && response.data) {
                patchState(store, { employee: response.data, isLoading: false, isSuccess: true });
              } else {
                const errorMessage = buildErrorMessage(
                  response.message,
                  response.errors,
                  'ERROR.ADD_EMPLOYEE_FAILED'
                );

                patchState(store, { error: errorMessage, isLoading: false, isSuccess: false });
              }
            },
            error: (err) => {
              console.error('Error adding employee:', err);
              const errorMessage = buildErrorMessage(
                err?.error?.message || err?.message,
                err?.error?.errors,
                'ERROR.ADD_EMPLOYEE_ERROR'
              );
              patchState(store, { error: errorMessage, isLoading: false, isSuccess: false });
            },
          })
        ).subscribe();
      },
      updateEmployee(employee: EmployeeDto, userUpdate?: { userId: number; credentials: UpdateUserCredentialsRequest }) {
        patchState(store, { isLoading: true, error: null, isSuccess: false });

        const update$ = userUpdate
          ? authService.updateUserCredentials(userUpdate.userId, userUpdate.credentials).pipe(
              switchMap((userResponse) => {
                if (!userResponse.isSuccess) {
                  const errorMessage = buildErrorMessage(
                    userResponse.message,
                    userResponse.errors,
                    'ERROR.UPDATE_EMPLOYEE_FAILED'
                  );

                  console.error('Error updating user:', userResponse);
                  patchState(store, { error: errorMessage, isLoading: false, isSuccess: false });
                  return throwError(() => new Error(errorMessage));
                }

                return employeeService.updateEmployee(employee);
              })
            )
          : employeeService.updateEmployee(employee);

        update$.pipe(
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
              const errorMessage = buildErrorMessage(
                err?.error?.message || err?.message,
                err?.error?.errors,
                'ERROR.UPDATE_EMPLOYEE_ERROR'
              );
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
