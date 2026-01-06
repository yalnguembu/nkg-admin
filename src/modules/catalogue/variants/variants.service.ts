import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { Prisma, PriceType, CustomerType } from '@prisma/client';

@Injectable()
export class VariantsService {
  constructor(private prisma: PrismaService) { }

  async create(productId: string, dto: CreateVariantDto) {
    const { prices, initialStock, ...data } = dto;

    // Ensure SKU unique
    if (data.sku) {
      const exists = await this.prisma.productVariant.findUnique({ where: { sku: data.sku } });
      if (exists) throw new ConflictException('SKU already exists');
    }

    return this.prisma.productVariant.create({
      data: {
        ...data,
        productId,
        sku: data.sku!, // Assumed required or auto-gen
        prices: prices ? {
          create: prices.map(p => ({
            ...p,
            priceType: p.priceType as PriceType,
            customerType: p.customerType as CustomerType,
          }))
        } : undefined,
        stock: initialStock ? { create: { quantity: initialStock } } : undefined
      },
      include: { prices: true, stock: true }
    });
  }

  async update(id: string, dto: UpdateVariantDto) {
    const { prices, initialStock, price, compareAtPrice, cost, stock, minStock, maxStock, weight, images, ...data } = dto;
    // Note: prices and stock not updated via this simple endpoint usually
    return this.prisma.productVariant.update({
      where: { id },
      data: data
    });
  }

  async remove(id: string) {
    return this.prisma.productVariant.delete({ where: { id } });
  }

  async updateStock(id: string, quantity: number) {
    return this.prisma.stock.upsert({
      where: { variantId: id },
      create: { variantId: id, quantity },
      update: { quantity }
    });
  }
}
