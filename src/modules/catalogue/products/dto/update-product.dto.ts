import { PartialType } from '@nestjs/swagger';
import { CreateProductFullDto } from './create-product-full.dto';

export class UpdateProductDto extends PartialType(CreateProductFullDto) {}
