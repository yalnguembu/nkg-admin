import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, UpdatePaymentStatusDto } from './dto/payment.dto';

@ApiTags('Payments')
@Controller() // Routes moved to specific paths for clarity
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('orders/:orderId/payments')
  @ApiOperation({ summary: 'Create a payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  createForOrder(
    @Param('orderId') orderId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentService.create({ ...dto, orderId });
  }

  @Get('orders/:orderId/payments')
  @ApiOperation({ summary: 'Get all payments for an order' })
  @ApiResponse({ status: 200, description: 'Return all payments for order' })
  findAllForOrder(@Param('orderId') orderId: string) {
    return this.paymentService.findAll(orderId);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({ status: 200, description: 'Return payment details' })
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Patch('payments/:id/status')
  @ApiOperation({ summary: 'Update payment status' })
  @ApiResponse({ status: 200, description: 'Payment status updated successfully' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.paymentService.updateStatus(id, dto);
  }

  @Post('payments/:id/refund')
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiResponse({ status: 200, description: 'Payment refunded successfully' })
  refund(@Param('id') id: string) {
    return this.paymentService.refund(id);
  }
}
