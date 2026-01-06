import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CustomersService } from '../../customers/customers.service';
import { CreatePaymentDto, UpdatePaymentStatusDto } from './dto/payment.dto';
import { PaymentStatus, OrderStatus } from '../../../common/enum';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private customersService: CustomersService,
  ) { }

  async create(dto: CreatePaymentDto, createdBy?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${dto.orderId}" not found`);
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        amount: dto.amount,
        method: dto.method,
        status: PaymentStatus.PENDING,
        transactionId: dto.transactionId,
        reference: dto.proof,
        notes: dto.notes,
      },
    });

    await this.updateOrderStatusBasedOnPayments(dto.orderId);

    // Update stats after payment
    if (order.customerId) {
      await this.customersService.updateStats(order.customerId);
    }

    return payment;
  }

  async updateOrderStatusBasedOnPayments(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    if (!order) return;

    const totalPaid = order.payments
      .filter(p => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + p.amount.toNumber(), 0);

    const totalNeeded = order.totalAmount.toNumber();

    let newStatus = order.status;

    // Logic to update Order Status based on payment
    if (totalPaid >= totalNeeded) {
      if (newStatus === OrderStatus.AWAITING_PAYMENT || newStatus === OrderStatus.PENDING || newStatus === OrderStatus.DRAFT) {
        newStatus = OrderStatus.PAID;
      }
    } else if (totalPaid > 0) {
      if (newStatus === OrderStatus.DRAFT) {
        newStatus = OrderStatus.PENDING; // or CONFIRMED?
      }
    }

    if (newStatus !== order.status) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: newStatus
        }
      });

      if (newStatus === OrderStatus.PAID && order.customerId) {
        await this.customersService.updateStats(order.customerId);
      }
    }
  }

  async findAll(orderId?: string) {
    if (orderId) {
      return this.prisma.payment.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' }
      });
    }
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID "${id}" not found`);
    }

    return payment;
  }

  async updateStatus(id: string, dto: UpdatePaymentStatusDto, userId?: string) {
    const payment = await this.findOne(id);

    const paidAt = dto.status === PaymentStatus.PAID && payment.status !== PaymentStatus.PAID ? new Date() : undefined;

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: dto.status,
        transactionId: dto.transactionId || payment.transactionId,
        paidAt: paidAt || payment.paidAt
      }
    });

    await this.updateOrderStatusBasedOnPayments(payment.orderId);

    return updated;
  }

  async refund(id: string, amount?: number) {
    const payment = await this.findOne(id);

    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Can only refund PAID payments');
    }

    return this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.REFUNDED }
    });
  }
}
