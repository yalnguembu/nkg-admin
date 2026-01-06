import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report.dto';

@ApiTags('Reports & Analytics')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get main dashboard summary stats' })
  getDashboard() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get sales chart data' })
  getSales(@Query() filter: ReportFilterDto) {
    return this.reportsService.getSalesChart(filter);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  getTopProducts(@Query('limit') limit?: number) {
    return this.reportsService.getTopSellingProducts(limit || 5);
  }

  @Get('inventory-valuation')
  @ApiOperation({ summary: 'Get current inventory valuation' })
  getInventoryValuation() {
    return this.reportsService.getInventoryValuation();
  }
}
