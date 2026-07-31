import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecordPaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string, opts: { invoiceId?: string; customerId?: string } = {}) {
    const where: any = { organizationId };
    if (opts.invoiceId) where.invoiceId = opts.invoiceId;
    if (opts.customerId) where.customerId = opts.customerId;
    return this.prisma.payment.findMany({
      where,
      include: { invoice: { select: { id: true, invoiceNumber: true } }, customer: { select: { id: true, name: true } } },
      orderBy: { paidAt: 'desc' },
    });
  }

  async record(organizationId: string, dto: RecordPaymentDto) {
    const payment = await this.prisma.payment.create({
      data: {
        organizationId,
        invoiceId: dto.invoiceId,
        customerId: dto.customerId,
        amountCents: dto.amountCents,
        method: dto.method,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
        notes: dto.notes,
      },
    });

    if (dto.invoiceId) {
      await this.maybeMarkInvoicePaid(organizationId, dto.invoiceId);
    }

    return payment;
  }

  private async maybeMarkInvoicePaid(organizationId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId, organizationId } });
    if (!invoice || invoice.status === 'PAID' || invoice.status === 'CANCELLED') return;

    const payments = await this.prisma.payment.findMany({ where: { invoiceId } });
    const paidCents = payments.reduce((sum: number, p: { amountCents: number }) => sum + p.amountCents, 0);

    if (paidCents >= invoice.totalCents) {
      await this.prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'PAID' } });
    }
  }

  async cashFlowSummary(organizationId: string) {
    const [payments, expenses] = await Promise.all([
      this.prisma.payment.findMany({ where: { organizationId } }),
      this.prisma.expense.findMany({ where: { organizationId, deletedAt: null } }),
    ]);
    const totalCollectedCents = payments.reduce((sum: number, p: { amountCents: number }) => sum + p.amountCents, 0);
    const totalSpentCents = expenses.reduce((sum: number, e: { amountCents: number }) => sum + e.amountCents, 0);
    return {
      totalCollectedCents,
      totalSpentCents,
      netCents: totalCollectedCents - totalSpentCents,
    };
  }
}