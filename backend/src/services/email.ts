import nodemailer from 'nodemailer';
import { MAIN_EMAIL } from '../constants/email';
import { getResolvedSmtpCredentials } from './smtpConfigStore';

/** Default recipient for inquiry and sample-request notifications. */
export const INQUIRY_RECIPIENT_EMAIL = MAIN_EMAIL;

/** Inquiry payload as received from the contact form. */
export interface InquiryPayload {
  name: string;
  company?: string;
  email: string;
  region?: string;
  order_type?: string;
  message: string;
}

const SMTP_DEFAULT_HOST = process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com';
const SMTP_DEFAULT_PORT = parseInt(process.env.EMAIL_SMTP_PORT || '587', 10);

/** Brand beige palette for HTML emails (matches site CSS variables). */
const EMAIL_BEIGE = {
  50: '#FEFCF9',
  100: '#FAF7F2',
  200: '#F5F0E8',
  300: '#EDE4D6',
  400: '#E8D4B8',
  500: '#E0D4C2',
  600: '#D4C4A8',
  700: '#C9B89A',
  800: '#B8A88C',
  900: '#A89B8F',
  text: '#5C5348',
  textMuted: '#8A7F72',
} as const;

const EMAIL_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

type Resolved = Awaited<ReturnType<typeof getResolvedSmtpCredentials>>;

/** Single credential fetch + transporter; throws if nothing configured. */
async function getTransporterAndFrom(): Promise<{ transporter: nodemailer.Transporter; from: string }> {
  const creds: Resolved = await getResolvedSmtpCredentials();
  if (!creds?.user || !creds?.pass) {
    throw new Error(
      'SMTP not configured: set Email + App password in Admin → Email / SMTP, or set EMAIL_USER and EMAIL_APP_PASSWORD in the server environment'
    );
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log(`SMTP: sending as ${creds.user} (source: ${creds.source})`);
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_DEFAULT_HOST,
    port: SMTP_DEFAULT_PORT,
    secure: SMTP_DEFAULT_PORT === 465,
    auth: { user: creds.user, pass: creds.pass },
  });
  return { transporter, from: creds.user };
}

/**
 * Sends an inquiry notification email to the configured recipient (default: cottoniq.co@gmail.com).
 * Does not throw; logs errors and returns false on failure.
 *
 * @param payload - Inquiry form data (name, company, email, region, order_type, message)
 * @returns true if email was sent successfully, false otherwise
 */
export async function sendInquiryEmail(payload: InquiryPayload): Promise<boolean> {
  const recipients = buildInquiryRecipients(process.env.INQUIRY_RECIPIENT_EMAIL);
  try {
    const { transporter, from: fromUser } = await getTransporterAndFrom();
    const from = fromUser || process.env.EMAIL_USER || MAIN_EMAIL;
    const subject = `[Cottonunique] New inquiry from ${payload.name}`;
    const text = [
      '═══════════════════════════════════════════════════════',
      '           NEW INQUIRY - COTTONUNIQUE WEBSITE',
      '═══════════════════════════════════════════════════════',
      '',
      'CUSTOMER INFORMATION',
      '───────────────────────────────────────────────────────',
      `Name:        ${payload.name}`,
      `Email:       ${payload.email}`,
      payload.company ? `Company:     ${payload.company}` : null,
      payload.region ? `Region:      ${payload.region}` : null,
      payload.order_type ? `Order Type:  ${payload.order_type}` : null,
      '',
      'INQUIRY MESSAGE',
      '───────────────────────────────────────────────────────',
      payload.message,
      '',
      '═══════════════════════════════════════════════════════',
      `Submitted: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })}`,
      '═══════════════════════════════════════════════════════',
      '',
      'Reply directly to this email to respond to the customer.',
    ]
      .filter(Boolean)
      .join('\n');
    const html = buildInquiryEmailHtml(payload);
    await transporter.sendMail({
      from: `Cottonunique Contact <${from}>`,
      to: recipients.join(', '),
      subject,
      text,
      html,
      replyTo: payload.email,
    });
    console.log(`Inquiry email sent to ${recipients.join(', ')} for ${payload.email}`);
    return true;
  } catch (err) {
    console.error('Failed to send inquiry email:', err);
    const e = err as { code?: string; responseCode?: number; response?: string };
    if (e?.code === 'EAUTH' || e?.responseCode === 535) {
      console.error(
        'Gmail SMTP: bad credentials. Set EMAIL_USER to the sending Gmail address and EMAIL_APP_PASSWORD to a 16-character App Password (google.com → Account → Security → 2-Step Verification → App passwords), not your normal Gmail password.'
      );
    }
    return false;
  }
}

export interface SampleRequestPayload {
  name: string;
  company?: string;
  email: string;
  region?: string;
  message: string;
  productId: string;
  productName: string;
}

/**
 * Notifies the same recipients as contact inquiries when someone requests a product sample.
 */
