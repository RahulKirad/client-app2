/**
 * Verify Gmail SMTP credentials from backend/.env
 * Run from backend folder: node scripts/test-smtp.mjs
 */
import 'dotenv/config';
import nodemailer from 'nodemailer';

const user = (process.env.EMAIL_USER || '').trim();
const pass = (process.env.EMAIL_APP_PASSWORD || '').trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
const host = process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.EMAIL_SMTP_PORT || '587', 10);

if (!user || !pass) {
  console.error('Missing EMAIL_USER or EMAIL_APP_PASSWORD in backend/.env');
  process.exit(1);
}

console.log('Testing SMTP login for:', user);
console.log('App password length:', pass.length, '(expect 16 for Gmail)');

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log('OK: Gmail accepted these credentials.');
} catch (err) {
  console.error('FAILED:', err.message);
  if (err.code === 'EAUTH' || err.responseCode === 535) {
    console.error(`
Gmail rejected the login. Fix:
1. Open https://myaccount.google.com/apppasswords (2-Step Verification must be ON)
2. Create a new App password for "Mail"
3. Put the 16-character password in backend/.env as EMAIL_APP_PASSWORD (no spaces)
4. EMAIL_USER must be the same Gmail address
5. Restart: npm run dev
6. In Admin → Email / SMTP: save the same password again (or clear stored password)
`);
  }
  process.exit(1);
}
