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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryFilterDto } from './dto/category-filter.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  PaginatedCategoryResponseDto,
  CategoryTreeResponseDto,
  SingleCategoryResponseDto,
} from './dto/paginated-category-response.dto';
import { CategoryDto } from './dto/category-response.dto';

@ApiTags('Categories')
@Controller('catalogue/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created', type: SingleCategoryResponseDto })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List categories with filtering' })
  @ApiResponse({ status: 200, description: 'Return paginated categories', type: PaginatedCategoryResponseDto })
  findAll(@Query() filter: CategoryFilterDto) {
    return this.categoriesService.findAll(filter);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get category hierarchy tree' })
  @ApiResponse({ status: 200, description: 'Return category tree', type: CategoryTreeResponseDto })
  getTree() {
    return this.categoriesService.getTree();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category details' })
  @ApiResponse({ status: 200, description: 'Return category details', type: SingleCategoryResponseDto })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated', type: SingleCategoryResponseDto })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
