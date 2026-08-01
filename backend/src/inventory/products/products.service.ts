import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, AdjustStockDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string, opts: { search?: string; lowStockOnly?: boolean } = {}) {
    const where: any = { organizationId, deletedAt: null };
    if (opts.search) {
      where.OR = [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { sku: { contains: opts.search, mode: 'insensitive' } },
      ];
    }
    const products = await this.prisma.product.findMany({
      where,
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    if (opts.lowStockOnly) {
      return products.filter((p: { stockQuantity: number; lowStockThreshold: number }) => p.stockQuantity <= p.lowStockThreshold);
    }
    return products;
  }

  async get(organizationId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        supplier: true,
        stockMovements: { orderBy: { createdAt: 'desc' }, take: 30 },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(organizationId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: { organizationId, ...dto, stockQuantity: dto.stockQuantity ?? 0 },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.get(organizationId, id);
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async adjustStock(organizationId: string, id: string, dto: AdjustStockDto) {
    const product = await this.get(organizationId, id);

    let newQuantity = product.stockQuantity;
    if (dto.type === 'IN') newQuantity += dto.quantity;
    else if (dto.type === 'OUT') newQuantity -= dto.quantity;
    else newQuantity = dto.quantity;

    if (newQuantity < 0) {
      throw new BadRequestException('Stock cannot go below zero');
    }

    const [, movement] = await this.prisma.$transaction([
      this.prisma.product.update({ where: { id }, data: { stockQuantity: newQuantity } }),
      this.prisma.stockMovement.create({
        data: { organizationId, productId: id, type: dto.type, quantity: dto.quantity, reason: dto.reason },
      }),
    ]);

    return { product: await this.get(organizationId, id), movement };
  }

  async lowStockAlerts(organizationId: string) {
    return this.list(organizationId, { lowStockOnly: true });
  }
}