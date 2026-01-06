import { IsString, IsEmail, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType } from '../../../common/enum';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer ID (from auth provider)', example: 'uuid' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company name (for B2B)' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Tax ID (for B2B)' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Customer type',
    enum: CustomerType,
    default: CustomerType.PARTICULIER
  })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Tax ID' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Manually upgrade customer type' })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;
}

export class CustomerStatsDto {
  @ApiProperty({ description: 'Total amount spent' })
  totalSpent: number;

  @ApiProperty({ description: 'Total number of orders' })
  orderCount: number;

  @ApiProperty({ description: 'Average order value' })
  averageOrderValue: number;
}
