import { IsString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReserveStockDto {
  @ApiProperty({ description: 'Quantity to reserve', example: 5 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Reference ID (e.g. Order ID)', example: 'uuid' })
  @IsUUID()
  referenceId: string;

  @ApiProperty({ description: 'Reference type', example: 'ORDER' })
  @IsString()
  referenceType: 'ORDER' | 'RESERVATION';
}

export class ReleaseStockDto {
  @ApiProperty({ description: 'Quantity to release', example: 5 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Reference ID (e.g. Order ID)', example: 'uuid' })
  @IsUUID()
  referenceId: string;

  @ApiProperty({ description: 'Reference type', example: 'ORDER' })
  @IsString()
  referenceType: 'ORDER' | 'RESERVATION';
}

export class StockAdjustmentDto {
  @ApiProperty({ description: 'Quantity adjustment (positive or negative)', example: 10 })
  @IsInt()
  quantity: number;

  @ApiProperty({ description: 'Reason for adjustment', example: 'Inventory count' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Supplier ID for restocking' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}
