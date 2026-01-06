import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreatePriceDto,
  CreatePromotionDto,
  UpdatePriceDto,
} from './dto/price.dto';

@Injectable()
export class PricesService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreatePriceDto, changedBy?: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
    });

    if (!variant) {
      throw new NotFoundException(
        `Variant with ID "${dto.variantId}" not found`,
      );
    }

    const existing = await this.prisma.price.findFirst({
      where: {
        variantId: dto.variantId,
        priceType: dto.priceType as any,
        customerType: dto.customerType as any,
        minQuantity: dto.minQuantity || 1,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
      },
    });

    if (existing) {
      throw new ConflictException(
        'A price with the same parameters already exists',
      );
    }

    const price = await this.prisma.price.create({
      data: {
        variantId: dto.variantId,
        priceType: dto.priceType as any,
        customerType: dto.customerType as any,
        amount: dto.amount,
        currency: dto.currency || 'XAF',
        minQuantity: dto.minQuantity || 1,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    await this.createPriceHistory({
      variantId: dto.variantId,
      priceType: dto.priceType as any,
      customerType: dto.customerType as any,
      oldAmount: null,
      newAmount: dto.amount,
      minQuantity: dto.minQuantity || 1,
      changedBy,
      changeReason: 'Price created',
    });

    return price;
  }

  async findByVariant(variantId: string) {
    return this.prisma.price.findMany({
      where: { variantId },
      orderBy: [
        { priceType: 'asc' },
        { customerType: 'asc' },
        { minQuantity: 'asc' },
      ],
    });
  }

  async getEffectivePrice(
    variantId: string,
    quantity: number,
    customerType: string,
  ) {
    const now = new Date();

    const prices = await this.prisma.price.findMany({
      where: {
        variantId,
        customerType: customerType as any,
        isActive: true,
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
        minQuantity: { lte: quantity },
      },
      orderBy: [
        { priceType: 'desc' },
        { minQuantity: 'desc' },
      ],
    });

    if (prices.length === 0) {
      throw new NotFoundException(
        `No active price found for variant "${variantId}" and customer type "${customerType}"`,
      );
    }

    return prices[0];
  }

  async getBulkPrices(variantId: string, customerType: string) {
    const now = new Date();

    return this.prisma.price.findMany({
      where: {
        variantId,
        customerType: customerType as any,
        isActive: true,
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
      },
      orderBy: [{ minQuantity: 'asc' }],
    });
  }

  async update(id: string, dto: UpdatePriceDto, changedBy?: string) {
    const existingPrice = await this.prisma.price.findUnique({
      where: { id },
    });

    if (!existingPrice) {
      throw new NotFoundException(`Price with ID "${id}" not found`);
    }

    const updatedPrice = await this.prisma.price.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.minQuantity !== undefined && { minQuantity: dto.minQuantity }),
        ...(dto.validFrom && { validFrom: new Date(dto.validFrom) }),
        ...(dto.validTo && { validTo: new Date(dto.validTo) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    if (dto.amount !== undefined && dto.amount !== existingPrice.amount.toNumber()) {
      await this.createPriceHistory({
        variantId: existingPrice.variantId,
        priceType: existingPrice.priceType,
        customerType: existingPrice.customerType,
        oldAmount: existingPrice.amount.toNumber(),
        newAmount: dto.amount,
        minQuantity: existingPrice.minQuantity,
        changedBy,
        changeReason: 'Price updated',
      });
    }

    return updatedPrice;
  }

  async applyPromotion(dto: CreatePromotionDto, changedBy?: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
    });

    if (!variant) {
      throw new NotFoundException(
        `Variant with ID "${dto.variantId}" not found`,
      );
    }

    const validFrom = new Date(dto.validFrom);
    const validTo = new Date(dto.validTo);

    if (validFrom >= validTo) {
      throw new BadRequestException(
        'validFrom must be before validTo',
      );
    }

    const existingPromo = await this.prisma.price.findFirst({
      where: {
        variantId: dto.variantId,
        priceType: 'PROMO',
        customerType: dto.customerType as any,
        minQuantity: dto.minQuantity || 1,
        isActive: true,
        OR: [
          {
            AND: [
              { validFrom: { lte: validFrom } },
              { validTo: { gte: validFrom } },
            ],
          },
          {
            AND: [
              { validFrom: { lte: validTo } },
              { validTo: { gte: validTo } },
            ],
          },
        ],
      },
    });

    if (existingPromo) {
      throw new ConflictException(
        'A promotion already exists for this period',
      );
    }

    const promo = await this.prisma.price.create({
      data: {
        variantId: dto.variantId,
        priceType: 'PROMO',
        customerType: dto.customerType as any,
        amount: dto.amount,
        minQuantity: dto.minQuantity || 1,
        validFrom,
        validTo,
        isActive: true,
      },
    });

    await this.createPriceHistory({
      variantId: dto.variantId,
      priceType: 'PROMO',
      customerType: dto.customerType as any,
      oldAmount: null,
      newAmount: dto.amount,
      minQuantity: dto.minQuantity || 1,
      changedBy,
      changeReason: `Promotion created (${dto.validFrom} - ${dto.validTo})`,
    });

    return promo;
  }

  async removePromotion(variantId: string, customerType: string) {
    const now = new Date();

    const result = await this.prisma.price.updateMany({
      where: {
        variantId,
        priceType: 'PROMO',
        customerType: customerType as any,
        isActive: true,
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
      },
      data: {
        isActive: false,
      },
    });

    return {
      message: `${result.count} promotion(s) deactivated`,
      count: result.count,
    };
  }

  async getPriceHistory(variantId: string, limit = 50) {
    return this.prisma.priceHistory.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async createPriceHistory(data: {
    variantId: string;
    priceType: any;
    customerType: any;
    oldAmount: number | null;
    newAmount: number;
    minQuantity: number;
    changedBy?: string;
    changeReason?: string;
  }) {
    return this.prisma.priceHistory.create({
      data: {
        variantId: data.variantId,
        priceType: data.priceType,
        customerType: data.customerType,
        oldAmount: data.oldAmount,
        newAmount: data.newAmount,
        minQuantity: data.minQuantity,
        changedBy: data.changedBy,
        changeReason: data.changeReason,
      },
    });
  }

  async remove(id: string) {
    const price = await this.prisma.price.findUnique({
      where: { id },
    });

    if (!price) {
      throw new NotFoundException(`Price with ID "${id}" not found`);
    }

    return this.prisma.price.delete({
      where: { id },
    });
  }
}
