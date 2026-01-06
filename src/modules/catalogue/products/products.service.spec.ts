import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../../../database/prisma.service';
import { CustomerType, PriceType } from '@prisma/client';

describe('ProductsService - Price Calculation', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {}, // Mock Prisma
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  const mockPrices = [
    {
      priceType: PriceType.BASE,
      customerType: CustomerType.B2C,
      amount: 1000,
      minQuantity: 1,
      isActive: true,
      validFrom: new Date('2000-01-01'),
      validTo: null,
    },
    {
      priceType: PriceType.BASE,
      customerType: CustomerType.B2C,
      amount: 800,
      minQuantity: 10,
      isActive: true,
      validFrom: new Date('2000-01-01'),
      validTo: null,
    },
    {
      priceType: PriceType.PROMO,
      customerType: CustomerType.B2C,
      amount: 500,
      minQuantity: 1,
      isActive: true,
      validFrom: new Date('2025-01-01'),
      validTo: new Date('2025-12-31'),
    },
  ];

  it('should prioritize PROMO over BASE for unit price', () => {
    // Current date is 2025-12-27 per system context
    const bestPrice = (service as any).calculateBestPrice(mockPrices, CustomerType.B2C);
    expect(bestPrice.unitPrice).toBe(500);
    expect(bestPrice.priceType).toBe(PriceType.PROMO);
  });

  it('should select bulk price for minQuantity > 1', () => {
    const bestPrice = (service as any).calculateBestPrice(mockPrices, CustomerType.B2C);
    expect(bestPrice.bulkPrice).toBe(800);
    expect(bestPrice.bulkMinQuantity).toBe(10);
  });

  it('should return null for unitPrice if only bulk prices are active', () => {
    const inactivePrices = [
      { ...mockPrices[0], isActive: false }, // Inactive BASE minQty 1
      { ...mockPrices[1], amount: 900 },    // Active BASE minQty 10
    ];
    const bestPrice = (service as any).calculateBestPrice(inactivePrices, CustomerType.B2C);
    expect(bestPrice.unitPrice).toBeNull();
    expect(bestPrice.bulkPrice).toBe(900);
  });

  it('should prioritize WHOLESALE for B2B unit price', () => {
    const b2bPrices = [
      mockPrices[0], // B2C BASE
      {
        priceType: PriceType.WHOLESALE,
        customerType: CustomerType.B2B,
        amount: 300,
        minQuantity: 1,
        isActive: true,
        validFrom: new Date('2000-01-01'),
        validTo: null,
      }
    ];
    const bestPrice = (service as any).calculateBestPrice(b2bPrices, CustomerType.B2B);
    expect(bestPrice.unitPrice).toBe(300);
    expect(bestPrice.priceType).toBe(PriceType.WHOLESALE);
  });

  it('should respect date validity', () => {
    const expiredPromo = [
      mockPrices[0], // Base
      {
        ...mockPrices[2],
        validFrom: new Date('2020-01-01'),
        validTo: new Date('2021-01-01'), // Expired
      }
    ];
    const bestPrice = (service as any).calculateBestPrice(expiredPromo, CustomerType.B2C);
    expect(bestPrice.unitPrice).toBe(1000); // Back to BASE
  });
});
