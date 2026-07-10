import nodemailer from 'nodemailer';
import { config } from '../../config.js';

const transporter = config.SMTP_HOST
  ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth:
        config.SMTP_USER && config.SMTP_PASS ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
    })
  : null;

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${config.APP_ORIGIN}/verify-email?token=${token}`;

  if (!transporter) {
    console.log(`[email] SMTP not configured -- verification link for ${to}:\n${link}`);
    return;
  }

  await transporter.sendMail({
    from: config.SMTP_FROM,
    to,
    subject: 'Confirm your Deutsch Lernen account',
    text: `Welcome! Confirm your email address to finish creating your account:\n\n${link}\n\nThis link expires in 24 hours.`,
    html: `<p>Welcome! Confirm your email address to finish creating your account:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
  });
}
