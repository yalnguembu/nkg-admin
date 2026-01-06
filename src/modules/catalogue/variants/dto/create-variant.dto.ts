import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, IsUUID, IsJSON, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CreatePriceDto } from '../../prices/dto/price.dto';

export class CreateVariantDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  attributes?: any;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [CreatePriceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceDto)
  @IsOptional()
  prices?: CreatePriceDto[];

  @ApiPropertyOptional({ description: 'Initial stock quantity', default: 0 })
  @IsOptional()
  @IsNumber()
  initialStock?: number;

  // Additional fields from frontend
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  compareAtPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxStock?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ type: [String], description: 'Variant image URLs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
