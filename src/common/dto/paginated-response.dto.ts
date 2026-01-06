import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from './page-meta.dto';

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty()
  meta: PageMetaDto;
}
