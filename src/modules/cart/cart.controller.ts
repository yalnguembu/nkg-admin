import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, MergeCartDto } from './dto/cart.dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Get()
  @ApiOperation({ summary: 'Get or create a cart' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'sessionId', required: false })
  getOrCreate(
    @Query('customerId') customerId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.cartService.getOrCreateCart(customerId, sessionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cart with calculations' })
  @ApiQuery({ name: 'customerType', required: false, example: 'B2C' })
  getCart(
    @Param('id') id: string,
    @Query('customerType') customerType?: string,
  ) {
    return this.cartService.getCartWithCalculations(id, customerType);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added successfully' })
  addItem(@Body() dto: AddToCartDto) {
    return this.cartService.addItem(dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  updateItem(@Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItemQuantity(id, dto.quantity);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed successfully' })
  removeItem(@Param('id') id: string) {
    return this.cartService.removeItem(id);
  }

  @Delete(':id/clear')
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  clearCart(@Param('id') id: string) {
    return this.cartService.clearCart(id);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge guest cart with customer cart' })
  @ApiResponse({ status: 200, description: 'Carts merged successfully' })
  mergeCart(@Body() dto: MergeCartDto) {
    return this.cartService.mergeGuestCart(dto);
  }
}
