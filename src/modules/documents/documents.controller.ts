import { Controller, Get, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Get()
  @ApiOperation({ summary: 'List all documents' })
  @ApiResponse({ status: 200, description: 'Return all documents' })
  findAll() {
    return this.documentsService.findAll();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
