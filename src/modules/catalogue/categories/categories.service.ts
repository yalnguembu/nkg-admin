import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryFilterDto } from './dto/category-filter.dto';
import { Prisma } from '@prisma/client';
import { generateSlug } from '../../../common/utils/slug.util';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) { }

  async create(createCategoryDto: CreateCategoryDto) {
    const slug =
      createCategoryDto.slug ||
      generateSlug(createCategoryDto.name);

    // Check slug uniqueness
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Category with this slug already exists');
    }

    if (createCategoryDto.parentId) {
      await this.validateParent(createCategoryDto.parentId);
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        slug,
      },
    });
  }

  async findAll(filter: CategoryFilterDto) {
    const {
      page = 1,
      limit = 100, // Higher default for categories
      search,
      isActive,
      parentId,
      includeChildren,
      order,
    } = filter;
    const limitNum = Number(limit) || 100;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.CategoryWhereInput = {
      ...(isActive !== undefined && { isActive: String(isActive) === 'true' }),
      ...(parentId && { parentId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { orderIndex: order === 'asc' ? 'asc' : 'desc' }, // default sort by orderIndex not just createdAt
        include: includeChildren
          ? {
            children: true,
            _count: { select: { products: true } },
          }
          : {
            _count: { select: { products: true, children: true } },
          },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async getTree() {
    // Fetch all categories to build tree in memory (efficient for < 1000 categories)
    const categories = await this.prisma.category.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });

    const buildTree = (parentId: string | null = null): any[] => {
      return categories
        .filter((cat) => cat.parentId === parentId)
        .map((cat) => ({
          ...cat,
          children: buildTree(cat.id),
        }));
    };

    return buildTree(null);
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
      await this.validateParent(updateCategoryDto.parentId);
      // Check for circular dependency
      if (await this.isCircular(id, updateCategoryDto.parentId)) {
        throw new BadRequestException('Circular dependency detected');
      }
    }

    if (updateCategoryDto.name && !updateCategoryDto.slug) {
      // Regenerate slug if name changed and slug not provided
      updateCategoryDto.slug = generateSlug(updateCategoryDto.name);
    }

    if (updateCategoryDto.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug: updateCategoryDto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Slug already taken');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } }
    });

    if (!category) throw new NotFoundException('Category not found');

    if (category._count.products > 0) {
      throw new BadRequestException('Cannot delete category with associated products');
    }
    if (category._count.children > 0) {
      throw new BadRequestException('Cannot delete category with sub-categories');
    }

    return this.prisma.category.delete({ where: { id } });
  }

  // Helpers
  private async validateParent(parentId: string) {
    const parent = await this.prisma.category.findUnique({
      where: { id: parentId },
    });
    if (!parent) throw new BadRequestException('Parent category does not exist');
  }

  private async isCircular(id: string, newParentId: string): Promise<boolean> {
    let currentParentId: string | null = newParentId;
    while (currentParentId) {
      if (currentParentId === id) return true;
      const parent = await this.prisma.category.findUnique({ where: { id: currentParentId }, select: { parentId: true } });
      currentParentId = parent ? parent.parentId : null;
    }
    return false;
  }
}
