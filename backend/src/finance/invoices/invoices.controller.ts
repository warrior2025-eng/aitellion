import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from './dto/invoice.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgRole } from '@prisma/client';

@ApiTags('finance/invoices')
@ApiBearerAuth()
@Controller('finance/invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  list(
    @CurrentUser('organizationId') organizationId: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.invoicesService.list(organizationId, { status, customerId });
  }

  @Get(':id')
  get(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.invoicesService.get(organizationId, id);
  }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.FINANCE)
  create(@CurrentUser('organizationId') organizationId: string, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(organizationId, dto);
  }

  @Patch(':id/status')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.FINANCE)
  updateStatus(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    return this.invoicesService.updateStatus(organizationId, id, dto.status);
  }

  @Delete(':id')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.FINANCE)
  remove(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.invoicesService.remove(organizationId, id);
  }
}