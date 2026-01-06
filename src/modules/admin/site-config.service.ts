import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SiteConfigService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.siteConfiguration.findMany({
      include: { updater: true },
    });
  }

  async findByKey(key: string) {
    const config = await this.prisma.siteConfiguration.findUnique({
      where: { key },
      include: { updater: true },
    });
    if (!config) throw new NotFoundException(`Site configuration "${key}" not found`);
    return config;
  }

  async update(key: string, value: any, updatedBy: string) {
    return this.prisma.siteConfiguration.upsert({
      where: { key },
      update: { value, updatedBy },
      create: { key, value, updatedBy, category: 'general' },
    });
  }
}
