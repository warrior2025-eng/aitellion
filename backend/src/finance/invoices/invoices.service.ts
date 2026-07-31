import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string, opts: { status?: string; customerId?: string } = {}) {
    const where: any = { organizationId, deletedAt: null };
    if (opts.status) where.status = opts.status;
    if (opts.customerId) where.customerId = opts.customerId;
    return this.prisma.invoice.findMany({
      where,
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { issueDate: 'desc' },
    });
  }

  async get(organizationId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { customer: true, payments: { orderBy: { paidAt: 'desc' } } },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(organizationId: string, dto: CreateInvoiceDto) {
    const subtotalCents = dto.items.reduce(
      (sum, item) => sum + Math.round(item.quantity * item.unitPriceCents),
      0,
    );
    const taxCents = dto.taxCents ?? 0;
    const totalCents = subtotalCents + taxCents;

    const invoiceNumber = await this.nextInvoiceNumber(organizationId);

    return this.prisma.invoice.create({
      data: {
        organizationId,
        invoiceNumber,
        customerId: dto.customerId,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        items: dto.items as any,
        subtotalCents,
        taxCents,
        totalCents,
        notes: dto.notes,
      },
    });
  }

  async updateStatus(organizationId: string, id: string, status: string) {
    await this.get(organizationId, id);
    return this.prisma.invoice.update({ where: { id }, data: { status: status as any } });
  }

  async remove(organizationId: string, id: string) {
    await this.get(organizationId, id);
    await this.prisma.invoice.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  private async nextInvoiceNumber(organizationId: string): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { organizationId } });
    return `INV-${String(count + 1).padStart(4, '0')}`;
  }
}