import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { StockService } from './stock.service';
import {
  ReserveStockDto,
  ReleaseStockDto,
  StockAdjustmentDto,
} from './dto/stock.dto';

@ApiTags('Stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) { }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get items with low stock' })
  @ApiResponse({ status: 200, description: 'Return low stock items' })
  getLowStockItems() {
    return this.stockService.getLowStockItems();
  }

  @Get(':variantId')
  @ApiOperation({ summary: 'Get stock level for a variant' })
  @ApiResponse({ status: 200, description: 'Return stock level' })
  getStock(@Param('variantId') variantId: string) {
    return this.stockService.getStock(variantId);
  }

  @Post(':variantId/reserve')
  @ApiOperation({ summary: 'Reserve stock' })
  @ApiResponse({ status: 201, description: 'Stock reserved successfully' })
  reserveStock(
    @Param('variantId') variantId: string,
    @Body() dto: ReserveStockDto,
  ) {
    return this.stockService.reserveStock(variantId, dto);
  }

  @Post(':variantId/release')
  @ApiOperation({ summary: 'Release reserved stock' })
  @ApiResponse({ status: 201, description: 'Stock released successfully' })
  releaseStock(
    @Param('variantId') variantId: string,
    @Body() dto: ReleaseStockDto,
  ) {
    return this.stockService.releaseStock(variantId, dto);
  }

  @Post(':variantId/adjust')
  @ApiOperation({ summary: 'Manually adjust stock (inventory/restock)' })
  @ApiResponse({ status: 201, description: 'Stock adjusted successfully' })
  adjustStock(
    @Param('variantId') variantId: string,
    @Body() dto: StockAdjustmentDto,
  ) {
    // In a real app, get user ID from request
    return this.stockService.adjustStock(variantId, dto, 'ADMIN_USER');
  }

  @Get(':variantId/movements')
  @ApiOperation({ summary: 'Get stock movement history' })
  @ApiResponse({ status: 200, description: 'Return movement history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMovements(
    @Param('variantId') variantId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.stockService.getStockMovements(variantId, limit);
  }
}
