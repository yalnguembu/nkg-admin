import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryMethod, OrderStatus } from '../../../common/enum';

export class CreateOrderDto {
  @ApiProperty({ description: 'ID of the cart to convert to order' })
  @IsUUID()
  @IsNotEmpty()
  cartId: string;

  @ApiProperty({ description: 'Delivery method', enum: DeliveryMethod })
  @IsEnum(DeliveryMethod)
  deliveryMethod: DeliveryMethod;

  @ApiPropertyOptional({ description: 'Shipping address ID (required for delivery)' })
  @IsOptional()
  @IsUUID()
  shippingAddressId?: string;

  @ApiPropertyOptional({ description: 'Billing address ID' })
  @IsOptional()
  @IsUUID()
  billingAddressId?: string;

  @ApiPropertyOptional({ description: 'Customer notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'New status', enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Notes regarding the update' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ScheduleInstallationDto {
  @ApiProperty({ description: 'Date and time for installation' })
  @IsDateString()
  scheduledAt: string;
}
