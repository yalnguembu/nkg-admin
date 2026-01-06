import { IsString, IsObject, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuoteStatus } from '../../../common/enum';

export class CreateQuoteDto {
  // Usually created from an Order ID or Cart ID.
  // Assuming converting a Cart or Order to Quote.
  @ApiProperty({ description: 'Order ID associated with this quote', required: false })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Cart ID to convert to quote' })
  @IsOptional()
  @IsString()
  cartId?: string;

  @ApiPropertyOptional({ description: 'Installation configuration' })
  @IsOptional()
  @IsObject()
  installationConfig?: any;

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class UpdateQuoteDto {
  @ApiPropertyOptional({ description: 'Status', enum: QuoteStatus })
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class AcceptQuoteDto {
  @ApiPropertyOptional({ description: 'Notes for acceptance' })
  @IsOptional()
  @IsString()
  notes?: string;
}
