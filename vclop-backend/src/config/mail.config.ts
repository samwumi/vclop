import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST ?? 'smtp.mailtrap.io',
  port: parseInt(process.env.MAIL_PORT ?? '587', 10),
  secure: process.env.MAIL_SECURE === 'true',
  user: process.env.MAIL_USER ?? '',
  password: process.env.MAIL_PASSWORD ?? '',
  fromName: process.env.MAIL_FROM_NAME ?? 'VCLOP',
  fromEmail: process.env.MAIL_FROM_EMAIL ?? 'noreply@vclop.local',
}));
