import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsAppService } from '../../utils/whatsapp/whatsapp.service';
import { WhatsAppTemplateService } from '../../utils/whatsapp/whatsapp-template.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  ScheduleInstallationDto,
} from './dto/order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { OrderStatus, Prisma } from '@prisma/client';
import { DeliveryMethod, OrderType } from '../../common/enum';
import { StockService } from '../stock/stock.service';
import { InstallationPricingService } from './installation-pricing.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsAppService,
    private whatsappTemplateService: WhatsAppTemplateService,
    private cartService: CartService,
    private stockService: StockService,
    private installationPricingService: InstallationPricingService,
  ) {}

  private generateOrderNumber(): string {
    // Simple generator: ORD-TIMESTAMP-RAND
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD-${timestamp}-${rand}`;
  }

  async create(
    dto: CreateOrderDto,
    customerId?: string,
    initialStatus: OrderStatus = OrderStatus.PENDING,
  ) {
    // Get Cart
    const cart = await this.cartService.getCartWithCalculations(dto.cartId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Calculate costs
    let deliveryCost = 0;
    if (dto.deliveryMethod !== DeliveryMethod.PICKUP && dto.shippingAddressId) {
      // Stub: calculate cost based on address city?
      deliveryCost = 2000; // Default flat rate
    }

    let installationCost = 0;
    // Calculate Installation Cost using logic or service
    // We pass cart items to service
    const cartItemsForPricing = cart.items.map((i) => ({ ...i }));
    installationCost =
      await this.installationPricingService.calculateCost(cartItemsForPricing);

    // Check if installation is explicitly requested vs required?
    // Current logic: if any item requires installation, cost is applied.
    // AND Cart/Order should have `requiresInstallation` flag.
    const requiresInstallation = installationCost > 0;

    const totalAmount = cart.summary.subtotal + deliveryCost + installationCost;

    const orderNumber = this.generateOrderNumber();

    // Use customerId from param or cart
    const finalCustomerId = customerId || cart.customerId;
    if (!finalCustomerId) {
      throw new BadRequestException('Customer ID required for order');
    }

    let order;
    try {
      // Reserve Stock
      for (const item of cart.items) {
        if (item.variantId) {
          await this.stockService.reserveStock(item.variantId, {
            quantity: item.quantity,
            referenceId: orderNumber,
            referenceType: 'ORDER',
          });
        }
      }

      // Create Order
      order = await this.prisma.order.create({
        data: {
          orderNumber,
          customerId: finalCustomerId,
          status: initialStatus,
          orderType: OrderType.SALE_ONLY,
          shippingAddressId: dto.shippingAddressId,
          billingAddressId: dto.billingAddressId || dto.shippingAddressId,
          deliveryMethod: dto.deliveryMethod,
          subtotal: cart.summary.subtotal,
          deliveryCost,
          installationCost,
          totalAmount,
          requiresInstallation,
          notes: dto.notes,
          items: {
            create: cart.items.map((item) => {
              if (item.serviceId && item.service) {
                return {
                  serviceId: item.serviceId,
                  productName: item.service.name,
                  variantName: null,
                  sku: item.service.slug,
                  quantity: item.quantity,
                  unitPrice: 0,
                  totalPrice: 0,
                };
              } else if (item.variant) {
                return {
                  variantId: item.variantId,
                  productName: item.variant.product.name,
                  variantName: item.variant.name,
                  sku: item.variant.sku,
                  quantity: item.quantity,
                  unitPrice: (item as any).unitPrice,
                  totalPrice: (item as any).totalPrice,
                };
              }
              throw new Error('Invalid cart item');
            }),
          },
        },
      });
    } catch (e) {
      // Release stock if order creation fails (only for variants)
      for (const item of cart.items) {
        if (item.variantId) {
          try {
            await this.stockService.releaseStock(item.variantId, {
              quantity: item.quantity,
              referenceId: orderNumber,
              referenceType: 'ORDER',
            });
          } catch (ignore) {}
        }
      }
      throw e;
    }

    // Clear Cart
    await this.cartService.clearCart(dto.cartId);

    // Generate WhatsApp
    await this.generateWhatsAppUrl(order.id);

    return order;
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        billingAddress: true,
        shippingAddress: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
            service: true,
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    return order;
  }

  async findAll(filter: OrderFilterDto) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      customerId,
      deliveryMethod,
    } = filter;
    const limitNum = Number(limit);
    const skip = (Number(page) - 1) * limitNum;

    const where: Prisma.OrderWhereInput = {
      ...(status && { status: status as OrderStatus }),
      ...(customerId && { customerId }),
      ...(deliveryMethod && {
        deliveryMethod: deliveryMethod as DeliveryMethod,
      }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          {
            customer: { firstName: { contains: search, mode: 'insensitive' } },
          },
          { customer: { lastName: { contains: search, mode: 'insensitive' } } },
          {
            customer: {
              companyName: { contains: search, mode: 'insensitive' },
            },
          },
          { customer: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              email: true,
            },
          },
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              totalPrice: true,
            },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, userId?: string) {
    const order = await this.findOne(id);

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status as any as OrderStatus,
        notes: dto.notes
          ? `${order.notes || ''}\n[${new Date().toISOString()}] Status changed to ${dto.status}: ${dto.notes}`
          : order.notes,
        // Update timestamps if applicable
        completedAt:
          dto.status === OrderStatus.DELIVERED ? new Date() : undefined,
      },
      include: {
        items: true,
      },
    });

    // Handle Stock Confirmation/Release
    if (dto.status === OrderStatus.DELIVERED) {
      for (const item of (updated as any).items) {
        await this.stockService.confirmStockDeduction(
          item.variantId,
          item.quantity,
          order.orderNumber,
          'ORDER',
        );
      }
    } else if (dto.status === OrderStatus.CANCELLED) {
      for (const item of (updated as any).items) {
        await this.stockService.releaseStock(item.variantId, {
          quantity: item.quantity,
          referenceId: order.orderNumber,
          referenceType: 'ORDER',
        });
      }
    }

    // Notify via WhatsApp if possible
    try {
      // We can't generate URL here without user interaction, but we could trigger external service.
      // For now just update.
    } catch (e) {}

    return updated;
  }

  async scheduleInstallation(id: string, dto: ScheduleInstallationDto) {
    return this.prisma.order.update({
      where: { id },
      data: {
        installationScheduledAt: new Date(dto.scheduledAt),
        status: OrderStatus.IN_PROGRESS, // Assume processing if scheduled
      },
    });
  }

  async generateWhatsAppUrl(orderId: string): Promise<string> {
    const order = await this.findOne(orderId);

    if (!order.customer.phone) {
      // Allow generating even without phone, maybe prompt user?
      // But existing logic throws. We keep it consistent.
      throw new BadRequestException('Customer phone number is required');
    }

    const customerName =
      order.customer.firstName && order.customer.lastName
        ? `${order.customer.firstName} ${order.customer.lastName}`
        : order.customer.companyName || 'Client';

    const orderData = {
      orderNumber: order.orderNumber,
      customerName,
      items: (order.items || []).map((item) => ({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),

      subtotal: Number(order.subtotal),
      deliveryCost: Number(order.deliveryCost),
      installationCost: Number(order.installationCost),
      totalAmount: Number(order.totalAmount),
      deliveryMethod: order.deliveryMethod,
      deliveryAddress: order.shippingAddress
        ? `${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}`
        : undefined,
      paymentStatus: this.calculatePaymentStatus(order.payments),
    };

    const message =
      await this.whatsappTemplateService.formatOrderMessage(orderData);
    const whatsappUrl = this.whatsappService.generateWhatsAppUrl(
      order.customer.phone,
      message,
    );

    await this.prisma.order.update({
      where: { id: orderId },
      data: { whatsappUrl },
    });

    return whatsappUrl;
  }

  async generateStatusUpdateWhatsAppUrl(
    orderId: string,
    newStatus: string,
  ): Promise<string> {
    const order = await this.findOne(orderId);

    if (!order.customer.phone) {
      throw new BadRequestException('Customer phone number is required');
    }

    const customerName =
      order.customer.firstName && order.customer.lastName
        ? `${order.customer.firstName} ${order.customer.lastName}`
        : order.customer.companyName || 'Client';

    const message =
      await this.whatsappTemplateService.formatStatusUpdateMessage(
        order.orderNumber,
        customerName,
        newStatus,
      );

    return this.whatsappService.generateWhatsAppUrl(
      order.customer.phone,
      message,
    );
  }

  async generatePaymentReminderWhatsAppUrl(orderId: string): Promise<string> {
    const order = await this.findOne(orderId);

    if (!order.customer.phone) {
      throw new BadRequestException('Customer phone number is required');
    }

    const customerName =
      order.customer.firstName && order.customer.lastName
        ? `${order.customer.firstName} ${order.customer.lastName}`
        : order.customer.companyName || 'Client';

    const totalPaid = order.payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount.toNumber(), 0);

    const remainingAmount = Number(order.totalAmount) - totalPaid;

    const message =
      await this.whatsappTemplateService.formatPaymentReminderMessage(
        order.orderNumber,
        customerName,
        remainingAmount,
      );

    return this.whatsappService.generateWhatsAppUrl(
      order.customer.phone,
      message,
    );
  }

  private calculatePaymentStatus(payments: any[]): string {
    if (!payments || payments.length === 0) {
      return 'PENDING';
    }

    const totalPaid = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    if (totalPaid === 0) {
      return 'PENDING';
    }

    // Assuming totalAmount is not available/passed here, simplify to PARTIAL
    return 'PARTIAL';
  }
}
