import { ApiProperty } from '@nestjs/swagger';

export class DataResponseDto<T> {
  @ApiProperty()
  data: T;
}
