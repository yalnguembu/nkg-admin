import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModelDto {
  @ApiProperty({ description: 'Brand ID', example: 'uuid' })
  @IsUUID()
  brandId: string;

  @ApiProperty({ description: 'Model name', example: 'RT81015' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Model reference', example: 'RT81015' })
  @IsString()
  @MaxLength(100)
  reference: string;

  @ApiPropertyOptional({ description: 'Year of model', example: 2024 })
  @IsOptional()
  @IsInt()
  year?: number;



  @ApiPropertyOptional({ description: 'Is model active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateModelDto {
  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Model name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Model reference' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ description: 'Year of model' })
  @IsOptional()
  @IsInt()
  year?: number;



  @ApiPropertyOptional({ description: 'Is model active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
