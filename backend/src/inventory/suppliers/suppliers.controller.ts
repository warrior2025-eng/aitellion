import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/supplier.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgRole } from '@prisma/client';

@ApiTags('inventory/suppliers')
@ApiBearerAuth()
@Controller('inventory/suppliers')
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Get()
  list(@CurrentUser('organizationId') organizationId: string) {
    return this.suppliersService.list(organizationId);
  }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MANAGER)
  create(@CurrentUser('organizationId') organizationId: string, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(organizationId, dto);
  }

  @Delete(':id')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MANAGER)
  remove(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.suppliersService.remove(organizationId, id);
  }
}