export async function sendSampleRequestEmail(payload: SampleRequestPayload): Promise<boolean> {
  const recipients = buildInquiryRecipients(process.env.INQUIRY_RECIPIENT_EMAIL);
  try {
    const { transporter, from: fromUser } = await getTransporterAndFrom();
    const from = fromUser || process.env.EMAIL_USER || MAIN_EMAIL;
    const subject = `[Cottonunique] Sample request: ${payload.productName} — ${payload.name}`;
    const text = [
      '═══════════════════════════════════════════════════════',
      '        PRODUCT SAMPLE REQUEST - COTTONUNIQUE',
      '═══════════════════════════════════════════════════════',
      '',
      'PRODUCT',
      '───────────────────────────────────────────────────────',
      `Product:     ${payload.productName}`,
      `Product ID:  ${payload.productId}`,
      '',
      'REQUESTER',
      '───────────────────────────────────────────────────────',
      `Name:        ${payload.name}`,
      `Email:       ${payload.email}`,
      payload.company ? `Company:     ${payload.company}` : null,
      payload.region ? `Region:      ${payload.region}` : null,
      '',
      'MESSAGE',
      '───────────────────────────────────────────────────────',
      payload.message,
      '',
      '═══════════════════════════════════════════════════════',
      `Submitted: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })}`,
      '═══════════════════════════════════════════════════════',
    ]
      .filter(Boolean)
      .join('\n');

    const html = buildSampleRequestEmailHtml(payload);

    await transporter.sendMail({
      from: `Cottonunique Samples <${from}>`,
      to: recipients.join(', '),
      subject,
      text,
      html,
      replyTo: payload.email,
    });
    console.log(`Sample request email sent to ${recipients.join(', ')} for ${payload.email}`);
    return true;
  } catch (err) {
    console.error('Failed to send sample request email:', err);
    const e = err as { code?: string; responseCode?: number };
    if (e?.code === 'EAUTH' || e?.responseCode === 535) {
      console.error(
        'Gmail SMTP: bad credentials. Use a Google App Password (16 characters, not your normal Gmail password) for EMAIL_APP_PASSWORD in backend/.env, or re-save it under Admin → Email / SMTP.'
      );
    }
    return false;
  }
}

/**
 * Sends a test message using the same credentials as inquiry mail (admin DB settings, else .env).
 */
export async function sendSmtpTestEmail(to: string): Promise<void> {
  const normalized = to.trim();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Valid test recipient email is required');
  }
  const { transporter, from: fromUser } = await getTransporterAndFrom();
  await transporter.sendMail({
    from: `Cottonunique <${fromUser}>`,
    to: normalized,
    subject: '[Cottonunique] SMTP test',
    text: `This is a test message from the Cottonunique admin panel.\nIf you received it, SMTP is configured correctly.\n\n${new Date().toISOString()}`,
  });
}

