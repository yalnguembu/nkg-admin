import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryCountDto {
  @ApiProperty()
  products: number;

  @ApiPropertyOptional()
  children?: number;
}

export class CategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => CategoryDto, isArray: true })
  children?: CategoryDto[];

  @ApiPropertyOptional()
  _count?: CategoryCountDto;
}
