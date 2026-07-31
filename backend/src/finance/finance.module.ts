import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices/invoices.controller';
import { InvoicesService } from './invoices/invoices.service';
import { ExpensesController } from './expenses/expenses.controller';
import { ExpensesService } from './expenses/expenses.service';
import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';

@Module({
  controllers: [InvoicesController, ExpensesController, PaymentsController],
  providers: [InvoicesService, ExpensesService, PaymentsService],
  exports: [InvoicesService, ExpensesService, PaymentsService],
})
export class FinanceModule {}