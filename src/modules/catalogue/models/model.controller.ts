import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ModelService } from './model.service';
import { CreateModelDto, UpdateModelDto } from './dto/model.dto';

@ApiTags('Models')
@Controller('catalogue/models')
export class ModelController {
  constructor(private readonly modelService: ModelService) { }

  @Post()
  @ApiOperation({ summary: 'Create a model' })
  @ApiResponse({ status: 201, description: 'Model created successfully' })
  create(@Body() dto: CreateModelDto) {
    return this.modelService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all models' })
  @ApiResponse({ status: 200, description: 'Return all models' })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAll(
    @Query('brandId') brandId?: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive?: boolean,
  ) {
    return this.modelService.findAll(brandId, includeInactive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get model details' })
  @ApiResponse({ status: 200, description: 'Return model details' })
  findOne(@Param('id') id: string) {
    return this.modelService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a model' })
  @ApiResponse({ status: 200, description: 'Model updated successfully' })
  update(@Param('id') id: string, @Body() dto: UpdateModelDto) {
    return this.modelService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a model' })
  @ApiResponse({ status: 200, description: 'Model deleted successfully' })
  remove(@Param('id') id: string) {
    return this.modelService.remove(id);
  }
}
