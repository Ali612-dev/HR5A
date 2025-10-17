import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Let 401 errors pass through to AuthInterceptor for token refresh
        if (error.status === 401) {
          console.log('🚨 ErrorInterceptor: Letting 401 error pass through to AuthInterceptor');
          return throwError(() => error);
        }

        let errorMessage = 'An unknown error occurred!';
        if (error.error instanceof ErrorEvent) {
          // Client-side errors
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side errors
          if (error.status) {
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
            if (error.error && error.error.message) {
              errorMessage = `Error Code: ${error.status}\nMessage: ${error.error.message}`;
            } else if (error.error && error.error.errors && error.error.errors.length > 0) {
              errorMessage = `Error Code: ${error.status}\nErrors: ${error.error.errors.join(', ')}`;
            }
          } else {
            errorMessage = `Error: ${error.message}`;
          }
        }
        console.error('🚨 ErrorInterceptor: Non-401 error:', error);
        return throwError(() => error);
      })
    );
  }
}
