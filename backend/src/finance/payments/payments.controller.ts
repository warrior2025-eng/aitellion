import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgRole } from '@prisma/client';

@ApiTags('finance/payments')
@ApiBearerAuth()
@Controller('finance/payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  list(
    @CurrentUser('organizationId') organizationId: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.paymentsService.list(organizationId, { invoiceId, customerId });
  }

  @Get('cash-flow')
  cashFlow(@CurrentUser('organizationId') organizationId: string) {
    return this.paymentsService.cashFlowSummary(organizationId);
  }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.FINANCE)
  record(@CurrentUser('organizationId') organizationId: string, @Body() dto: RecordPaymentDto) {
    return this.paymentsService.record(organizationId, dto);
  }
}