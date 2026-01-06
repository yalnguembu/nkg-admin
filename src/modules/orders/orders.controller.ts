import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, ScheduleInstallationDto } from './dto/order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { DataResponseDto } from '../../common/dto/data-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { getSchemaPath, ApiExtraModels } from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
@ApiExtraModels(DataResponseDto, PaginatedResponseDto)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @ApiOperation({ summary: 'Create new order from cart' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders with filtering' })
  @ApiResponse({
    status: 200,
    description: 'Return all orders paginated',
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
                      items: { type: 'object' }, // Ideally Order entity
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
  findAll(@Query() filter: OrderFilterDto) {
    return this.ordersService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: 200, description: 'Return order details' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Post(':id/schedule-installation')
  @ApiOperation({ summary: 'Schedule installation date' })
  @ApiResponse({ status: 201, description: 'Installation scheduled successfully' })
  scheduleInstallation(@Param('id') id: string, @Body() dto: ScheduleInstallationDto) {
    return this.ordersService.scheduleInstallation(id, dto);
  }

  @Post(':id/whatsapp')
  @ApiOperation({ summary: 'Generate WhatsApp link for order' })
  async generateWhatsApp(@Param('id') id: string) {
    const whatsappUrl = await this.ordersService.generateWhatsAppUrl(id);
    return { whatsappUrl };
  }

  @Get(':id/whatsapp-url')
  @ApiOperation({ summary: 'Get stored WhatsApp URL' })
  async getWhatsAppUrl(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);
    return { whatsappUrl: order.whatsappUrl };
  }

  @Post(':id/whatsapp/status-update')
  @ApiOperation({ summary: 'Generate status update WhatsApp message' })
  async generateStatusUpdate(
    @Param('id') id: string,
    @Param('status') status: string,
  ) {
    const whatsappUrl =
      await this.ordersService.generateStatusUpdateWhatsAppUrl(id, status);
    return { whatsappUrl };
  }

  @Post(':id/whatsapp/payment-reminder')
  @ApiOperation({ summary: 'Generate payment reminder WhatsApp message' })
  async generatePaymentReminder(@Param('id') id: string) {
    const whatsappUrl =
      await this.ordersService.generatePaymentReminderWhatsAppUrl(id);
    return { whatsappUrl };
  }
}
