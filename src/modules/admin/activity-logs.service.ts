import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) { }

  async findAll(query: any) {
    const { userId, action, entityType, limit = 50, offset = 0 } = query;
    return this.prisma.activityLog.findMany({
      where: {
        userId,
        action,
        entityType,
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });
  }

  async log(data: { userId: string; action: string; entityType: string; entityId?: string; details?: any; ipAddress?: string }) {
    return this.prisma.activityLog.create({
      data,
    });
  }
}
