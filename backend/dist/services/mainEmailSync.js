"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncMainEmailConfiguration = syncMainEmailConfiguration;
const email_1 = require("../constants/email");
const smtpConfigStore_1 = require("./smtpConfigStore");
const LEGACY_CONTACT_EMAILS = new Set([
    'abhishek.deolalikar@gmail.com',
    'cottonunique.co@gmail.com',
    'info@cottonunique.com',
]);
async function syncMainEmailConfiguration(pool) {
    await (0, smtpConfigStore_1.ensureSmtpSettingsTable)(pool);
    const [rows] = (await pool.execute("SELECT id, content FROM content_sections WHERE section_key = 'contact'"));
    if (!rows?.length)
        return;
    const row = rows[0];
    let content;
    try {
        content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    }
    catch {
        return;
    }
    const primary = String(content.email_primary || '').trim().toLowerCase();
    const secondary = String(content.email_secondary || '').trim().toLowerCase();
    let changed = false;
    if (!primary || LEGACY_CONTACT_EMAILS.has(primary)) {
        content.email_primary = email_1.MAIN_EMAIL;
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
        console.log(`Contact section email updated to ${email_1.MAIN_EMAIL}`);
    }
}
//# sourceMappingURL=mainEmailSync.js.map