import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { VariantsService } from './variants.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Variants')
@Controller('catalogue/variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) { }

  @Post('product/:productId')
  @ApiOperation({ summary: 'Add variant to product' })
  create(
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto
  ) {
    return this.variantsService.create(productId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update variant' })
  update(@Param('id') id: string, @Body() dto: UpdateVariantDto) {
    return this.variantsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete variant' })
  remove(@Param('id') id: string) {
    return this.variantsService.remove(id);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Update variant stock quantity' })
  updateStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.variantsService.updateStock(id, quantity);
  }
}
