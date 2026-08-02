import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
    @Query('take') take?: string,
  ) {
    return this.notificationsService.list(organizationId, userId, take ? Number(take) : undefined);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser('organizationId') organizationId: string, @CurrentUser('userId') userId: string) {
    return this.notificationsService.unreadCount(organizationId, userId);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(organizationId, userId, id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('organizationId') organizationId: string, @CurrentUser('userId') userId: string) {
    return this.notificationsService.markAllRead(organizationId, userId);
  }
}