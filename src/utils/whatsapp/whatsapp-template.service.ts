import { Injectable } from '@nestjs/common';
import { SystemConfigService } from '../../modules/admin/system-config/system-config.service';

interface OrderData {
  orderNumber: string;
  customerName: string;
  items: Array<{
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  deliveryCost: number;
  installationCost: number;
  totalAmount: number;
  deliveryMethod?: string;
  deliveryAddress?: string;
  paymentStatus?: string;
}

interface QuoteData {
  quoteNumber: string;
  customerName: string;
  items: Array<{
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  installationCost: number;
  deliveryCost: number;
  totalAmount: number;
  validUntil: Date;
}

@Injectable()
export class WhatsAppTemplateService {
  constructor(private configService: SystemConfigService) { }

  async formatOrderMessage(order: OrderData): Promise<string> {
    const template = await this.configService.getConfigValue(
      'whatsapp_template_order_creation',
      this.getDefaultOrderTemplate()
    );

    const itemsList = order.items
      .map(
        (item) =>
          `• ${item.productName}${item.variantName ? ` (${item.variantName})` : ''}\n  Qté: ${item.quantity} x ${this.formatCurrency(item.unitPrice)} = ${this.formatCurrency(item.totalPrice)}`,
      )
      .join('\n\n');

    const deliveryInfo = order.deliveryMethod
      ? `\n📍 *Livraison:* ${this.translateDeliveryMethod(order.deliveryMethod)}`
      : '';
    const addressInfo = order.deliveryAddress
      ? `\n📮 *Adresse:* ${order.deliveryAddress}`
      : '';
    const paymentInfo = order.paymentStatus
      ? `\n💳 *Paiement:* ${this.translatePaymentStatus(order.paymentStatus)}`
      : '';

    return this.replacePlaceholders(template, {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      itemsList,
      subtotal: this.formatCurrency(order.subtotal),
      deliveryCost: this.formatCurrency(order.deliveryCost),
      installationCost: this.formatCurrency(order.installationCost),
      totalAmount: this.formatCurrency(order.totalAmount),
      deliveryInfo,
      addressInfo,
      paymentInfo,
    });
  }

  async formatQuoteMessage(quote: QuoteData): Promise<string> {
    const template = await this.configService.getConfigValue(
      'whatsapp_template_quote',
      this.getDefaultQuoteTemplate()
    );

    const itemsList = quote.items
      .map(
        (item) =>
          `• ${item.productName}${item.variantName ? ` (${item.variantName})` : ''}\n  Qté: ${item.quantity} x ${this.formatCurrency(item.unitPrice)} = ${this.formatCurrency(item.totalPrice)}`,
      )
      .join('\n\n');

    return this.replacePlaceholders(template, {
      quoteNumber: quote.quoteNumber,
      customerName: quote.customerName,
      itemsList,
      subtotal: this.formatCurrency(quote.subtotal),
      installationCost: this.formatCurrency(quote.installationCost),
      deliveryCost: this.formatCurrency(quote.deliveryCost),
      totalAmount: this.formatCurrency(quote.totalAmount),
      validUntil: this.formatDate(quote.validUntil),
    });
  }

  async formatStatusUpdateMessage(
    orderNumber: string,
    customerName: string,
    newStatus: string,
  ): Promise<string> {
    const template = await this.configService.getConfigValue(
      'whatsapp_template_status_update',
      this.getDefaultStatusUpdateTemplate()
    );

    return this.replacePlaceholders(template, {
      orderNumber,
      customerName,
      newStatus: this.translateOrderStatus(newStatus),
      statusEmoji: this.getStatusEmoji(newStatus),
      statusMessage: this.getStatusMessage(newStatus),
    });
  }

  async formatPaymentReminderMessage(
    orderNumber: string,
    customerName: string,
    remainingAmount: number,
  ): Promise<string> {
    const template = await this.configService.getConfigValue(
      'whatsapp_template_payment_reminder',
      this.getDefaultPaymentReminderTemplate()
    );

    return this.replacePlaceholders(template, {
      orderNumber,
      customerName,
      amount: this.formatCurrency(remainingAmount),
    });
  }

  async formatInstallationScheduleMessage(
    orderNumber: string,
    customerName: string,
    installationDate: Date,
    address: string,
  ): Promise<string> {
    const template = await this.configService.getConfigValue(
      'whatsapp_template_installation_schedule',
      this.getDefaultInstallationScheduleTemplate()
    );

    return this.replacePlaceholders(template, {
      orderNumber,
      customerName,
      date: this.formatDate(installationDate),
      address,
    });
  }

  private replacePlaceholders(template: string, data: Record<string, string>): string {
    let result = template;
    for (const key in data) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
    }
    return result;
  }

