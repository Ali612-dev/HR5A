import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {

  constructor() { }

  sendWhatsAppMessage(phoneNumber: string, message: string): void {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  sendGroupWhatsAppMessage(phoneNumbers: string[], message: string): void {
    // WhatsApp does not support creating groups with a pre-defined message via URL.
    // This will open a chat with the first number and pre-fill the message.
    if (phoneNumbers.length > 0) {
      this.sendWhatsAppMessage(phoneNumbers[0], message);
    }
  }
}
