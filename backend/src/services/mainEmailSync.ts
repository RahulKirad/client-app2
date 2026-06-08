import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MAIN_EMAIL } from '../constants/email';
import { ensureSmtpSettingsTable } from './smtpConfigStore';

const LEGACY_CONTACT_EMAILS = new Set([
  'abhishek.deolalikar@gmail.com',
  'cottonunique.co@gmail.com',
  'info@cottonunique.com',
]);

/** Align stored contact + SMTP records with the single main email address. */
export async function syncMainEmailConfiguration(pool: Pool): Promise<void> {
  await ensureSmtpSettingsTable(pool);

  const [rows] = (await pool.execute(
    "SELECT id, content FROM content_sections WHERE section_key = 'contact'"
  )) as [RowDataPacket[], unknown];
  if (!rows?.length) return;

  const row = rows[0];
  let content: Record<string, unknown>;
  try {
    content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
  } catch {
    return;
  }

  const primary = String(content.email_primary || '').trim().toLowerCase();
  const secondary = String(content.email_secondary || '').trim().toLowerCase();
  let changed = false;

  if (!primary || LEGACY_CONTACT_EMAILS.has(primary)) {
    content.email_primary = MAIN_EMAIL;
    changed = true;
  }
  if (secondary && LEGACY_CONTACT_EMAILS.has(secondary)) {
    content.email_secondary = '';
    changed = true;
  }

  if (changed) {
    await pool.execute('UPDATE content_sections SET content = ? WHERE id = ?', [
      JSON.stringify(content),
      row.id,
    ]);
    console.log(`Contact section email updated to ${MAIN_EMAIL}`);
  }
}