  private formatCurrency(amount: number): string {
    return `${amount.toLocaleString('fr-FR')} XAF`;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private translateDeliveryMethod(method: string): string {
    const translations: Record<string, string> = {
      PICKUP: 'Retrait en magasin',
      HOME_DELIVERY: 'Livraison à domicile',
      DROPSHIP: 'Livraison directe fournisseur',
    };
    return translations[method] || method;
  }

  private translatePaymentStatus(status: string): string {
    const translations: Record<string, string> = {
      PENDING: 'En attente',
      PARTIAL: 'Partiel',
      PAID: 'Payé',
      REFUNDED: 'Remboursé',
      FAILED: 'Échoué',
    };
    return translations[status] || status;
  }

  private translateOrderStatus(status: string): string {
    const translations: Record<string, string> = {
      DRAFT: 'Brouillon',
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      IN_PROGRESS: 'En cours',
      AWAITING_PAYMENT: 'En attente de paiement',
      PAID: 'Payée',
      PREPARING: 'En préparation',
      READY_FOR_PICKUP: 'Prête pour retrait',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
      REFUNDED: 'Remboursée',
    };
    return translations[status] || status;
  }

  private getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      CONFIRMED: '✅',
      IN_PROGRESS: '⚙️',
      AWAITING_PAYMENT: '💳',
      PAID: '✅',
      PREPARING: '📦',
      READY_FOR_PICKUP: '🎁',
      SHIPPED: '🚚',
      DELIVERED: '✅',
      COMPLETED: '🎉',
      CANCELLED: '❌',
      REFUNDED: '💰',
    };
    return emojis[status] || '📌';
  }

  private getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      CONFIRMED:
        'Votre commande a été confirmée et sera traitée dans les plus brefs délais.',
      IN_PROGRESS: 'Votre commande est en cours de traitement.',
      AWAITING_PAYMENT:
        'Veuillez procéder au paiement pour que nous puissions traiter votre commande.',
      PAID: 'Votre paiement a été reçu. Merci!',
      PREPARING: 'Votre commande est en cours de préparation.',
      READY_FOR_PICKUP:
        'Votre commande est prête! Vous pouvez venir la récupérer.',
      SHIPPED: 'Votre commande a été expédiée.',
      DELIVERED: 'Votre commande a été livrée. Merci!',
      COMPLETED: 'Votre commande est terminée. Merci pour votre confiance!',
      CANCELLED: 'Votre commande a été annulée.',
      REFUNDED: 'Votre remboursement a été effectué.',
    };
    return messages[status] || '';
  }

  // DEFAULT TEMPLATES
  private getDefaultOrderTemplate(): string {
    return `🛒 *Nouvelle Commande - #{{orderNumber}}*

Bonjour {{customerName}},

Merci pour votre commande!

📦 *Articles:*
{{itemsList}}

━━━━━━━━━━━━━━━━━━
💰 *Sous-total:* {{subtotal}}
🚚 *Livraison:* {{deliveryCost}}
🔧 *Installation:* {{installationCost}}
━━━━━━━━━━━━━━━━━━
💵 *TOTAL:* {{totalAmount}}{{deliveryInfo}}{{addressInfo}}{{paymentInfo}}

Pour toute question, répondez à ce message.

Merci de votre confiance! 🙏`;
  }

  private getDefaultQuoteTemplate(): string {
    return `📋 *Devis #{{quoteNumber}}*

Bonjour {{customerName}},

Voici votre devis pour:

📦 *Articles:*
{{itemsList}}

━━━━━━━━━━━━━━━━━━
💰 *Sous-total:* {{subtotal}}
🔧 *Installation:* {{installationCost}}
🚚 *Livraison:* {{deliveryCost}}
━━━━━━━━━━━━━━━━━━
💵 *TOTAL:* {{totalAmount}}

⏰ *Valable jusqu'au:* {{validUntil}}

Pour accepter ce devis, répondez "OUI" à ce message.

Merci! 🙏`;
  }

  private getDefaultStatusUpdateTemplate(): string {
    return `{{statusEmoji}} *Mise à jour de commande*

Bonjour {{customerName}},

Votre commande #{{orderNumber}} a été mise à jour:

📌 *Nouveau statut:* {{newStatus}}

{{statusMessage}}

Pour toute question, répondez à ce message.

Merci! 🙏`;
  }

  private getDefaultPaymentReminderTemplate(): string {
    return `💳 *Rappel de Paiement*

Bonjour {{customerName}},

Votre commande #{{orderNumber}} est en attente de paiement.

💰 *Montant:* {{amount}}

*Méthodes de paiement:*
• Mobile Money (MTN, Orange)
• Virement bancaire
• Espèces à la livraison

Répondez à ce message pour finaliser votre paiement.

Merci! 🙏`;
  }

  private getDefaultInstallationScheduleTemplate(): string {
    return `🔧 *Rendez-vous d'Installation*

Bonjour {{customerName}},

Votre installation pour la commande #{{orderNumber}} est programmée:

📅 *Date:* {{date}}
📍 *Adresse:* {{address}}

Notre technicien vous contactera avant l'intervention.

Pour reporter ou annuler, répondez à ce message.

Merci! 🙏`;
  }
}
