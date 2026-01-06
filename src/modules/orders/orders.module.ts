import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { InstallationPricingController } from './installation-pricing.controller';
import { InstallationPricingService } from './installation-pricing.service';
import { PrismaModule } from '../../database/prisma.module';
import { WhatsAppService } from '../../utils/whatsapp/whatsapp.service';
import { WhatsAppTemplateService } from '../../utils/whatsapp/whatsapp-template.service';

import { PaymentController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';
import { CustomersModule } from '../customers/customers.module';
import { StockModule } from '../stock/stock.module';
import { CartModule } from '../cart/cart.module';
import { SystemConfigModule } from '../admin/system-config/system-config.module';

@Module({
  imports: [PrismaModule, CustomersModule, StockModule, CartModule, SystemConfigModule],
  controllers: [
    OrdersController,
    QuotesController,
    InstallationPricingController,
    PaymentController,
  ],
  providers: [
    OrdersService,
    QuotesService,
    InstallationPricingService,
    WhatsAppService,
    WhatsAppTemplateService,
    PaymentService,
  ],
  exports: [OrdersService, QuotesService, InstallationPricingService, PaymentService],
})
export class OrdersModule { }
