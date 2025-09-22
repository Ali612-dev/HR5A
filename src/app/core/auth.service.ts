import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { API_BASE_URL, API_ENDPOINTS } from './constants';
import { AuthStore } from '../store/auth.store';
import { LoginRequest, LoginResponseData, ApiResponse, RegisterRequest } from './interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStore = inject(AuthStore);

  constructor(private http: HttpClientService) { }

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponseData>> {
    this.authStore.setLoading(true);
    const url = `${API_BASE_URL}${API_ENDPOINTS.LOGIN}`;
    return this.http.post<ApiResponse<LoginResponseData>>(url, credentials).pipe(
      tap({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.authStore.setLoginSuccess(response.data, response.data.token);
          } else {
            this.authStore.setLoginFailure(response.message || response.errors.join(', ') || 'Unknown login error');
          }
        },
        error: (err) => {
          this.authStore.setLoginFailure(err.message || 'API call error');
        }
      })
    );
  }

  register(request: RegisterRequest): Observable<ApiResponse<any>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.REGISTER}`;
    console.log('🔗 AuthService: Register endpoint URL:', url);
    console.log('🔗 AuthService: Register request data:', request);
    return this.http.post<ApiResponse<any>>(url, request);
  }

  logout(): void {
    this.authStore.logout();
  }

  isTokenExpired(token: string): boolean {
    if (!token) return true;

    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      if (!decodedToken.exp) return true;

      const expirationDate = new Date(decodedToken.exp * 1000);
      return expirationDate < new Date();
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  getDecodedToken(token: string): any | null {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}