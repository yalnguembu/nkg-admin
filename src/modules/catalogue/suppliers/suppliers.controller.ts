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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierFilterDto } from './dto/supplier-filter.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Suppliers')
@Controller('catalogue/suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created' })
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @ApiOperation({ summary: 'List suppliers' })
  findAll(@Query() filter: SupplierFilterDto) {
    return this.suppliersService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier details' })
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get products for a supplier' })
  getSupplierProducts(@Param('id') id: string) {
    return this.suppliersService.getSupplierProducts(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a supplier' })
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supplier' })
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
