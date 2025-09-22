import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {

  constructor(private http: HttpClient, private translate: TranslateService) { }

  private getHeaders(): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Convert language codes to proper locale format
    const currentLang = this.translate.currentLang || 'en';
    let localeCode = 'en-US'; // Default fallback
    
    switch (currentLang) {
      case 'en':
        localeCode = 'en-US';
        break;
      case 'ar':
        localeCode = 'ar-SA';
        break;
      case 'it':
        localeCode = 'it-IT';
        break;
      default:
        localeCode = 'en-US';
    }
    
    console.log('🌐 HttpClient: Setting Accept-Language header to:', localeCode);
    return headers.set('Accept-Language', localeCode);
  }

  post<T>(url: string, body: any, options?: { params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>; }; }): Observable<T> {
    // Handle Vercel proxy URL construction for POST with params
    if (environment.apiBaseUrl === '/api/proxy' && options?.params) {
      const modifiedUrl = this.buildProxyUrl(url, options.params);
      console.log('🔗 HttpClient POST: Modified proxy URL:', modifiedUrl);
      
      const { params, ...otherOptions } = options;
      return this.http.post<T>(modifiedUrl, body, { headers: this.getHeaders(), ...otherOptions });
    }
    
    return this.http.post<T>(url, body, { headers: this.getHeaders(), ...options });
  }

  get<T>(url: string, options?: { params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>; }; }): Observable<T> {
    // Handle Vercel proxy URL construction
    if (environment.apiBaseUrl === '/api/proxy' && options?.params) {
      const modifiedUrl = this.buildProxyUrl(url, options.params);
      console.log('🔗 HttpClient: Original URL:', url);
      console.log('🔗 HttpClient: Modified proxy URL:', modifiedUrl);
      console.log('🔗 HttpClient: Original params:', options.params);
      
      // Remove params from options since they're now in the URL
      const { params, ...otherOptions } = options;
      return this.http.get<T>(modifiedUrl, { headers: this.getHeaders(), observe: 'body', responseType: 'json', ...otherOptions });
    }
    
    return this.http.get<T>(url, { headers: this.getHeaders(), observe: 'body', responseType: 'json', ...options });
  }

  private buildProxyUrl(url: string, params: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>; }): string {
    // Extract the path from the original URL (everything after ?path=)
    const pathMatch = url.match(/\?path=(.+)/);
    if (!pathMatch) {
      return url; // Fallback to original URL if no path found
    }
    
    const apiPath = pathMatch[1];
    
    // Convert params to string
    let paramString = '';
    if (params instanceof HttpParams) {
      paramString = params.toString();
    } else {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      paramString = searchParams.toString();
    }
    
    // Combine API path with parameters
    const fullApiPath = paramString ? `${apiPath}?${paramString}` : apiPath;
    
    // Return the proxy URL with the complete path
    return `/api/proxy?path=${encodeURIComponent(fullApiPath)}`;
  }

  put<T>(url: string, body: any, options?: { params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>; }; }): Observable<T> {
    // Handle Vercel proxy URL construction for PUT with params
    if (environment.apiBaseUrl === '/api/proxy' && options?.params) {
      const modifiedUrl = this.buildProxyUrl(url, options.params);
      console.log('🔗 HttpClient PUT: Modified proxy URL:', modifiedUrl);
      
      const { params, ...otherOptions } = options;
      return this.http.put<T>(modifiedUrl, body, { headers: this.getHeaders(), ...otherOptions });
    }
    
    return this.http.put<T>(url, body, { headers: this.getHeaders(), ...options });
  }

  delete<T>(url: string, options?: { params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>; }; }): Observable<T> {
    // Handle Vercel proxy URL construction for DELETE with params
    if (environment.apiBaseUrl === '/api/proxy' && options?.params) {
      const modifiedUrl = this.buildProxyUrl(url, options.params);
      console.log('🔗 HttpClient DELETE: Modified proxy URL:', modifiedUrl);
      
      const { params, ...otherOptions } = options;
      return this.http.delete<T>(modifiedUrl, { headers: this.getHeaders(), ...otherOptions });
    }
    
    return this.http.delete<T>(url, { headers: this.getHeaders(), ...options });
  }
}
