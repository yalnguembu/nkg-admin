import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) { // Prisma CreateInput is strict, keeping any or partial
    return this.prisma.service.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.service.findMany({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async update(id: string, data: any) {
    await this.findOne(id); // Ensure exists
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists
    // Soft delete or hard delete? Usually soft delete is safer, but schema has isActive.
    // Let's toggle isActive to false instead of deleting.
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
