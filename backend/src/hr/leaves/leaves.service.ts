import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeaveRequestDto } from './dto/leave.dto';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string, opts: { employeeId?: string; status?: string } = {}) {
    const where: any = { organizationId };
    if (opts.employeeId) where.employeeId = opts.employeeId;
    if (opts.status) where.status = opts.status;
    return this.prisma.leaveRequest.findMany({
      where,
      include: { employee: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, dto: CreateLeaveRequestDto) {
    return this.prisma.leaveRequest.create({
      data: {
        organizationId,
        employeeId: dto.employeeId,
        type: dto.type,
        reason: dto.reason,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async setStatus(organizationId: string, id: string, status: 'APPROVED' | 'REJECTED', approverId: string) {
    const existing = await this.prisma.leaveRequest.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundException('Leave request not found');
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status, approvedById: approverId },
    });
  }
}