function buildSampleRequestEmailHtml(payload: SampleRequestPayload): string {
  const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' });
  const b = EMAIL_BEIGE;

  const infoFields: Array<{ label: string; value: string }> = [
    { label: 'Product', value: escapeHtml(payload.productName) },
    { label: 'Product ID', value: escapeHtml(payload.productId) },
    { label: 'Name', value: escapeHtml(payload.name) },
    {
      label: 'Email',
      value: `<a href="mailto:${escapeHtml(payload.email)}" style="color:${b[900]};text-decoration:none;border-bottom:1px solid ${b[600]};">${escapeHtml(payload.email)}</a>`,
    },
  ];
  if (payload.company) {
    infoFields.push({ label: 'Company', value: escapeHtml(payload.company) });
  }
  if (payload.region) {
    infoFields.push({ label: 'Region', value: escapeHtml(payload.region) });
  }

  const infoRows = infoFields
    .map((field, index) => {
      const isLast = index === infoFields.length - 1;
      const border = isLast ? '' : `border-bottom:1px solid ${b[400]};`;
      return `
    <tr>
      <td style="padding:14px 20px;${border}width:28%;vertical-align:top;background-color:${b[100]};">
        <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${b[800]};">${field.label}</span>
      </td>
      <td style="padding:14px 20px;${border}color:${b.text};font-size:15px;font-weight:500;">${field.value}</td>
    </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Sample request - Cottonunique</title></head>
<body style="margin:0;padding:0;font-family:${EMAIL_FONT};background-color:${b[200]};color:${b.text};line-height:1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background-color:${b[200]};">
    <tr>
      <td style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background-color:${b[300]};border-bottom:2px solid ${b[500]};">
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${b[800]};">Cottonunique</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;letter-spacing:-0.02em;color:${b.text};">Sample request</h1>
              <p style="margin:8px 0 0;font-size:14px;color:${b.textMuted};">${escapeHtml(payload.productName)}</p>
            </td>
            <td align="right" valign="middle" style="padding:28px 32px;white-space:nowrap;">
              <span style="display:inline-block;padding:8px 16px;background-color:${b[100]};border:1px solid ${b[500]};border-radius:6px;font-size:12px;font-weight:600;color:${b[800]};">${escapeHtml(timestamp)}</span>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background-color:${b[50]};">
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${b[800]};">Request details</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid ${b[400]};">${infoRows}</table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${b[800]};">Message</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid ${b[400]};background-color:${b[100]};">
                <tr><td style="padding:24px 28px;"><p style="margin:0;font-size:15px;line-height:1.75;white-space:pre-wrap;">${escapeHtml(payload.message)}</p></td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 36px;text-align:center;">
              <a href="mailto:${escapeHtml(payload.email)}" style="display:inline-block;padding:12px 28px;background-color:${b[600]};color:${b.text};text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;border-radius:6px;border:1px solid ${b[700]};">Reply to customer</a>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background-color:${b[300]};border-top:1px solid ${b[500]};">
          <tr><td style="padding:18px 32px;text-align:center;"><p style="margin:0;font-size:12px;color:${b.textMuted};">Submitted from the Cottonunique website.</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildInquiryEmailHtml(payload: InquiryPayload): string {
  const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' });
  const b = EMAIL_BEIGE;

  const infoFields: Array<{ label: string; value: string }> = [
    { label: 'Name', value: escapeHtml(payload.name) },
    {
      label: 'Email',
      value: `<a href="mailto:${escapeHtml(payload.email)}" style="color:${b[900]};text-decoration:none;border-bottom:1px solid ${b[600]};">${escapeHtml(payload.email)}</a>`,
    },
  ];
  if (payload.company) {
    infoFields.push({ label: 'Company', value: escapeHtml(payload.company) });
  }
  if (payload.region) {
    infoFields.push({ label: 'Region', value: escapeHtml(payload.region) });
  }
  if (payload.order_type) {
    infoFields.push({
      label: 'Order type',
      value: `<span style="display:inline-block;padding:5px 14px;background-color:${b[600]};color:${b.text};font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;border-radius:999px;">${escapeHtml(payload.order_type)}</span>`,
    });
  }

  const customerRows = infoFields
    .map((field, index) => {
      const isLast = index === infoFields.length - 1;
      const border = isLast ? '' : `border-bottom:1px solid ${b[400]};`;
      return `
    <tr>
      <td style="padding:14px 20px;${border}width:28%;vertical-align:top;background-color:${b[100]};">
        <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${b[800]};">${field.label}</span>
      </td>
      <td style="padding:14px 20px;${border}color:${b.text};font-size:15px;font-weight:500;">
        ${field.value}
      </td>
    </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Inquiry - Cottonunique</title>
</head>
<body style="margin:0;padding:0;font-family:${EMAIL_FONT};background-color:${b[200]};color:${b.text};line-height:1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background-color:${b[200]};">
    <tr>
      <td style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background-color:${b[300]};border-bottom:2px solid ${b[500]};">
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${b[800]};">Cottonunique</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;letter-spacing:-0.02em;color:${b.text};">New inquiry received</h1>
              <p style="margin:8px 0 0;font-size:14px;color:${b.textMuted};">Website contact form submission</p>
            </td>
            <td align="right" valign="middle" style="padding:28px 32px;white-space:nowrap;">
              <span style="display:inline-block;padding:8px 16px;background-color:${b[100]};border:1px solid ${b[500]};border-radius:6px;font-size:12px;font-weight:600;color:${b[800]};">${escapeHtml(timestamp)}</span>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background-color:${b[50]};">
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${b[800]};">Customer information</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid ${b[400]};background-color:${b[50]};">
                ${customerRows}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 32px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${b[800]};">Inquiry message</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid ${b[400]};background-color:${b[100]};">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0;font-size:15px;line-height:1.75;color:${b.text};white-space:pre-wrap;">${escapeHtml(payload.message)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 36px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background-color:${b[200]};border:1px solid ${b[400]};">
                <tr>
                  <td style="padding:24px 28px;text-align:center;">
                    <p style="margin:0 0 16px;font-size:14px;color:${b.textMuted};">Reply directly to this email to respond to the customer.</p>
                    <a href="mailto:${escapeHtml(payload.email)}" style="display:inline-block;padding:12px 28px;background-color:${b[600]};color:${b.text};text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;border-radius:6px;border:1px solid ${b[700]};">Reply to customer</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background-color:${b[300]};border-top:1px solid ${b[500]};">
          <tr>
            <td style="padding:18px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${b.textMuted};">
                This inquiry was submitted through the Cottonunique website contact form.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildInquiryRecipients(envValue?: string): string[] {
  const raw = (envValue || '').trim();
  const base = raw
    ? raw.split(',').map((s) => s.trim()).filter(Boolean)
    : [INQUIRY_RECIPIENT_EMAIL];
  // De-dupe while preserving order
  const seen = new Set<string>();
  return base.filter((email) => {
    const key = email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
