import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PricesService } from './prices.service';
import {
  CreatePriceDto,
  CreatePromotionDto,
  UpdatePriceDto,
} from './dto/price.dto';

@ApiTags('Prices')
@Controller('catalogue/prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a price' })
  @ApiResponse({ status: 201, description: 'Price created successfully' })
  create(@Body() dto: CreatePriceDto) {
    return this.pricesService.create(dto);
  }

  @Get('variant/:variantId')
  @ApiOperation({ summary: 'Get all prices for a variant' })
  findByVariant(@Param('variantId') variantId: string) {
    return this.pricesService.findByVariant(variantId);
  }

  @Get('variant/:variantId/effective')
  @ApiOperation({ summary: 'Get effective price for a variant' })
  @ApiQuery({ name: 'quantity', type: Number })
  @ApiQuery({ name: 'customerType', type: String })
  getEffectivePrice(
    @Param('variantId') variantId: string,
    @Query('quantity', ParseIntPipe) quantity: number,
    @Query('customerType') customerType: string,
  ) {
    return this.pricesService.getEffectivePrice(
      variantId,
      quantity,
      customerType,
    );
  }

  @Get('variant/:variantId/bulk')
  @ApiOperation({ summary: 'Get bulk pricing tiers for a variant' })
  @ApiQuery({ name: 'customerType', type: String })
  getBulkPrices(
    @Param('variantId') variantId: string,
    @Query('customerType') customerType: string,
  ) {
    return this.pricesService.getBulkPrices(variantId, customerType);
  }

  @Get('variant/:variantId/history')
  @ApiOperation({ summary: 'Get price history for a variant' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPriceHistory(
    @Param('variantId') variantId: string,
    @Query('limit') limit?: number,
  ) {
    return this.pricesService.getPriceHistory(variantId, limit);
  }

  @Post('variant/:variantId/promotion')
  @ApiOperation({ summary: 'Apply a promotion to a variant' })
  applyPromotion(
    @Param('variantId') variantId: string,
    @Body() dto: CreatePromotionDto,
  ) {
    return this.pricesService.applyPromotion({ ...dto, variantId });
  }

  @Delete('variant/:variantId/promotion')
  @ApiOperation({ summary: 'Remove active promotion from a variant' })
  @ApiQuery({ name: 'customerType', type: String })
  removePromotion(
    @Param('variantId') variantId: string,
    @Query('customerType') customerType: string,
  ) {
    return this.pricesService.removePromotion(variantId, customerType);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a price' })
  update(@Param('id') id: string, @Body() dto: UpdatePriceDto) {
    return this.pricesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a price' })
  remove(@Param('id') id: string) {
    return this.pricesService.remove(id);
  }
}
