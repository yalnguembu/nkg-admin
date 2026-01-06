import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateModelDto, UpdateModelDto } from './dto/model.dto';
import { generateSlug } from '../../../common/utils/slug.util';

@Injectable()
export class ModelService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateModelDto) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: dto.brandId },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID "${dto.brandId}" not found`);
    }

    const existing = await this.prisma.model.findFirst({
      where: {
        brandId: dto.brandId,
        reference: dto.reference,
        year: dto.year || null,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Model with reference "${dto.reference}" and year "${dto.year}" already exists for this brand`,
      );
    }

    const slug = generateSlug(dto.name);

    return this.prisma.model.create({
      data: {
        ...dto,
        slug,
      },
      include: {
        brand: true,
      },
    });
  }

  async findAll(brandId?: string, includeInactive = false) {
    return this.prisma.model.findMany({
      where: {
        ...(brandId && { brandId }),
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        brand: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const model = await this.prisma.model.findUnique({
      where: { id },
      include: {
        brand: true,
        products: {
          where: { isActive: true },
          take: 10,
          include: {
            category: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!model) {
      throw new NotFoundException(`Model with ID "${id}" not found`);
    }

    return model;
  }

  async findByBrand(brandId: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID "${brandId}" not found`);
    }

    return this.prisma.model.findMany({
      where: {
        brandId,
        isActive: true,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateModelDto) {
    await this.findOne(id);

    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: dto.brandId },
      });

      if (!brand) {
        throw new NotFoundException(
          `Brand with ID "${dto.brandId}" not found`,
        );
      }
    }

    if (dto.reference || dto.year !== undefined) {
      const model = await this.prisma.model.findUnique({ where: { id } });
      const existing = await this.prisma.model.findFirst({
        where: {
          brandId: dto.brandId || model!.brandId,
          reference: dto.reference || model!.reference,
          year: dto.year !== undefined ? dto.year : model!.year,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Model with reference "${dto.reference || model!.reference}" and year "${dto.year !== undefined ? dto.year : model!.year}" already exists for this brand`,
        );
      }
    }

    return this.prisma.model.update({
      where: { id },
      data: dto,
      include: {
        brand: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const productsCount = await this.prisma.product.count({
      where: { modelId: id },
    });

    if (productsCount > 0) {
      throw new ConflictException(
        `Cannot delete model with ${productsCount} associated products`,
      );
    }

    return this.prisma.model.delete({
      where: { id },
    });
  }
}
