import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomersController, AddressesController],
  providers: [CustomersService, AddressesService],
  exports: [CustomersService, AddressesService],
})
export class CustomersModule { }
