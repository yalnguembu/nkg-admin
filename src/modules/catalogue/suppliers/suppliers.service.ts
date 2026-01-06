import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierFilterDto } from './dto/supplier-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) { }

  async create(createSupplierDto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: createSupplierDto,
    });
  }

  async findAll(filter: SupplierFilterDto) {
    const { page = 1, limit = 10, search, isActive, order } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: order === 'asc' ? 'asc' : 'desc' },
        include: {
          _count: { select: { products: true, stockMovements: true } },
        },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    return this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
    });
  }

  async remove(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    if (supplier._count.products > 0) {
      throw new BadRequestException('Cannot delete supplier with associated products');
    }

    return this.prisma.supplier.delete({ where: { id } });
  }

  async getSupplierProducts(id: string) {
    // Helper to get products associated with a supplier
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true, name: true, sku: true, isActive: true }
        }
      }
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier.products;
  }
}
