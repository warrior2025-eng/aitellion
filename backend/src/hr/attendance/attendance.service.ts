import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarkAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string, opts: { employeeId?: string; date?: string } = {}) {
    const where: any = { organizationId };
    if (opts.employeeId) where.employeeId = opts.employeeId;
    if (opts.date) where.date = new Date(opts.date);
    return this.prisma.attendance.findMany({
      where,
      include: { employee: { select: { id: true, fullName: true } } },
      orderBy: { date: 'desc' },
      take: 200,
    });
  }

  async mark(organizationId: string, dto: MarkAttendanceDto) {
    const date = new Date(dto.date);
    return this.prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: dto.employeeId, date } },
      create: {
        organizationId,
        employeeId: dto.employeeId,
        date,
        status: dto.status,
        notes: dto.notes,
      },
      update: { status: dto.status, notes: dto.notes },
    });
  }

  async summaryForDate(organizationId: string, date: string) {
    const records = await this.prisma.attendance.findMany({
      where: { organizationId, date: new Date(date) },
    });
    const totalEmployees = await this.prisma.employee.count({
      where: { organizationId, deletedAt: null, status: 'ACTIVE' },
    });
    const counts = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, WORK_FROM_HOME: 0 };
    for (const r of records) counts[r.status as keyof typeof counts]++;
    return { date, totalEmployees, marked: records.length, counts };
  }
}