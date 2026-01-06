import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    const documents = await this.prisma.productDocument.findMany({
      include: {
        product: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return documents;
  }

  async remove(id: string) {
    const doc = await this.prisma.productDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.prisma.productDocument.delete({ where: { id } });
  }
}
