import {signalStore, withState, withMethods, patchState} from '@ngrx/signals';
import { computed } from '@angular/core';

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null; // You might want to define a more specific User interface
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('authToken') || null,
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setLoading(loading: boolean) {
      patchState(store, { loading });
    },
    setLoginSuccess(user: any, token: string) {
      localStorage.setItem('authToken', token);
      patchState(store, { isAuthenticated: true, user, token, loading: false, error: null });
    },
    setLoginFailure(error: string) {
      localStorage.removeItem('authToken');
      patchState(store, { isAuthenticated: false, user: null, token: null, loading: false, error });
    },
    logout() {
      localStorage.removeItem('authToken');
      patchState(store, { isAuthenticated: false, user: null, token: null, loading: false, error: null });
    },
  })),
);