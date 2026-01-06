import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @Post()
  @ApiOperation({ summary: 'Create a customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  findAll() {
    return this.customersService.findAll();
  }

  @Get('top')
  @ApiOperation({ summary: 'Get top spending customers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTop(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.customersService.getTopCustomers(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get customer statistics' })
  getStats(@Param('id') id: string) {
    return this.customersService.getStats(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Post(':id/refresh-stats')
  @ApiOperation({ summary: 'Force refresh customer stats' })
  refreshStats(@Param('id') id: string) {
    return this.customersService.updateStats(id);
  }
}
