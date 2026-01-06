import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AddToCartDto, UpdateCartItemDto, MergeCartDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) { }

  async getOrCreateCart(customerId?: string, sessionId?: string) {
    if (!customerId && !sessionId) {
      throw new BadRequestException(
        'Either customerId or sessionId is required',
      );
    }

    const existingCart = await this.prisma.cart.findFirst({
      where: {
        OR: [
          customerId ? { customerId } : {},
          sessionId ? { sessionId } : {},
        ].filter((obj) => Object.keys(obj).length > 0),
        expiresAt: { gt: new Date() },
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { isPrimary: true },
                      take: 1,
                    },
                  },
                },
                stock: true,
                prices: {
                  where: {
                    isActive: true,
                    validFrom: { lte: new Date() },
                    OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
                  },
                },
              },
            },
          },
        },
      },
    });

    if (existingCart) {
      return existingCart;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.cart.create({
      data: {
        customerId,
        sessionId,
        expiresAt,
      },
      include: {
        items: true,
      },
    });
  }

  async addItem(dto: AddToCartDto) {
    if (!dto.variantId && !dto.serviceId) {
      throw new BadRequestException('Either variantId or serviceId is required');
    }

    let variant = null;
    let service = null;

    if (dto.variantId) {
      variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
        include: {
          product: true,
          stock: true,
        },
      });

      if (!variant || !variant.isActive || !variant.product.isActive) {
        throw new BadRequestException('Product is not available');
      }

      if (!variant.product.isDropshipping) {
        const availableQuantity =
          (variant.stock?.quantity || 0) -
          (variant.stock?.reservedQuantity || 0);
        if (availableQuantity < dto.quantity) {
          throw new BadRequestException(
            `Insufficient stock. Available: ${availableQuantity}`,
          );
        }
      }
    } else if (dto.serviceId) {
      service = await this.prisma.service.findUnique({
        where: { id: dto.serviceId },
      });
      if (!service || !service.isActive) {
        throw new BadRequestException('Service is not available');
      }
    }

    const cart = await this.getOrCreateCart(dto.customerId, dto.sessionId);

    // Check for existing item
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        // Match either variant OR service
        ...(dto.variantId ? { variantId: dto.variantId } : { serviceId: dto.serviceId }),
      },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + dto.quantity,
        },
        include: {
          variant: {
            include: {
              product: true,
            },
          },
          service: true,
        },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: dto.variantId,
        serviceId: dto.serviceId,
        quantity: dto.quantity,
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        service: true,
      },
    });
  }

  async updateItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        variant: {
          include: {
            product: true,
            stock: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Cart item with ID "${itemId}" not found`);
    }

    if (!item.variant.product.isDropshipping) {
      const availableQuantity =
        (item.variant.stock?.quantity || 0) -
        (item.variant.stock?.reservedQuantity || 0);
      if (availableQuantity < quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${availableQuantity}`,
        );
      }
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async removeItem(itemId: string) {
    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async getCartWithCalculations(cartId: string, customerType = 'B2C') {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { isPrimary: true },
                      take: 1,
                    },
                  },
                },
                stock: true,
                prices: {
                  where: {
                    customerType: customerType as any,
                    isActive: true,
                    validFrom: { lte: new Date() },
                    OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
                  },
                  orderBy: {
                    minQuantity: 'desc',
                  },
                },
              },
            },
            service: true, // Include Service details
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID "${cartId}" not found`);
    }

    let requiresQuote = false;

    const itemsWithPrices = cart.items.map((item) => {
      // Handle Service Items
      if (item.serviceId && item.service) {
        requiresQuote = true; // Services always require quote
        return {
          ...item,
          variant: null, // Ensure variant is explicit null/undefined if service exists
          name: item.service.name,
          imageUrl: item.service.imageUrl,
          unitPrice: 0,
          totalPrice: 0,
          priceType: 'QUOTE_REQUIRED',
          isAvailable: true, // Services assumed available for quote
          availableQuantity: 999,
          requiresQuote: true,
        };
      }

      // Handle Product Variants
      if (item.variant) {
        if (item.variant.product.requiresInstallation) {
          // If product requires installation, does it mandate a quote?
          // User earlier said "propose installations services ... make quote".
          // But if it's just a product, maybe standard checkout?
          // For now, assume products are standard unless explicit logic changes.
        }

        const applicablePrice = item.variant.prices.find(
          (p) => p.minQuantity <= item.quantity,
        );

        const unitPrice = applicablePrice
          ? applicablePrice.amount.toNumber()
          : 0;
        const totalPrice = unitPrice * item.quantity;

        const availableQuantity = item.variant.product.isDropshipping
          ? 999999
          : (item.variant.stock?.quantity || 0) -
          (item.variant.stock?.reservedQuantity || 0);

        return {
          ...item,
          name: `${item.variant.product.name} - ${item.variant.name || 'Standard'}`,
          imageUrl: item.variant.product.images?.[0]?.imageUrl,
          unitPrice,
          totalPrice,
          priceType: applicablePrice?.priceType || 'BASE',
          isAvailable: availableQuantity >= item.quantity,
          availableQuantity,
          requiresQuote: false,
        };
      }

      return item; // Fallback
    });

    const subtotal = itemsWithPrices.reduce(
      (sum, item) => {
        const price = (item as any).totalPrice || 0;
        return sum + price;
      },
      0,
    );

    return {
      ...cart,
      items: itemsWithPrices,
      requiresQuote, // Flag for Frontend to switch Checkout -> Quote
      summary: {
        itemCount: cart.items.length,
        totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        estimatedTotal: subtotal,
      },
    };
  }

  async clearCart(cartId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });

    return { message: 'Cart cleared successfully' };
  }

  async mergeGuestCart(dto: MergeCartDto) {
    const guestCart = await this.prisma.cart.findFirst({
      where: { sessionId: dto.guestSessionId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return null;
    }

    const customerCart = await this.getOrCreateCart(dto.customerId);

    for (const item of guestCart.items) {
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: customerCart.id,
          ...(item.variantId ? { variantId: item.variantId } : { serviceId: item.serviceId }),
        },
      });

      if (existingItem) {
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + item.quantity,
          },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: customerCart.id,
            variantId: item.variantId,
            serviceId: item.serviceId,
            quantity: item.quantity,
          },
        });
      }
    }

    await this.prisma.cart.delete({
      where: { id: guestCart.id },
    });

    return this.getCartWithCalculations(customerCart.id);
  }
}
