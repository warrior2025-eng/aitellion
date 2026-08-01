import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, AdjustStockDto } from './dto/product.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgRole } from '@prisma/client';

@ApiTags('inventory/products')
@ApiBearerAuth()
@Controller('inventory/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  list(@CurrentUser('organizationId') organizationId: string, @Query('search') search?: string) {
    return this.productsService.list(organizationId, { search });
  }

  @Get('low-stock')
  lowStock(@CurrentUser('organizationId') organizationId: string) {
    return this.productsService.lowStockAlerts(organizationId);
  }

  @Get(':id')
  get(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.productsService.get(organizationId, id);
  }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MANAGER)
  create(@CurrentUser('organizationId') organizationId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(organizationId, dto);
  }

  @Post(':id/adjust-stock')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MANAGER)
  adjustStock(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.productsService.adjustStock(organizationId, id, dto);
  }

  @Delete(':id')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MANAGER)
  remove(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.productsService.remove(organizationId, id);
  }
}