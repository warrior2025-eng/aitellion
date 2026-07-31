import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string, opts: { category?: string } = {}) {
    const where: any = { organizationId, deletedAt: null };
    if (opts.category) where.category = opts.category;
    return this.prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
  }

  async create(organizationId: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: { organizationId, ...dto, date: new Date(dto.date) },
    });
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.expense.findFirst({ where: { id, organizationId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Expense not found');
    await this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async summaryByCategory(organizationId: string) {
    const expenses = await this.prisma.expense.findMany({ where: { organizationId, deletedAt: null } });
    const totals: Record<string, number> = {};
    for (const e of expenses) totals[e.category] = (totals[e.category] ?? 0) + e.amountCents;
    return Object.entries(totals).map(([category, totalCents]) => ({ category, totalCents }));
  }
}