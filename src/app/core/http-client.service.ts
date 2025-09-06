import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {

  constructor(private http: HttpClient, private translate: TranslateService) { }

  private getHeaders(): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const currentLang = this.translate.currentLang || 'en-US'; // Default to en-US if no language is set
    return headers.set('Accept-Language', currentLang);
  }

  post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(url, body, { headers: this.getHeaders() });
  }

  get<T>(url: string, options?: { params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>; }; }): Observable<T> {
    return this.http.get<T>(url, { headers: this.getHeaders(), observe: 'body', responseType: 'json', ...options });
  }

  put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(url, body, { headers: this.getHeaders() });
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(url, { headers: this.getHeaders() });
  }
}
