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

      employeeService.getAllEmployees(store.request()).pipe(
        tap({
          next: (response) => {
            console.log('🔍 Employee API Response:', response);
            console.log('📊 Data structure:', response.data);
            console.log('👥 Employees count:', response.data?.employees?.length);
            console.log('📈 Total count:', response.data?.totalCount);
            
            if (response.isSuccess && response.data) {
              patchState(store, {
                employees: response.data.employees,
                totalCount: response.data.totalCount,
                isLoading: false,
              });
            } else {
              console.error('❌ Employee API failed:', response);
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
      patchState(store, { request: { ...store.request(), ...request } });
      this.loadEmployees();
    },
  }))
);
