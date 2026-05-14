import { Router, Request, Response } from 'express';
import transporter from '../config/mailer';

interface ContactFormBody {
  name?: string;
  email?: string;
  phone?: string;
  helpWith?: string;
  message?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const router = Router();

router.post('/contact', async (req: Request<unknown, unknown, ContactFormBody>, res: Response) => {
  const name = req.body?.name?.trim();
  const email = req.body?.email?.trim();
  const phone = req.body?.phone?.trim();
  const helpWith = req.body?.helpWith?.trim();
  const message = req.body?.message?.trim();

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Name is required.';
  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_REGEX.test(email)) errors.email = 'Email is not valid.';
  if (!phone) errors.phone = 'Phone is required.';
  if (!helpWith) errors.helpWith = 'Please tell us what we can help with.';
  if (!message) errors.message = 'Message is required.';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const subject = `New inquiry from ${name} — ${helpWith}`;

  const text = [
    'You have a new contact form submission:',
    '',
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Phone:   ${phone}`,
    `Topic:   ${helpWith}`,
    '',
    'Message:',
    message,
  ].join('\n');

  const html = `
    <h2>New contact form submission</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
      <tr><td><strong>Name</strong></td><td>${escapeHtml(name!)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${escapeHtml(email!)}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${escapeHtml(phone!)}</td></tr>
      <tr><td><strong>Topic</strong></td><td>${escapeHtml(helpWith!)}</td></tr>
    </table>
    <h3>Message</h3>
    <p style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px;">${escapeHtml(message!)}</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.MAIL_TO || process.env.SMTP_USER,
      replyTo: `${name} <${email}>`,
      subject,
      text,
      html,
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
    });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errMessage });
  }
});

export default router;
