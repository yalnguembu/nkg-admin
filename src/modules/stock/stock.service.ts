import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  ReserveStockDto,
  ReleaseStockDto,
  StockAdjustmentDto,
} from './dto/stock.dto';
import { Prisma, MovementType, ReferenceType } from '@prisma/client';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async getStock(variantId: string) {
    const stock = await this.prisma.stock.findUnique({
      where: { variantId },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!stock) {
      throw new NotFoundException(`Stock for variant "${variantId}" not found`);
    }

    return stock;
  }

  async getLowStockItems() {
    return this.prisma.stock.findMany({
      where: {
        quantity: {
          lte: this.prisma.stock.fields.alertThreshold,
        },
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { quantity: 'asc' },
    });
  }

  async reserveStock(variantId: string, dto: ReserveStockDto) {
    const stock = await this.getStock(variantId);

    const available = stock.quantity - stock.reservedQuantity;
    if (available < dto.quantity) {
      throw new ConflictException(
        `Insufficient stock. Available: ${available}, Requested: ${dto.quantity}`,
      );
    }

    const updatedStock = await this.prisma.stock.update({
      where: {
        variantId,
        version: stock.version,
      },
      data: {
        reservedQuantity: { increment: dto.quantity },
        version: { increment: 1 },
      },
    });

    if (!updatedStock) {
      throw new ConflictException(
        'Concurrency conflict: Stock was modified by another process.',
      );
    }

    await this.recordMovement({
      variantId: stock.variantId,
      inputQuantity: 0,
      outputQuantity: 0,
      type: MovementType.RESERVATION,
      reason: `Reserved for ${dto.referenceType} #${dto.referenceId}`,
      referenceId: dto.referenceId,
      referenceType: dto.referenceType as ReferenceType,
      balanceAfter: updatedStock.quantity,
    });

    return updatedStock;
  }

  async releaseStock(variantId: string, dto: ReleaseStockDto) {
    const stock = await this.getStock(variantId);

    if (stock.reservedQuantity < dto.quantity) {
      throw new ConflictException(
        `Cannot release ${dto.quantity}. Only ${stock.reservedQuantity} reserved.`,
      );
    }

    const updatedStock = await this.prisma.stock.update({
      where: {
        variantId,
        version: stock.version,
      },
      data: {
        reservedQuantity: { decrement: dto.quantity },
        version: { increment: 1 },
      },
    });

    if (!updatedStock) {
      throw new ConflictException(
        'Concurrency conflict: Stock was modified by another process.',
      );
    }

    await this.recordMovement({
      variantId: stock.variantId,
      inputQuantity: 0,
      outputQuantity: 0,
      type: MovementType.RELEASE,
      reason: `Released from ${dto.referenceType} #${dto.referenceId}`,
      referenceId: dto.referenceId,
      referenceType: dto.referenceType as ReferenceType,
      balanceAfter: updatedStock.quantity,
    });

    return updatedStock;
  }

  async confirmStockDeduction(
    variantId: string,
    quantity: number,
    referenceId: string,
    referenceType: string,
  ) {
    const stock = await this.getStock(variantId);

    // When confirming an order, we move stock from 'reserved' to 'out'
    // So we decrease quantity AND reserved
    if (stock.reservedQuantity < quantity) {
      // Fallback if reservation wasn't made properly, though logic should prevent this
      // Just deduct from main quantity
      const updatedStock = await this.prisma.stock.update({
        where: {
          variantId,
          version: stock.version,
        },
        data: {
          quantity: { decrement: quantity },
          version: { increment: 1 },
        },
      });

      if (!updatedStock) {
        throw new ConflictException(
          'Concurrency conflict: Stock was modified by another process.',
        );
      }

      await this.recordMovement({
        variantId: stock.variantId,
        inputQuantity: 0,
        outputQuantity: quantity,
        type: MovementType.SALE,
        reason: `confirmed deduction for ${referenceType} #${referenceId} (direct)`,
        referenceId: referenceId,
        referenceType: referenceType as ReferenceType,
        balanceAfter: updatedStock.quantity,
      });
      return updatedStock;
    }

    const updatedStock = await this.prisma.stock.update({
      where: {
        variantId,
        version: stock.version,
      },
      data: {
        quantity: { decrement: quantity },
        reservedQuantity: { decrement: quantity },
        version: { increment: 1 },
      },
    });

    if (!updatedStock) {
      throw new ConflictException(
        'Concurrency conflict: Stock was modified by another process.',
      );
    }

    await this.recordMovement({
      variantId: stock.variantId,
      inputQuantity: 0,
      outputQuantity: quantity,
      type: MovementType.SALE,
      reason: `Sold via ${referenceType} #${referenceId}`,
      referenceId: referenceId,
      referenceType: referenceType as ReferenceType,
      balanceAfter: updatedStock.quantity,
    });

    return updatedStock;
  }

  async adjustStock(
    variantId: string,
    dto: StockAdjustmentDto,
    changedBy?: string,
  ) {
    const stock = await this.getStock(variantId);

    // Determine movement type based on quantity
    const isIncrement = dto.quantity > 0;
    const absQty = Math.abs(dto.quantity);
    const type = isIncrement
      ? MovementType.ADJUSTMENT_IN
      : MovementType.ADJUSTMENT_OUT;

    // If restocking (positive adjustment with supplier)
    const movementType =
      dto.supplierId && isIncrement ? MovementType.PURCHASE : type;

    if (!isIncrement && stock.quantity < absQty) {
      throw new ConflictException(
        `Cannot remove ${absQty}. Current stock: ${stock.quantity}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedStock = await tx.stock.update({
        where: {
          variantId,
          version: stock.version,
        },
        data: {
          quantity: { increment: dto.quantity },
          version: { increment: 1 },
        },
      });

      if (!updatedStock) {
        throw new ConflictException(
          'Concurrency conflict: Stock was modified by another process.',
        );
      }

      await this.recordMovement({
        variantId: stock.variantId,
        inputQuantity: isIncrement ? absQty : 0,
        outputQuantity: isIncrement ? 0 : absQty,
        type: movementType,
        reason: dto.reason,
        referenceId: dto.supplierId,
        referenceType: dto.supplierId
          ? ReferenceType.SUPPLIER
          : ReferenceType.MANUAL_ADJUSTMENT,
        balanceAfter: updatedStock.quantity,
        createdById: changedBy,
        tx, // Pass the transaction instance
      });

      return updatedStock;
    });
  }

  async getStockMovements(variantId: string, limit = 50) {
    const stock = await this.prisma.stock.findUnique({ where: { variantId } });
    if (!stock) throw new NotFoundException('Stock not found');

    return this.prisma.stockMovement.findMany({
      where: { variantId: stock.variantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getAllMovements(limit = 50) {
    return this.prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        variant: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  private async recordMovement(data: {
    variantId: string;
    inputQuantity: number;
    outputQuantity: number;
    type: MovementType;
    reason: string;
    referenceId?: string;
    referenceType?: ReferenceType;
    balanceAfter: number;
    createdById?: string;
    tx?: Prisma.TransactionClient;
  }) {
    const prisma = data.tx || this.prisma;
    return prisma.stockMovement.create({
      data: {
        variantId: data.variantId,
        quantity: data.inputQuantity + data.outputQuantity,
        movementType: data.type,
        reason: data.reason,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        performedBy: data.createdById,
      },
    });
  }
}
