import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { EmployeeDto, GetEmployeesRequest, GetEmployeesResponseData } from '../core/interfaces/employee.interface';
import { EmployeeService } from '../core/employee.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface EmployeeState {
  employees: EmployeeDto[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  request: GetEmployeesRequest;
}

const initialState: EmployeeState = {
  employees: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  request: {
    pageNumber: 1,
    pageSize: 10,
    sortField: 'name',
    sortOrder: 'asc',
  },
};

export const EmployeeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, employeeService = inject(EmployeeService), translate = inject(TranslateService)) => ({
    loadEmployees() {
      patchState(store, { isLoading: true, error: null });

      console.log('🔄 EmployeeStore: Loading employees with request:', store.request());

      employeeService.getAllEmployees(store.request()).pipe(
        tap({
          next: (response) => {
            console.log('📥 EmployeeStore: API Response received:', {
              isSuccess: response.isSuccess,
              dataExists: !!response.data,
              employeeCount: response.data?.employees?.length,
              totalCount: response.data?.totalCount,
              message: response.message
            });
            
            if (response.isSuccess && response.data) {
              patchState(store, {
                employees: response.data.employees,
                totalCount: response.data.totalCount,
                isLoading: false,
              });
            } else {
              console.error('❌ EmployeeStore: API failed with response:', response);
              patchState(store, { error: translate.instant('ERROR.FAILED_TO_LOAD_EMPLOYEES'), isLoading: false });
            }
          },
          error: (err) => {
            console.error(err);
            patchState(store, { error: translate.instant('ERROR.FETCH_EMPLOYEES_ERROR'), isLoading: false });
          },
        })
      ).subscribe();
    },
    updateRequest(request: Partial<GetEmployeesRequest>) {
      const newRequest = { ...store.request(), ...request };
      console.log('🔄 EmployeeStore: Updating request:', {
        oldRequest: store.request(),
        partialUpdate: request,
        newRequest: newRequest
      });
      
      patchState(store, { request: newRequest });
      this.loadEmployees();
    },
  }))
);
