import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ServiceType } from '../../common/enum';

@Injectable()
export class InstallationPricingService {
  constructor(private prisma: PrismaService) { }

  async calculateCost(items: any[], serviceType: ServiceType = ServiceType.ELECTRICAL_INSTALLATION): Promise<number> {
    const pricing = await this.prisma.installationPricing.findFirst({
      where: { serviceType: serviceType as any, isActive: true },
    });

    if (!pricing) {
      // Fallback/Stub cost
      return 5000;
    }

    let totalCost = 0;
    let installableItemsCount = 0;

    for (const item of items) {
      if (item.variant?.product?.requiresInstallation) {
        installableItemsCount += item.quantity;
      }
    }

    if (installableItemsCount > 0) {
      // Logic: HourlyRate * Count (Assume 0.5h per item?) 
      // Simplified: HourlyRate * Count
      totalCost += Number(pricing.hourlyRate) * installableItemsCount;

      // Add travel cost if applicable? For now just base.
    }

    return totalCost;
  }

  async findAll() {
    return this.prisma.installationPricing.findMany({
      where: { isActive: true }
    });
  }

  async findOne(id: string) {
    return this.prisma.installationPricing.findUnique({
      where: { id }
    });
  }
}
