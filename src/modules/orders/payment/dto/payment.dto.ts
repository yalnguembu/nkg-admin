import { IsString, IsNumber, IsUUID, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../../../../common/enum';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: 'Payment amount', example: 5000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ description: 'Transaction ID from provider' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Proof of payment (reference/file)' })
  @IsOptional()
  @IsString()
  proof?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({ description: 'New payment status', enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiPropertyOptional({ description: 'Transaction ID (if adding later)' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
