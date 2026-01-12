import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { CreateEmployeeDto, EmployeeDto } from '../core/interfaces/employee.interface';
import { EmployeeService } from '../core/employee.service';
import { inject } from '@angular/core';
import { tap, switchMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../core/auth.service';
import { RegisterRequest, CreateUserRequest, UpdateUserCredentialsRequest } from '../core/interfaces/auth.interface';
import { throwError, of } from 'rxjs';
import { FinancialService } from '../core/services/financial.service';
import { CreateEmployeeSalaryDto } from '../core/interfaces/financial.interface';

export interface AddEmployeeState {
  employee: CreateEmployeeDto | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

interface AddEmployeeFinancialPayload {
  workRuleId: number;
  shiftId: number;
  salary: {
    salaryType: number;
    amount: number;
    notes?: string;
    hourlyRate?: number;
    overtimeRate?: number;
  };
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
    const financialService = inject(FinancialService);

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

    const runFinancialSetup = (employeeId: number, payload?: AddEmployeeFinancialPayload) => {
      if (!payload || !payload.workRuleId || !payload.shiftId || !payload.salary) {
        return of(true);
      }

      const assignWorkRule$ = financialService.assignWorkRule(payload.workRuleId, { employeeIds: [employeeId] }).pipe(
        switchMap((response) => {
          if (!response.isSuccess) {
            const errorMessage = buildErrorMessage(
              response.message,
              response.errors,
              'ERROR.ASSIGN_WORK_RULE_FAILED'
            );
            return throwError(() => new Error(errorMessage));
          }
          return of(response);
        })
      );

      const assignShift$ = () => financialService.assignEmployeeToShift(payload.shiftId, employeeId).pipe(
        switchMap((response) => {
          if (!response.isSuccess) {
            const errorMessage = buildErrorMessage(
              response.message,
              response.errors,
              'ERROR.ASSIGN_SHIFT_FAILED'
            );
            return throwError(() => new Error(errorMessage));
          }
          return of(response);
        })
      );

      const salaryDto: CreateEmployeeSalaryDto = {
        employeeId,
        salaryType: payload.salary.salaryType,
        amount: payload.salary.amount,
        notes: payload.salary.notes,
        hourlyRate: payload.salary.hourlyRate,
        overtimeRate: payload.salary.overtimeRate
      };

      const createSalary$ = () => financialService.createEmployeeSalary(salaryDto).pipe(
        switchMap((response) => {
          if (!response.isSuccess) {
            const errorMessage = buildErrorMessage(
              response.message,
              response.errors,
              'ERROR.CREATE_SALARY_FAILED'
            );
            return throwError(() => new Error(errorMessage));
          }
          return of(response);
        })
      );

      return assignWorkRule$.pipe(
        switchMap(() => assignShift$()),
        switchMap(() => createSalary$()),
        switchMap(() => of(true))
      );
    };

    return {
      addEmployee(employee: CreateEmployeeDto, user: CreateUserRequest, financialSetup?: AddEmployeeFinancialPayload) {
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

            const employeePayload = userId ? { ...employee, userId } : employee;

            if (existingEmployeeId) {
              const registeredEmployee: EmployeeDto = {
                ...(employeePayload as EmployeeDto),
                id: existingEmployeeId,
                userId: userId ?? undefined,
                joinedDate: (employeePayload as any).joinedDate ?? new Date().toISOString()
              };

              return runFinancialSetup(existingEmployeeId, financialSetup).pipe(
                switchMap(() => of({
                  isSuccess: true,
                  data: registeredEmployee,
                  message: registerResponse.message ?? '',
                  errors: []
                }))
              );
            }

            return employeeService.createEmployee(employeePayload).pipe(
              switchMap((response) => {
                if (!response.isSuccess || !response.data) {
                  const errorMessage = buildErrorMessage(
                    response.message,
                    response.errors,
                    'ERROR.ADD_EMPLOYEE_FAILED'
                  );

                  patchState(store, { error: errorMessage, isLoading: false, isSuccess: false });
                  return throwError(() => new Error(errorMessage));
                }

                return runFinancialSetup(response.data.id, financialSetup).pipe(
                  switchMap(() => of(response))
                );
              })
            );
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
                  'ERROR.UPDATE_USER_CREDENTIALS_FAILED'
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

              // Extract user-friendly error message
              let errorMessage: string;

              // Check if it's an HTTP error with status code
              if (err?.status) {
                switch (err.status) {
                  case 400:
                    errorMessage = translate.instant('ERROR.INVALID_DATA');
                    break;
                  case 401:
                    errorMessage = translate.instant('ERROR.UNAUTHORIZED');
                    break;
                  case 403:
                    errorMessage = translate.instant('ERROR.FORBIDDEN');
                    break;
                  case 404:
                    errorMessage = translate.instant('ERROR.USER_NOT_FOUND');
                    break;
                  case 409:
                    errorMessage = translate.instant('ERROR.DUPLICATE_USERNAME_OR_EMAIL');
                    break;
                  case 500:
                    errorMessage = translate.instant('ERROR.SERVER_ERROR');
                    break;
                  default:
                    errorMessage = buildErrorMessage(
                      err?.error?.message || err?.message,
                      err?.error?.errors,
                      'ERROR.UPDATE_EMPLOYEE_ERROR'
                    );
                }
              } else {
                errorMessage = buildErrorMessage(
                  err?.error?.message || err?.message,
                  err?.error?.errors,
                  'ERROR.UPDATE_EMPLOYEE_ERROR'
                );
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
