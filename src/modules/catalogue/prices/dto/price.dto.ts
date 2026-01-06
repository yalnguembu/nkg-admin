import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePriceDto {
  @ApiProperty({ description: 'Product variant ID' })
  @IsUUID()
  variantId: string;

  @ApiProperty({
    description: 'Price type',
    enum: ['BASE', 'WHOLESALE', 'PROMO'],
  })
  @IsEnum(['BASE', 'WHOLESALE', 'PROMO'])
  priceType: string;

  @ApiProperty({
    description: 'Customer type',
    enum: ['B2C', 'B2B', 'PARTICULIER', 'AGENT_COMMERCIAL', 'REVENDEUR'],
  })
  @IsEnum(['B2C', 'B2B', 'PARTICULIER', 'AGENT_COMMERCIAL', 'REVENDEUR'])
  customerType: string;

  @ApiProperty({ description: 'Price amount', example: 15000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'XAF' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Minimum quantity', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ description: 'Valid from date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Valid to date' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional({ description: 'Is price active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreatePromotionDto {
  @ApiProperty({ description: 'Product variant ID' })
  @IsUUID()
  variantId: string;

  @ApiProperty({
    description: 'Customer type',
    enum: ['B2C', 'B2B', 'PARTICULIER', 'AGENT_COMMERCIAL', 'REVENDEUR'],
  })
  @IsEnum(['B2C', 'B2B', 'PARTICULIER', 'AGENT_COMMERCIAL', 'REVENDEUR'])
  customerType: string;

  @ApiProperty({ description: 'Promotional price', example: 12000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Valid from date' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: 'Valid to date' })
  @IsDateString()
  validTo: string;

  @ApiPropertyOptional({ description: 'Minimum quantity', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number;
}

export class UpdatePriceDto {
  @ApiPropertyOptional({ description: 'Price amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: 'Minimum quantity' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ description: 'Valid from date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Valid to date' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional({ description: 'Is price active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
