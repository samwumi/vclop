import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';

export interface NotificationPayload {
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  event: string;
  variables?: Record<string, string | number | boolean>;
  channel?: NotificationChannel;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter!: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.initMailTransport();
  }

  private initMailTransport(): void {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('mail.host'),
      port: this.config.get<number>('mail.port'),
      secure: this.config.get<boolean>('mail.secure'),
      auth: {
        user: this.config.get<string>('mail.user'),
        pass: this.config.get<string>('mail.password'),
      },
    });
  }

  @OnEvent('notification.send')
  async handleNotificationSend(payload: NotificationPayload): Promise<void> {
    const channels = payload.channel
      ? [payload.channel]
      : [NotificationChannel.EMAIL]; // default to email

    for (const channel of channels) {
      await this.dispatchNotification(payload, channel);
    }
  }

  async inbox(userId: string, limit = 30) {
    return this.prisma.notificationLog.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notificationLog.count({
      where: { recipientId: userId, readAt: null },
    });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notificationLog.updateMany({
      where: { id, recipientId: userId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notificationLog.updateMany({
      where: { recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async notifyPermission(permission: string | null, event: string, subject: string, body: string): Promise<void> {
    if (!permission) return;
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        OR: [
          { userRoles: { some: { role: { rolePermissions: { some: { permission: { code: permission, isActive: true } } } } } } },
          { userPermissions: { some: { granted: true, permission: { code: permission, isActive: true } } } },
        ],
      },
      select: { id: true },
    });
    if (!users.length) return;
    await this.prisma.notificationLog.createMany({ data: users.map((user) => ({ recipientId: user.id, recipientRef: user.id, channel: NotificationChannel.IN_APP, event, subject, body, status: NotificationStatus.DELIVERED, attempts: 1, deliveredAt: new Date() })) });
  }

  private async dispatchNotification(
    payload: NotificationPayload,
    channel: NotificationChannel,
  ): Promise<void> {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: { event: payload.event, channel, isActive: true },
    });

    if (!template) {
      this.logger.warn(`No template found for event '${payload.event}' on channel '${channel}'`);
      return;
    }

    const subject = template.subject
      ? Handlebars.compile(template.subject)(payload.variables ?? {})
      : undefined;
    const body = template.bodyText
      ? Handlebars.compile(template.bodyText)(payload.variables ?? {})
      : undefined;

    const log = await this.prisma.notificationLog.create({
      data: {
        recipientId: payload.recipientId,
        recipientRef: channel === NotificationChannel.EMAIL
          ? payload.recipientEmail
          : payload.recipientPhone,
        channel,
        templateCode: template.code,
        event: payload.event,
        subject,
        body,
        status: NotificationStatus.PENDING,
        attempts: 0,
      },
    });

    try {
      if (channel === NotificationChannel.EMAIL && payload.recipientEmail) {
        await this.sendEmail(payload.recipientEmail, subject ?? '', template.bodyHtml
          ? Handlebars.compile(template.bodyHtml)(payload.variables ?? {})
          : (body ?? ''));
      }

      await this.prisma.notificationLog.update({
        where: { id: log.id },
        data: { status: NotificationStatus.SENT, sentAt: new Date(), attempts: 1 },
      });
    } catch (err) {
      this.logger.error(`Notification failed: ${(err as Error).message}`);
      await this.prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationStatus.FAILED,
          attempts: 1,
          failureReason: (err as Error).message,
        },
      });
    }
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"${this.config.get<string>('mail.fromName')}" <${this.config.get<string>('mail.fromEmail')}>`,
      to,
      subject,
      html,
    });
  }
}
