import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) { }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async findAll() {
    return this.prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.adminUser.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('Admin user not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.adminUser.findUnique({
      where: { email },
    });
  }

  async create(data: any) {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already in use');

    if (data.password) {
      data.password = this.hashPassword(data.password);
    }

    return this.prisma.adminUser.create({
      data,
    });
  }

  async update(id: string, data: any) {
    if (data.password) {
      data.password = this.hashPassword(data.password);
    }

    return this.prisma.adminUser.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.adminUser.delete({
      where: { id },
    });
  }
}
