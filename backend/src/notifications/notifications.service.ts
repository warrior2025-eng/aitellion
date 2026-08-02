import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrgRole } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string, userId: string, take = 30) {
    return this.prisma.notification.findMany({
      where: { organizationId, userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async unreadCount(organizationId: string, userId: string) {
    const count = await this.prisma.notification.count({
      where: { organizationId, userId, readAt: null },
    });
    return { count };
  }

  async markRead(organizationId: string, userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, organizationId, userId },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async markAllRead(organizationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { organizationId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async notifyUser(organizationId: string, userId: string, title: string, body?: string) {
    return this.prisma.notification.create({ data: { organizationId, userId, title, body } });
  }

  async notifyRoles(organizationId: string, roles: OrgRole[], title: string, body?: string) {
    const members = await this.prisma.orgMembership.findMany({
      where: { organizationId, role: { in: roles } },
      select: { userId: true },
    });
    if (members.length === 0) return;
    await this.prisma.notification.createMany({
      data: members.map((m: { userId: string }) => ({ organizationId, userId: m.userId, title, body })),
    });
  }
}