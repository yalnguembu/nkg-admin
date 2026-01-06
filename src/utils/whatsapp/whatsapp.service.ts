import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsAppService {
  generateWhatsAppUrl(phone: string, message: string): string {
    const cleanPhone = this.validateAndCleanPhoneNumber(phone);
    const encodedMessage = this.encodeMessage(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  validateAndCleanPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('237')) {
      return cleaned;
    }

    if (cleaned.startsWith('6') || cleaned.startsWith('2')) {
      return `237${cleaned}`;
    }

    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
      return `237${cleaned}`;
    }

    return `237${cleaned}`;
  }

  encodeMessage(text: string): string {
    return encodeURIComponent(text);
  }

  validatePhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('237')) {
      return cleaned.length === 12;
    }

    if (cleaned.startsWith('6') || cleaned.startsWith('2')) {
      return cleaned.length === 9;
    }

    return false;
  }

  generateQuoteMessage(quote: any): string {
    const customerName = quote.customer?.firstName || quote.customer?.companyName || 'Customer';
    const total = quote.totalAmount || 0;
    const expiry = quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A';

    return `Hello ${customerName}, here is your quote #${quote.id}. Total: ${total} XAF. Valid until: ${expiry}.`;
  }
}
