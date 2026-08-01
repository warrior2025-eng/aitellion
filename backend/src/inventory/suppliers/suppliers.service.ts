import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string) {
    return this.prisma.supplier.findMany({
      where: { organizationId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(organizationId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: { organizationId, ...dto } });
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.supplier.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundException('Supplier not found');
    await this.prisma.supplier.delete({ where: { id } });
    return { success: true };
  }
}