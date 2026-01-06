import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
} from './dto/system-config.dto';

@Injectable()
export class SystemConfigService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateSystemConfigDto) {
    const existing = await this.prisma.systemConfig.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException(
        `Configuration with key "${dto.key}" already exists`,
      );
    }

    return this.prisma.systemConfig.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async findByKey(key: string) {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException(`Configuration "${key}" not found`);
    }

    return config;
  }

  async update(key: string, dto: UpdateSystemConfigDto) {
    const existing = await this.prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundException(`Configuration "${key}" not found`);
    }

    return this.prisma.systemConfig.update({
      where: { key },
      data: dto,
    });
  }

  async remove(key: string) {
    const existing = await this.prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundException(`Configuration "${key}" not found`);
    }

    return this.prisma.systemConfig.delete({
      where: { key },
    });
  }

  /**
   * Helper method to get config value with type casting
   */
  async getConfigValue<T>(key: string, defaultValue?: T): Promise<T> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!config) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new NotFoundException(`Configuration "${key}" not found`);
    }

    // Attempt to parse boolean
    if (config.value === 'true') return true as unknown as T;
    if (config.value === 'false') return false as unknown as T;

    // Attempt to parse number
    if (!isNaN(Number(config.value)) && config.value.trim() !== '') {
      return Number(config.value) as unknown as T;
    }

    return config.value as unknown as T;
  }
}
