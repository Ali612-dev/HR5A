import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { FinancialService } from '../core/services/financial.service';
import { TranslateService } from '@ngx-translate/core';
import { ApiResponse, SalaryReportDto, FinancialRequest } from '../core/interfaces/financial.interface';

export interface SalaryReportsState {
  reports: SalaryReportDto[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  request: FinancialRequest;
}

const initialState: SalaryReportsState = {
  reports: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  request: {
    pageNumber: 1,
    pageSize: 10,
    sortField: 'generatedDate',
    sortOrder: 'desc'
  }
};

export const SalaryReportsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, financialService = inject(FinancialService), translate = inject(TranslateService)) => ({
    loadSalaryReports: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          console.log('🔄 SalaryReportsStore: Loading salary reports with request:', store.request());
          
          return financialService.getSalaryReports(store.request()).pipe(
            tap({
              next: (response) => {
                console.log('📥 SalaryReportsStore: API Response received:', {
                  isSuccess: response.isSuccess,
                  dataExists: !!response.data,
                  reportsCount: response.data?.length,
                  message: response.message
                });
                
                // Log employee names for debugging
                if (response.data && response.data.length > 0) {
                  console.log('👥 Employee names in response:', response.data.map(r => r.employeeName));
                }
                
                if (response.isSuccess && response.data) {
                  patchState(store, {
                    reports: response.data,
                    totalCount: response.data.length, // API doesn't return total count, using array length
                    isLoading: false,
                  });
                } else {
                  console.error('❌ SalaryReportsStore: API failed with response:', response);
                  patchState(store, { error: translate.instant('FailedToLoadSalaryReports'), isLoading: false });
                }
              },
              error: (err) => {
                console.error('❌ SalaryReportsStore: Error loading salary reports:', err);
                const message = err?.error?.message || translate.instant('FailedToLoadSalaryReports');
                patchState(store, { error: message, isLoading: false });
              },
            })
          );
        }),
        catchError((err) => {
          console.error('❌ SalaryReportsStore: Catch error:', err);
          patchState(store, { error: translate.instant('FailedToLoadSalaryReports'), isLoading: false });
          return of(null);
        })
      )
    ),

    updateRequest(request: Partial<FinancialRequest>) {
      patchState(store, { request: { ...store.request(), ...request } });
    },

    setPage(pageNumber: number) {
      patchState(store, { request: { ...store.request(), pageNumber } });
    },

    setPageSize(pageSize: number) {
      patchState(store, { request: { ...store.request(), pageSize, pageNumber: 1 } });
    },

    setSorting(sortField: string, sortOrder: 'asc' | 'desc') {
      patchState(store, { request: { ...store.request(), sortField, sortOrder } });
    },

    setSearchTerm(searchTerm: string) {
      patchState(store, { request: { ...store.request(), searchTerm, pageNumber: 1 } });
    },

    setEmployeeFilter(employeeId: number | undefined) {
      patchState(store, { request: { ...store.request(), employeeId, pageNumber: 1 } });
    },

    setMonthFilter(month: number | undefined) {
      patchState(store, { request: { ...store.request(), month, pageNumber: 1 } });
    },

    setYearFilter(year: number | undefined) {
      patchState(store, { request: { ...store.request(), year, pageNumber: 1 } });
    },

    setPaidFilter(isPaid: boolean | undefined) {
      patchState(store, { request: { ...store.request(), isPaid, pageNumber: 1 } });
    },

    clearError() {
      patchState(store, { error: null });
    },

    retryLoadReports() {
      this.clearError();
      this.loadSalaryReports();
    }
  }))
);
