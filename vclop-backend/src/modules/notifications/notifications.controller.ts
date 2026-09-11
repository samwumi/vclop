import { Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('inbox')
  @ApiOperation({ summary: 'Fetch current user\'s notification inbox' })
  inbox(
    @CurrentUser() user: RequestUser,
    @Query('limit') limit?: string,
  ) {
    return this.service.inbox(user.id, Number(limit) || 30);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Count of unread notifications for the current user' })
  async unreadCount(@CurrentUser() user: RequestUser) {
    const count = await this.service.unreadCount(user.id);
    return ok(count, 'Unread count');
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return ok(await this.service.markRead(id, user.id), 'Marked as read');
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all of the current user\'s notifications as read' })
  async markAllRead(@CurrentUser() user: RequestUser) {
    await this.service.markAllRead(user.id);
    return ok(null, 'All notifications marked as read');
  }
}
