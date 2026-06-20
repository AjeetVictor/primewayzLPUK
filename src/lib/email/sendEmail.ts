import nodemailer from 'nodemailer';

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

function getSmtpPort(): number {
  const parsed = Number(process.env.SMTP_PORT || 587);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 587;
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim()
    && process.env.EMAIL_FROM?.trim(),
  );
}

function getInternalReceiverEmail(): string | null {
  const receiver = process.env.CONTACT_RECEIVER_EMAIL?.trim();
  return receiver || null;
}

export function getInternalNotificationEmail(): string | null {
  return getInternalReceiverEmail();
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: getSmtpPort(),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  return transporter;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error('Email delivery is not configured on this server.');
  }

  const from = process.env.EMAIL_FROM!.trim();

  await getTransporter().sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
  });
}
