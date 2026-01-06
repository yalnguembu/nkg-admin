import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';

export enum EntityType {
  CATEGORY = 'categories',
  BRAND = 'brands',
  MODEL = 'models',
  PRODUCT = 'products',
  SERVICE = 'services',
}

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) { }

  async ensureEntityFolder(entityType: EntityType): Promise<string> {
    const existingFolder = await this.prisma.folder.findFirst({
      where: { name: entityType, parentId: null },
    });

    if (existingFolder) {
      return existingFolder.id;
    }

    const folder = await this.prisma.folder.create({
      data: { name: entityType },
    });

    return folder.id;
  }

  async createFolder(createFolderDto: CreateFolderDto) {
    return this.prisma.folder.create({
      data: createFolderDto,
    });
  }

  async getFolders(parentId?: string) {
    return this.prisma.folder.findMany({
      where: {
        parentId: parentId || null,
      },
      include: {
        files: true,
        children: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getFolder(id: string) {
    return this.prisma.folder.findUnique({
      where: { id },
      include: {
        files: true,
        children: true,
        parent: true,
      },
    });
  }

  async deleteFolder(id: string) {
    return this.prisma.folder.delete({
      where: { id },
    });
  }

  async getFiles(folderId?: string) {
    return this.prisma.file.findMany({
      where: {
        folderId: folderId || null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createFile(data: {
    name: string;
    url: string;
    size: number;
    mimeType: string;
    folderId?: string;
  }) {
    return this.prisma.file.create({
      data,
    });
  }

  async deleteFile(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (file) {
      await this.prisma.file.delete({
        where: { id },
      });
    }

    return file;
  }

  async uploadEntityFile(
    entityType: EntityType,
    file: Express.Multer.File,
  ) {
    const folderId = await this.ensureEntityFolder(entityType);

    const fileData = {
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
      folderId,
    };

    return this.createFile(fileData);
  }
}
