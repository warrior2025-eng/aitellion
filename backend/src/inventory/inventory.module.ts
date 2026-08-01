import { Module } from '@nestjs/common';
import { SuppliersController } from './suppliers/suppliers.controller';
import { SuppliersService } from './suppliers/suppliers.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';

@Module({
  controllers: [SuppliersController, ProductsController],
  providers: [SuppliersService, ProductsService],
  exports: [SuppliersService, ProductsService],
})
export class InventoryModule {}