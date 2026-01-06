import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product-full.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) { }
