import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { FilesService, EntityType } from './files.service';
import { FileResponseDto } from './dto/file-response.dto';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Post('upload/:entityType')
  @ApiOperation({ summary: 'Upload file for specific entity type' })
  @ApiParam({
    name: 'entityType',
    enum: EntityType,
    description: 'Entity type (categories, brands, models, products, services)'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: FileResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadEntityFile(
    @Param('entityType') entityType: EntityType,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.filesService.uploadEntityFile(entityType, file);
  }

  @Post('upload/categories')
  @ApiOperation({ summary: 'Upload category image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: FileResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCategoryImage(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadEntityFile(EntityType.CATEGORY, file);
  }

  @Post('upload/brands')
  @ApiOperation({ summary: 'Upload brand logo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: FileResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadBrandLogo(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadEntityFile(EntityType.BRAND, file);
  }

  @Post('upload/models')
  @ApiOperation({ summary: 'Upload model image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: FileResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadModelImage(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadEntityFile(EntityType.MODEL, file);
  }

  @Post('upload/products')
  @ApiOperation({ summary: 'Upload product image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: FileResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadEntityFile(EntityType.PRODUCT, file);
  }

  @Post('upload/services')
  @ApiOperation({ summary: 'Upload service image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: FileResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadServiceImage(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadEntityFile(EntityType.SERVICE, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200 })
  async deleteFile(@Param('id') id: string) {
    return this.filesService.deleteFile(id);
  }
}
