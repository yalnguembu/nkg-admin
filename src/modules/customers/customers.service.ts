import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { CustomerType, OrderStatus } from '@prisma/client'; // Use Prisma enums

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(`Customer with email ${dto.email} already exists`);
    }

    // Map DTO enum to Prisma enum if needed (assuming they match strings)
    // Using 'as any' safe if strings match, or manual mapping.
    // They should match since common/enum.ts was source for schema.
    const type = dto.customerType as unknown as CustomerType || CustomerType.B2C; // Default B2C from Schema

    return this.prisma.customer.create({
      data: {
        id: dto.id,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        companyName: dto.companyName,
        taxId: dto.taxId,
        customerType: type,
      },
    });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
      }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);

    // Convert DTO enum if present
    const type = dto.customerType ? (dto.customerType as unknown as CustomerType) : undefined;

    return this.prisma.customer.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        companyName: dto.companyName,
        taxId: dto.taxId,
        customerType: type,
      },
    });
  }

  async updateStats(id: string) {
    // Check if customer exists first to avoid foreign key errors or empty lookups
    const exists = await this.prisma.customer.findUnique({ where: { id } });
    if (!exists) return;

    // Aggregate stats
    const aggregations = await this.prisma.order.aggregate({
      where: {
        customerId: id,
        status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.CONFIRMED] }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    const totalSpent = aggregations._sum.totalAmount || 0;
    const orderCount = aggregations._count.id || 0;

    await this.prisma.customer.update({
      where: { id },
      data: {
        totalSpent: totalSpent, // Prisma handles Decimal or number
        orderCount: orderCount
      }
    });

    await this.checkAndUpgradeCustomerType(id, Number(totalSpent));
  }

  private async checkAndUpgradeCustomerType(id: string, totalSpent: number) {
    // Placeholder for upgrade logic
    // Example: if > 5M and currently B2C, maybe flag for review?
  }

  async getTopCustomers(limit = 10) {
    return this.prisma.customer.findMany({
      orderBy: { totalSpent: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });
  }

  async getStats(id: string) {
    const customer = await this.findOne(id);
    return {
      totalSpent: Number(customer.totalSpent),
      orderCount: customer.orderCount,
      averageOrderValue: customer.orderCount > 0
        ? Number(customer.totalSpent) / customer.orderCount
        : 0
    };
  }
}
