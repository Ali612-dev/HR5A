import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the auth token from localStorage
    const authToken = localStorage.getItem('authToken');
    
    console.log('🔍 AuthInterceptor: Processing request to:', request.url);
    console.log('🔍 AuthInterceptor: Has token:', !!authToken);
    console.log('🔍 AuthInterceptor: Token preview:', authToken ? authToken.substring(0, 20) + '...' : 'null');
    
    // Clone the request and add the authorization header if token exists
    if (authToken) {
      const authRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      return next.handle(authRequest).pipe(
        catchError((error: HttpErrorResponse) => {
          console.log('🚨 AuthInterceptor: Caught error:', error.status, error.url);
          
          // Check if it's a 401 error and we have a token
          if (error.status === 401 && authToken && !request.url.includes('/api/Auth/refresh-admin-token')) {
            console.log('🔄 AuthInterceptor: 401 error detected, attempting token refresh...');
            return this.handle401Error(request, next);
          }
          
          console.log('❌ AuthInterceptor: Not a 401 error or refresh endpoint, throwing error');
          return throwError(() => error);
        })
      );
    }
    
    // If no token, proceed with the original request
    console.log('⚠️ AuthInterceptor: No token found, proceeding without auth');
    return next.handle(request);
  }

  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const currentToken = localStorage.getItem('authToken');
      
      if (currentToken) {
        return this.refreshToken(currentToken).pipe(
          switchMap((response: any) => {
            this.isRefreshing = false;
            
            // Store the new token
            if (response && response.isSuccess && response.data && response.data.token) {
              const newToken = response.data.token;
              localStorage.setItem('authToken', newToken);
              this.refreshTokenSubject.next(newToken);
              
              // Retry the original request with the new token
              return next.handle(this.addTokenHeader(request, newToken));
            } else {
              throw new Error('Invalid token refresh response');
            }
          }),
          catchError((error) => {
            this.isRefreshing = false;
            // If refresh fails, redirect to login or clear token
            localStorage.removeItem('authToken');
            return throwError(() => error);
          })
        );
      }
    }

    // If already refreshing, wait for the new token
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token)))
    );
  }

  private refreshToken(token: string): Observable<any> {
    return new Observable(observer => {
      console.log('🔄 Attempting to refresh token...');
      
      fetch('http://172.20.208.1:6365/api/Auth/refresh-admin-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        console.log('📡 Token refresh response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('🔄 Token refresh response:', data);
        
        if (data && data.isSuccess && data.data && data.data.token) {
          console.log('✅ New token received:', data.data.token.substring(0, 20) + '...');
          observer.next(data);
          observer.complete();
        } else {
          console.error('❌ Invalid refresh response format:', data);
          observer.error(new Error('Invalid refresh response format'));
        }
      })
      .catch(error => {
        console.error('❌ Token refresh failed:', error);
        observer.error(error);
      });
    });
  }

  private addTokenHeader(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Temporary method for testing - can be called from browser console
  public testTokenRefresh(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('🧪 Testing token refresh manually...');
      this.refreshToken(token).subscribe({
        next: (response) => {
          console.log('✅ Manual token refresh successful:', response);
          if (response && response.isSuccess && response.data && response.data.token) {
            localStorage.setItem('authToken', response.data.token);
            console.log('✅ New token stored in localStorage');
          }
        },
        error: (error) => {
          console.error('❌ Manual token refresh failed:', error);
        }
      });
    } else {
      console.error('❌ No token found in localStorage');
    }
  }
}
