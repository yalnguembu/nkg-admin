import { IsString, IsOptional, IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiPropertyOptional({ description: 'Cart ID if adding to existing cart' })
  @IsOptional()
  @IsUUID()
  cartId?: string;

  @ApiPropertyOptional({ description: 'Customer ID for authenticated users' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Session ID for guest users' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Product variant ID (required if not service)' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional({ description: 'Service ID (required if not variant)' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiProperty({ description: 'Quantity to add', example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New quantity', example: 2 })
  @IsInt()
  @Min(0)
  quantity: number;
}

export class MergeCartDto {
  @ApiProperty({ description: 'Guest session ID' })
  @IsString()
  guestSessionId: string;

  @ApiProperty({ description: 'Customer ID to merge cart into' })
  @IsUUID()
  customerId: string;
}
