import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string) {
    return this.prisma.department.findMany({
      where: { organizationId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(organizationId: string, dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: { organizationId, ...dto } });
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.department.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundException('Department not found');
    await this.prisma.department.delete({ where: { id } });
    return { success: true };
  }
}