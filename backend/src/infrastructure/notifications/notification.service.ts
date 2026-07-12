import {
  notificationRepository,
  notificationRuleRepository,
} from '../database/repositories/notification.repository';
import { emailService } from './email.service';
import { prisma } from '../database/prisma.service';
import { logger } from '../logging/logger';

export interface NotifyInput {
  moduleId: string;
  event: string;
  title: string;
  message: string;
  actionUrl?: string;
  requestId?: string;
  controlNumber?: string;
  metadata?: Record<string, unknown>;
}

export const notificationService = {
  async notifyUser(
    recipientId: string,
    input: Omit<NotifyInput, 'moduleId' | 'event'>,
    email?: string,
    tx?: import('@prisma/client').Prisma.TransactionClient,
  ) {
    const created = await notificationRepository.create({
      type: input.title,
      title: input.title,
      message: input.message,
      recipientId,
      requestId: input.requestId,
      controlNumber: input.controlNumber,
      moduleId: input.metadata?.moduleId as string | undefined,
      actionUrl: input.actionUrl,
      channel: 'in_app',
    }, tx);
    if (email) {
      await emailService.send(email, input.title, `<p>${input.message}</p>`);
    }
    return created;
  },

  async dispatch(input: NotifyInput) {
    const rules = await notificationRuleRepository.findByEvent(input.moduleId, input.event);
    for (const rule of rules) {
      const recipients = new Set<string>();
      for (const roleId of rule.notifyRoleIds) {
        const users = await prisma.userRole.findMany({
          where: { roleId },
          select: { userId: true },
        });
        users.forEach((u: { userId: string }) => recipients.add(u.userId));
      }
      rule.notifyUserIds.forEach((uid: string) => recipients.add(uid));
      for (const recipientId of recipients) {
        const user = await prisma.user.findUnique({
          where: { id: recipientId },
          select: { email: true },
        });
        await this.notifyUser(
          recipientId,
          {
            title: render(rule.templateSubject, input),
            message: render(rule.templateBody, input),
            actionUrl: input.actionUrl,
            requestId: input.requestId,
            controlNumber: input.controlNumber,
            metadata: input.metadata,
          },
          rule.channels.includes('email') ? user?.email : undefined,
        );
      }
    }
    logger.debug({ event: input.event, moduleId: input.moduleId }, 'Notification dispatched');
  },

  listForUser(recipientId: string, unreadOnly = false) {
    return notificationRepository.listForUser(recipientId, unreadOnly);
  },

  unreadCount(recipientId: string) {
    return notificationRepository.unreadCount(recipientId);
  },

  markRead(id: string, recipientId: string) {
    return notificationRepository.markRead(id, recipientId);
  },
};

function render(template: string, input: NotifyInput): string {
  return template
    .replace(/\{title\}/g, input.title)
    .replace(/\{message\}/g, input.message)
    .replace(/\{controlNumber\}/g, input.controlNumber ?? '')
    .replace(/\{actionUrl\}/g, input.actionUrl ?? '');
}
