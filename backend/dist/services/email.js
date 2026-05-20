"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INQUIRY_RECIPIENT_EMAIL_SECONDARY = exports.INQUIRY_RECIPIENT_EMAIL = void 0;
exports.sendInquiryEmail = sendInquiryEmail;
exports.sendSampleRequestEmail = sendSampleRequestEmail;
exports.sendSmtpTestEmail = sendSmtpTestEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const smtpConfigStore_1 = require("./smtpConfigStore");
exports.INQUIRY_RECIPIENT_EMAIL = 'cottonunique.co@gmail.com';
exports.INQUIRY_RECIPIENT_EMAIL_SECONDARY = 'cottoniq.co@gmail.com';
const SMTP_DEFAULT_HOST = process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com';
const SMTP_DEFAULT_PORT = parseInt(process.env.EMAIL_SMTP_PORT || '587', 10);
async function getTransporterAndFrom() {
    const creds = await (0, smtpConfigStore_1.getResolvedSmtpCredentials)();
    if (!creds?.user || !creds?.pass) {
        throw new Error('SMTP not configured: set Email + App password in Admin → Email / SMTP, or set EMAIL_USER and EMAIL_APP_PASSWORD in the server environment');
    }
    const transporter = nodemailer_1.default.createTransport({
        host: SMTP_DEFAULT_HOST,
        port: SMTP_DEFAULT_PORT,
        secure: SMTP_DEFAULT_PORT === 465,
        auth: { user: creds.user, pass: creds.pass },
    });
    return { transporter, from: creds.user };
}
async function sendInquiryEmail(payload) {
    const recipients = buildInquiryRecipients(process.env.INQUIRY_RECIPIENT_EMAIL);
    try {
        const { transporter, from: fromUser } = await getTransporterAndFrom();
        const from = fromUser || process.env.EMAIL_USER || recipients[0] || exports.INQUIRY_RECIPIENT_EMAIL;
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
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Inquiry - Cottonunique</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #78350F 0%, #A0522D 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">
                🎯 New Inquiry Received
              </h1>
              <p style="margin: 10px 0 0 0; color: #FDF6E3; font-size: 14px; opacity: 0.9;">
                Cottonunique Website Contact Form
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Customer Information Section -->
              <div style="background-color: #FDF6E3; border-left: 4px solid #78350F; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                <h2 style="margin: 0 0 20px 0; color: #78350F; font-size: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  👤 Customer Information
                </h2>
                
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7;">
                      <span style="display: inline-block; min-width: 140px; color: #78350F; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Name:</span>
                      <span style="color: #3a2f1f; font-size: 15px; font-weight: 500;">${escapeHtml(payload.name)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7;">
                      <span style="display: inline-block; min-width: 140px; color: #78350F; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Email:</span>
                      <a href="mailto:${escapeHtml(payload.email)}" style="color: #78350F; font-size: 15px; font-weight: 500; text-decoration: none; border-bottom: 1px solid #78350F;">${escapeHtml(payload.email)}</a>
                    </td>
                  </tr>
                  ${payload.company ? `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7;">
                      <span style="display: inline-block; min-width: 140px; color: #78350F; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Company:</span>
                      <span style="color: #3a2f1f; font-size: 15px; font-weight: 500;">${escapeHtml(payload.company)}</span>
                    </td>
                  </tr>
                  ` : ''}
                  ${payload.region ? `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7;">
                      <span style="display: inline-block; min-width: 140px; color: #78350F; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Region:</span>
                      <span style="color: #3a2f1f; font-size: 15px; font-weight: 500;">${escapeHtml(payload.region)}</span>
                    </td>
                  </tr>
                  ` : ''}
                  ${payload.order_type ? `
                  <tr>
                    <td style="padding: 12px 0;">
                      <span style="display: inline-block; min-width: 140px; color: #78350F; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Order Type:</span>
                      <span style="display: inline-block; background-color: #78350F; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(payload.order_type)}</span>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- Message Section -->
              <div style="background-color: #ffffff; border: 2px solid #E8D5B7; padding: 25px; border-radius: 4px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 20px 0; color: #78350F; font-size: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  💬 Inquiry Message
                </h2>
                <div style="background-color: #FDF6E3; padding: 20px; border-radius: 4px; border-left: 3px solid #78350F;">
                  <p style="margin: 0; color: #3a2f1f; font-size: 15px; line-height: 1.8; white-space: pre-wrap; font-family: inherit;">${escapeHtml(payload.message)}</p>
                </div>
              </div>

              <!-- Action Section -->
              <div style="background-color: #FDF6E3; padding: 20px; border-radius: 4px; text-align: center; margin-top: 30px;">
                <p style="margin: 0 0 15px 0; color: #78350F; font-size: 14px; font-weight: 600;">
                  📧 Reply directly to this email to respond to the customer
                </p>
                <a href="mailto:${escapeHtml(payload.email)}" style="display: inline-block; background-color: #78350F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Reply to Customer
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FDF6E3; padding: 20px 40px; text-align: center; border-top: 1px solid #E8D5B7;">
              <p style="margin: 0; color: #78350F; font-size: 12px; opacity: 0.8;">
                This inquiry was submitted through the Cottonunique website contact form.<br>
                <strong>Timestamp:</strong> ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
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
    }
    catch (err) {
        console.error('Failed to send inquiry email:', err);
        const e = err;
        if (e?.code === 'EAUTH' || e?.responseCode === 535) {
            console.error('Gmail SMTP: bad credentials. Set EMAIL_USER to the sending Gmail address and EMAIL_APP_PASSWORD to a 16-character App Password (google.com → Account → Security → 2-Step Verification → App passwords), not your normal Gmail password.');
        }
        return false;
    }
}
async function sendSampleRequestEmail(payload) {
    const recipients = buildInquiryRecipients(process.env.INQUIRY_RECIPIENT_EMAIL);
    try {
        const { transporter, from: fromUser } = await getTransporterAndFrom();
        const from = fromUser || process.env.EMAIL_USER || recipients[0] || exports.INQUIRY_RECIPIENT_EMAIL;
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
        const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Sample request</title></head>
<body style="margin:0;padding:24px;font-family:system-ui,sans-serif;background:#f5f5f5;">
  <table role="presentation" style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#78350F,#A0522D);color:#fff;padding:24px 28px;">
        <h1 style="margin:0;font-size:22px;">Sample request</h1>
        <p style="margin:8px 0 0;font-size:14px;opacity:0.95">${escapeHtml(payload.productName)}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;color:#3a2f1f;">
        <p style="margin:0 0 12px;"><strong>Product ID:</strong> ${escapeHtml(payload.productId)}</p>
        <hr style="border:none;border-top:1px solid #E8D5B7;margin:16px 0;" />
        <p style="margin:0 0 6px;"><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
        <p style="margin:0 0 6px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></p>
        ${payload.company ? `<p style="margin:0 0 6px;"><strong>Company:</strong> ${escapeHtml(payload.company)}</p>` : ''}
        ${payload.region ? `<p style="margin:0 0 6px;"><strong>Region:</strong> ${escapeHtml(payload.region)}</p>` : ''}
        <h2 style="margin:20px 0 8px;font-size:16px;color:#78350F;">Message</h2>
        <div style="background:#FDF6E3;padding:16px;border-radius:6px;border-left:4px solid #78350F;white-space:pre-wrap;">${escapeHtml(payload.message)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px;background:#FDF6E3;font-size:12px;color:#78350F;text-align:center;">
        Submitted from the Cottonunique website · ${escapeHtml(new Date().toISOString())}
      </td>
    </tr>
  </table>
</body>
</html>`;
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
    }
    catch (err) {
        console.error('Failed to send sample request email:', err);
        return false;
    }
}
async function sendSmtpTestEmail(to) {
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
function buildInquiryRecipients(envValue) {
    const raw = (envValue || '').trim();
    const base = raw
        ? raw.split(',').map((s) => s.trim()).filter(Boolean)
        : [exports.INQUIRY_RECIPIENT_EMAIL, exports.INQUIRY_RECIPIENT_EMAIL_SECONDARY];
    const seen = new Set();
    return base.filter((email) => {
        const key = email.toLowerCase();
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
//# sourceMappingURL=email.js.map