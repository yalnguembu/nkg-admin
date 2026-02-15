import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsAppService } from '../../utils/whatsapp/whatsapp.service';
import { WhatsAppTemplateService } from '../../utils/whatsapp/whatsapp-template.service';
import { StockService } from '../stock/stock.service';
import { ConfigService } from '@nestjs/config';
import { QuoteStatus, OrderStatus } from '@prisma/client';
import {
  UpdateQuoteDto,
  AcceptQuoteDto,
  CreateQuoteDto,
} from './dto/quote.dto';
import { QuoteFilterDto } from './dto/quote-filter.dto';
import { OrdersService } from './orders.service';
import { Prisma } from '@prisma/client';
import { InstallationPricingService } from './installation-pricing.service';

@Injectable()
export class QuotesService implements OnModuleInit {
  private expirationCheckInterval: NodeJS.Timeout;
  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsAppService,
    private whatsappTemplateService: WhatsAppTemplateService,
    private stockService: StockService,
    private configService: ConfigService,
    private ordersService: OrdersService,
    private installationPricingService: InstallationPricingService,
  ) {}

  onModuleInit() {
    // Schedule expiration check every hour (native implementation)
    this.expirationCheckInterval = setInterval(
      async () => {
        console.log('Running scheduled quote expiration check...');
        const count = await this.checkExpirations();
        if (count > 0) console.log(`Expired ${count} quotes.`);
      },
      60 * 60 * 1000,
    ); // 1 hour
  }

  async create(dto: CreateQuoteDto, customerId: string) {
    if (!dto.cartId && !dto.orderId) {
      throw new BadRequestException(
        'Either cartId or orderId must be provided to create a quote',
      );
    }

    let orderId = dto.orderId;

    // If creating from Cart, create a DRAFT order first
    if (dto.cartId) {
      // Create Order with DRAFT status
      // We use OrdersService to handle cart logic, stock reservation (if any? maybe skip for quote?), etc.
      // NOTE: Quotes usually don't reserve stock until accepted?
      // If stock logic in OrdersService reserves stock, we might want to release it immediately or
      // avoid usage of OrdersService.create for quotes if it reserves stock.
      // Current OrdersService.create reserves stock.
      // For Quote, we probably DOES NOT want to reserve stock yet.
      // But keeping it reserved ensures availability.
      // "Quote validation" usually implies price and stock hold?
      // Let's assume for now we Reserve Stock for Quotes (as it mimics an Order).
      // If strict, we should add 'skipStockReservation' flag to Order creation?
      // For now, let's accept that it reserves stock. (Can change later).

      const order = await this.ordersService.create(
        {
          cartId: dto.cartId,
          shippingAddressId: undefined, // Quote phase might not have address yet
        } as any, // Cast to avoid strict check for now if DTO mismatch
        customerId,
        OrderStatus.DRAFT,
      );
      orderId = order.id;
    }

    // Now create the Quote entry
    const order = await this.ordersService.findOne(orderId); // Ensure we have latest with calcs
    if (!order) throw new NotFoundException('Order not found');

    // Calculate specific quote additions? e.g. Installation
    // Order already has installationCost from OrdersService logic (which uses InstallationPricingService).

    const validUntil = dto.validUntil
      ? new Date(dto.validUntil)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days default

    const quoteNumber = `QT-${Date.now()}`;

    const quote = await this.prisma.quote.create({
      data: {
        quoteNumber,
        orderId: orderId,
        validUntil,
        calculatedInstallationCost: order.installationCost, // Sync with order
        status: QuoteStatus.PENDING,
      },
    });

    // Generate WhatsApp Link immediately?
    await this.generateWhatsAppUrl(quote.id);

    return this.findOne(quote.id);
  }

  async findAll(filter: QuoteFilterDto) {
    const { page = 1, limit = 20, status, search, orderId } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.QuoteWhereInput = {
      ...(status && { status }),
      ...(orderId && { orderId }),
      ...(search && {
        OR: [
          { quoteNumber: { contains: search, mode: 'insensitive' } },
          { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
          {
            order: {
              customer: {
                firstName: { contains: search, mode: 'insensitive' },
              },
            },
          },
          {
            order: {
              customer: { lastName: { contains: search, mode: 'insensitive' } },
            },
          },
          {
            order: {
              customer: {
                companyName: { contains: search, mode: 'insensitive' },
              },
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  companyName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.quote.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            items: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID "${id}" not found`);
    }

    return quote;
  }

  async accept(id: string, dto: AcceptQuoteDto) {
    const quote = await this.findOne(id);

    if (
      quote.status !== QuoteStatus.SENT &&
      quote.status !== QuoteStatus.PENDING
    ) {
      throw new BadRequestException(
        `Cannot accept quote in status ${quote.status}`,
      );
    }

    if (new Date() > quote.validUntil) {
      await this.prisma.quote.update({
        where: { id },
        data: { status: QuoteStatus.EXPIRED },
      });
      throw new BadRequestException('Quote has expired');
    }

    // Reserve Stock for items
    for (const item of quote.order.items) {
      try {
        await this.stockService.reserveStock(item.variantId, {
          quantity: item.quantity,
          referenceId: quote.orderId,
          referenceType: 'ORDER',
        });
      } catch (error) {
        // Rollback? complex. For now throw.
        throw new BadRequestException(
          `Stock reservation failed for ${item.productName}: ${error.message}`,
        );
      }
    }

    // Update Quote Status
    await this.prisma.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });

    // Convert Order to CONFIRMED (or AWAITING_PAYMENT)
    await this.prisma.order.update({
      where: { id: quote.orderId },
      data: {
        status: OrderStatus.CONFIRMED, // Or AWAITING_PAYMENT?
        confirmedAt: new Date(),
        notes: dto.notes
          ? `${quote.order.notes || ''}\nQuote Acceptance Note: ${dto.notes}`
          : quote.order.notes,
      },
    });

    return this.findOne(id);
  }

  async reject(id: string) {
    return this.prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.REJECTED },
    });
  }

  async checkExpirations() {
    const expired = await this.prisma.quote.updateMany({
      where: {
        status: { in: [QuoteStatus.PENDING, QuoteStatus.SENT] },
        validUntil: { lt: new Date() },
      },
      data: {
        status: QuoteStatus.EXPIRED,
      },
    });
    return expired.count;
  }

  async generatePdf(id: string) {
    const quote = await this.findOne(id);
    // Stub: In real app, generate PDF via library (e.g. pdfkit, puppeteer)
    // and upload to storage (S3). Return URL.
    const mockUrl = `${this.configService.get('APP_URL') || 'http://localhost:3004'}/api/quotes/${id}/download`;

    await this.prisma.quote.update({
      where: { id },
      data: { pdfUrl: mockUrl },
    });

    return { url: mockUrl };
  }

  async generateWhatsAppUrl(quoteId: string): Promise<string> {
    const quote = await this.findOne(quoteId);

    if (!quote.order.customer.phone) {
      throw new BadRequestException('Customer phone number is required');
    }

    const customerName =
      quote.order.customer.firstName && quote.order.customer.lastName
        ? `${quote.order.customer.firstName} ${quote.order.customer.lastName}`
        : quote.order.customer.companyName || 'Client';

    const quoteData = {
      quoteNumber: quote.quoteNumber,
      customerName,
      items: quote.order.items.map((item) => ({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        totalPrice: item.totalPrice.toNumber(),
      })),
      subtotal: quote.order.subtotal.toNumber(),
      installationCost: quote.calculatedInstallationCost.toNumber(),
      deliveryCost: quote.order.deliveryCost.toNumber(),
      totalAmount: quote.order.totalAmount.toNumber(),
      validUntil: quote.validUntil,
    };

    const message = await this.whatsappService.generateQuoteMessage(quote);
    const whatsappUrl = await this.whatsappService.generateWhatsAppUrl(
      quote.order.customer.phone,
      message,
    );

    // Update status to SENT if it was PENDING/DRAFT
    if (
      quote.status === QuoteStatus.PENDING ||
      quote.status === QuoteStatus.DRAFT
    ) {
      await this.prisma.quote.update({
        where: { id: quoteId },
        data: {
          whatsappUrl,
          status: QuoteStatus.SENT,
        },
      });
    } else {
      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { whatsappUrl },
      });
    }

    return whatsappUrl;
  }
}
