import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '../http-client.service';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import { ApiResponse } from '../interfaces/dashboard.interface';

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  private http = inject(HttpClientService);

  constructor() { }

  sendWhatsAppMessage(to: string, message: string): Observable<ApiResponse<any>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.WHATSAPP_SEND_SINGLE_MESSAGE}`;
    const body = { to, message };
    return this.http.post<ApiResponse<any>>(url, body);
  }

  sendGroupWhatsAppMessage(to: string[], message: string): Observable<ApiResponse<any>> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.WHATSAPP_SEND_GROUP_MESSAGE}`;
    const body = { to, message };
    return this.http.post<ApiResponse<any>>(url, body);
  }
}
