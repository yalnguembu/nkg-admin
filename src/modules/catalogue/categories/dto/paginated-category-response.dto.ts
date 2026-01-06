import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto } from './category-response.dto';
import { PageMetaDto } from '../../../../common/dto/page-meta.dto';

export class PaginatedCategoryDataDto {
  @ApiProperty({ type: [CategoryDto] })
  data: CategoryDto[];

  @ApiProperty()
  meta: PageMetaDto;
}

export class PaginatedCategoryResponseDto {
  @ApiProperty()
  data: PaginatedCategoryDataDto;
}

export class CategoryTreeResponseDto {
  @ApiProperty({ type: [CategoryDto] })
  data: CategoryDto[];
}

export class SingleCategoryResponseDto {
  @ApiProperty()
  data: CategoryDto;
}
