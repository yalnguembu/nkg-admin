import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { ModelModule } from './models/model.module';
import { ProductsModule } from './products/products.module';
import { VariantsModule } from './variants/variants.module';
import { PricesModule } from './prices/prices.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    CategoriesModule,
    BrandsModule,
    ModelModule,
    ProductsModule,
    VariantsModule,
    PricesModule,
    SuppliersModule,
  ],
})
export class CatalogueModule { }
