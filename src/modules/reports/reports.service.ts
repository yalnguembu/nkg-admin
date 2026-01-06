import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PriceType } from '@prisma/client';
import { ReportFilterDto, ReportPeriod } from './dto/report.dto';
import { OrderStatus } from '../../common/enum';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) { }

  async getDashboardSummary() {
    const [totalSales, totalOrders, totalCustomers, lowStock] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: { not: OrderStatus.CANCELLED } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({
        where: { status: { not: OrderStatus.CANCELLED } },
      }),
      this.prisma.customer.count(),
      this.prisma.stock.count({
        where: { quantity: { lte: 5 } } // Hardcoded threshold or fetch from config
      }),
    ]);

    return {
      totalSales: Number(totalSales._sum.totalAmount || 0),
      totalOrders,
      totalCustomers,
      lowStockCount: lowStock,
    };
  }

  async getTopSellingProducts(limit = 5) {
    // Group by productId via OrderItem
    const topItems = await this.prisma.orderItem.groupBy({
      by: ['productName'],
      _sum: {
        quantity: true,
        totalPrice: true
      },
      orderBy: {
        _sum: { quantity: 'desc' }
      },
      take: limit,
    });

    return topItems.map(item => ({
      productName: item.productName,
      quantity: item._sum.quantity,
      revenue: Number(item._sum.totalPrice)
    }));
  }

  async getSalesChart(filter: ReportFilterDto) {
    // Stub for chart data. 
    // Group orders by date based on period.
    // This is complex in Prisma raw SQL or requires post-processing js.
    // For prototype, returning simple aggregated grouping by day/month is better done via Raw Query for performance,
    // or fetching all within range and grouping in JS.

    const startDate = filter.startDate ? new Date(filter.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: { not: OrderStatus.CANCELLED }
      },
      select: {
        createdAt: true,
        totalAmount: true
      }
    });

    // Grouping logic (simplified)
    const grouped = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = 0;
      grouped[date] += Number(order.totalAmount);
    });

    return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
  }

  async getInventoryValuation() {
    // Value = Sum(Stock.quantity * Price.BASE)
    // This is tricky because Price is on Variant, Stock is on Variant.
    // We need to fetch all variants with their stock and base price.

    const stocks = await this.prisma.stock.findMany({
      include: {
        variant: {
          include: {
            prices: {
              where: { priceType: PriceType.BASE } // Default base price
            }
          }
        }
      }
    });

    let totalValue = 0;
    let totalItems = 0;

    stocks.forEach(stock => {
      const price = stock.variant.prices.find(p => p.priceType === PriceType.BASE)?.amount || 0;
      totalValue += Number(price) * stock.quantity;
      totalItems += stock.quantity;
    });

    return {
      totalValue,
      totalItems,
      skuCount: stocks.length
    };
  }
}
