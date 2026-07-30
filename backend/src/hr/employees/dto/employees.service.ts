import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string, opts: { search?: string; departmentId?: string } = {}) {
    const where: any = { organizationId, deletedAt: null };
    if (opts.departmentId) where.departmentId = opts.departmentId;
    if (opts.search) {
      where.OR = [
        { fullName: { contains: opts.search, mode: 'insensitive' } },
        { email: { contains: opts.search, mode: 'insensitive' } },
        { designation: { contains: opts.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.employee.findMany({
      where,
      include: { department: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async get(organizationId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        department: true,
        attendance: { orderBy: { date: 'desc' }, take: 30 },
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(organizationId: string, dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        organizationId,
        ...dto,
        dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : undefined,
      },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateEmployeeDto) {
    await this.get(organizationId, id);
    return this.prisma.employee.update({
      where: { id },
      data: { ...dto, dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : undefined },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.get(organizationId, id);
    await this.prisma.employee.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}