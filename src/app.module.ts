import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { CatalogueModule } from './modules/catalogue/catalogue.module';
import { StockModule } from './modules/stock/stock.module';
import { CustomersModule } from './modules/customers/customers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadModule } from './modules/upload/upload.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuthModule } from './modules/auth/auth.module';
import { CartModule } from './modules/cart/cart.module';
import databaseConfig from './config/database.config';
import supabaseConfig from './config/supabase.config';
import appConfig from './config/app.config';

import { DocumentsModule } from './modules/documents/documents.module';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, supabaseConfig, appConfig],
    }),
    PrismaModule,
    CatalogueModule,
    StockModule,
    CustomersModule,
    OrdersModule,
    AdminModule,
    UploadModule,
    ReportsModule,
    AuthModule,
    CartModule,
    DocumentsModule,
    FilesModule,
  ],
})
export class AppModule { }
