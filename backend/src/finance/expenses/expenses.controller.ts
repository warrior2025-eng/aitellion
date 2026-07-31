import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/expense.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgRole } from '@prisma/client';

@ApiTags('finance/expenses')
@ApiBearerAuth()
@Controller('finance/expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  list(@CurrentUser('organizationId') organizationId: string, @Query('category') category?: string) {
    return this.expensesService.list(organizationId, { category });
  }

  @Get('summary')
  summary(@CurrentUser('organizationId') organizationId: string) {
    return this.expensesService.summaryByCategory(organizationId);
  }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.FINANCE)
  create(@CurrentUser('organizationId') organizationId: string, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(organizationId, dto);
  }

  @Delete(':id')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.FINANCE)
  remove(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.expensesService.remove(organizationId, id);
  }
}