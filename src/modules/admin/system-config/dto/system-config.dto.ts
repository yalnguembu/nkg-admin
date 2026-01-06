import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSystemConfigDto {
  @ApiProperty({ description: 'Configuration key', example: 'whatsapp_enabled' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @ApiProperty({ description: 'Configuration value', example: 'true' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ description: 'Description of the configuration' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSystemConfigDto {
  @ApiProperty({ description: 'Configuration value', example: 'false' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ description: 'Description of the configuration' })
  @IsOptional()
  @IsString()
  description?: string;
}
