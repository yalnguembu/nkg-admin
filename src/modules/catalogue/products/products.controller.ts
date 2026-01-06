import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductFullDto } from './dto/create-product-full.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ApiTags, ApiOperation, ApiResponse, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import { DataResponseDto } from '../../../common/dto/data-response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Products')
@Controller('catalogue/products')
@ApiExtraModels(DataResponseDto, PaginatedResponseDto, CreateProductFullDto)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a product with variants and images' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  createFull(@Body() dto: CreateProductFullDto) {
    return this.productsService.createFull(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List products with complex filtering' })
  @ApiResponse({
    status: 200,
    description: 'Return all products paginated',
    schema: {
      allOf: [
        { $ref: getSchemaPath(DataResponseDto) },
        {
          properties: {
            data: {
              allOf: [
                { $ref: getSchemaPath(PaginatedResponseDto) },
                {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: getSchemaPath(CreateProductFullDto) },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  })
  findAll(@Query() filter: ProductFilterDto) {
    return this.productsService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full product details' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product basic info' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product and relations' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a product' })
  duplicate(@Param('id') id: string) {
    return this.productsService.duplicate(id);
  }
}
