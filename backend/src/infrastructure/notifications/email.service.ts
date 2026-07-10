import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../logging/logger';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
});

export const emailService = {
  async send(to: string, subject: string, body: string): Promise<void> {
    if (!env.smtp.host) {
      logger.warn({ to, subject }, 'SMTP not configured; skipping email send');
      return;
    }
    try {
      await transporter.sendMail({
        from: env.smtp.from,
        to,
        subject,
        html: body,
      });
      logger.info({ to, subject }, 'Email sent');
    } catch (err) {
      logger.error({ err }, 'Failed to send email');
    }
  },
};
