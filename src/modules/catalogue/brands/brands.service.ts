import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandFilterDto } from './dto/brand-filter.dto';
import { Prisma } from '@prisma/client';
import { generateSlug } from '../../../common/utils/slug.util';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) { }

  async create(createBrandDto: CreateBrandDto) {
    const slug =
      createBrandDto.slug ||
      generateSlug(createBrandDto.name);

    const existing = await this.prisma.brand.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Brand with this slug already exists');
    }

    return this.prisma.brand.create({
      data: { ...createBrandDto, slug },
    });
  }

  async findAll(filter: BrandFilterDto) {
    const { page = 1, limit = 10, search, isActive, order } = filter;
    const limitNum = Number(limit) || 10;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.BrandWhereInput = {
      ...(isActive !== undefined && { isActive: String(isActive) === 'true' }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: order === 'asc' ? 'asc' : 'desc' },
        include: {
          _count: { select: { products: true, models: true } },
        },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, models: true } },
      },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');

    if (updateBrandDto.slug) {
      const existing = await this.prisma.brand.findUnique({ where: { slug: updateBrandDto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Slug already taken');
      }
    } else if (updateBrandDto.name && !updateBrandDto.slug) {
      // Optionally update slug if name changes
      // updateBrandDto.slug = slugify(updateBrandDto.name, { lower: true, strict: true });
    }

    return this.prisma.brand.update({
      where: { id },
      data: updateBrandDto,
    });
  }

  async remove(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true, models: true } } },
    });

    if (!brand) throw new NotFoundException('Brand not found');

    if (brand._count.products > 0) {
      throw new BadRequestException('Cannot delete brand with associated products');
    }
    if (brand._count.models > 0) {
      throw new BadRequestException('Cannot delete brand with associated models');
    }

    return this.prisma.brand.delete({ where: { id } });
  }
}
