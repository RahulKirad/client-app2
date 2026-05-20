"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmtpSettingsPool = getSmtpSettingsPool;
exports.encryptAppPassword = encryptAppPassword;
exports.decryptAppPassword = decryptAppPassword;
exports.ensureSmtpSettingsTable = ensureSmtpSettingsTable;
exports.getResolvedSmtpCredentials = getResolvedSmtpCredentials;
exports.getSmtpSettingsForAdmin = getSmtpSettingsForAdmin;
exports.saveSmtpSettings = saveSmtpSettings;
const promise_1 = __importDefault(require("mysql2/promise"));
const crypto_1 = __importDefault(require("crypto"));
const TABLE = 'smtp_settings';
function getDbConfig() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'root',
        database: process.env.DB_NAME || 'cottoniq_db',
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
    };
    if (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD.trim() !== '') {
        dbConfig.password = process.env.DB_PASSWORD;
    }
    return dbConfig;
}
let _pool = null;
function getSmtpSettingsPool() {
    if (!_pool) {
        _pool = promise_1.default.createPool(getDbConfig());
    }
    return _pool;
}
const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;
function getEncryptionKey() {
    const raw = process.env.JWT_SECRET || 'cotton-smtp-insecure-fallback';
    return crypto_1.default.createHash('sha256').update(raw, 'utf8').digest();
}
function encryptAppPassword(plain) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(ALGO, getEncryptionKey(), iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv, tag, enc].map((b) => b.toString('base64')).join('.');
}
function decryptAppPassword(data) {
    const parts = data.split('.');
    if (parts.length !== 3)
        throw new Error('Invalid stored password format');
    const [ivB, tagB, encB] = parts;
    const iv = Buffer.from(ivB, 'base64');
    const tag = Buffer.from(tagB, 'base64');
    const enc = Buffer.from(encB, 'base64');
    const dec = crypto_1.default.createDecipheriv(ALGO, getEncryptionKey(), iv);
    dec.setAuthTag(tag);
    return Buffer.concat([dec.update(enc), dec.final()]).toString('utf8');
}
async function ensureSmtpSettingsTable(mysqlPool = getSmtpSettingsPool()) {
    await mysqlPool.execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id INT PRIMARY KEY DEFAULT 1,
      email_user VARCHAR(255) NOT NULL DEFAULT '',
      app_password_ciphertext TEXT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
    const [rows] = await mysqlPool.execute(`SELECT COUNT(*) as c FROM ${TABLE}`);
    if (Array.isArray(rows) && rows[0].c === 0) {
        await mysqlPool.execute(`INSERT INTO ${TABLE} (id, email_user) VALUES (1, '')`);
    }
}
async function getResolvedSmtpCredentials() {
    await ensureSmtpSettingsTable();
    const pool = getSmtpSettingsPool();
    try {
        const [rows] = await pool.execute(`SELECT email_user, app_password_ciphertext FROM ${TABLE} WHERE id = 1`);
        const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        const emailUser = String(row?.email_user ?? '').trim();
        const cipher = row?.app_password_ciphertext != null ? String(row.app_password_ciphertext).trim() : '';
        if (emailUser && cipher) {
            try {
                const pass = decryptAppPassword(cipher);
                if (pass) {
                    return { user: emailUser, pass, source: 'database' };
                }
            }
            catch (e) {
                console.error('smtp_settings: failed to decrypt stored app password, trying .env', e);
            }
        }
    }
    catch (e) {
        console.error('smtp_settings: read error', e);
    }
    const envUser = process.env.EMAIL_USER?.trim();
    const envPass = process.env.EMAIL_APP_PASSWORD?.trim();
    if (envUser && envPass) {
        return { user: envUser, pass: envPass, source: 'env' };
    }
    return null;
}
async function getSmtpSettingsForAdmin() {
    await ensureSmtpSettingsTable();
    const pool = getSmtpSettingsPool();
    const [rows] = await pool.execute(`SELECT email_user, app_password_ciphertext, updated_at FROM ${TABLE} WHERE id = 1`);
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    const emailUser = String(row?.email_user ?? '').trim();
    const hasCipher = !!(row?.app_password_ciphertext && String(row.app_password_ciphertext).trim());
    const updatedAt = row?.updated_at != null ? String(row.updated_at) : null;
    const resolved = await getResolvedSmtpCredentials();
    let sendingWith = 'none';
    if (resolved?.source === 'database')
        sendingWith = 'database';
    else if (resolved?.source === 'env')
        sendingWith = 'env';
    return {
        emailUser,
        hasAppPassword: hasCipher,
        sendingWith,
        updatedAt,
    };
}
async function saveSmtpSettings(params) {
    const pool = getSmtpSettingsPool();
    await ensureSmtpSettingsTable();
    const emailUser = (params.emailUser || '').trim();
    const [rows] = await pool.execute(`SELECT app_password_ciphertext FROM ${TABLE} WHERE id = 1`);
    const existing = Array.isArray(rows) && rows.length > 0
        ? rows[0].app_password_ciphertext
        : null;
    let app_password_ciphertext = existing != null && String(existing).trim() ? String(existing) : null;
    if (params.clearAppPassword) {
        app_password_ciphertext = null;
    }
    else if (params.appPassword !== undefined && String(params.appPassword).trim() !== '') {
        app_password_ciphertext = encryptAppPassword(String(params.appPassword).trim());
    }
    await pool.execute(`INSERT INTO ${TABLE} (id, email_user, app_password_ciphertext) VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE
       email_user = VALUES(email_user),
       app_password_ciphertext = VALUES(app_password_ciphertext),
       updated_at = CURRENT_TIMESTAMP`, [emailUser, app_password_ciphertext]);
}
//# sourceMappingURL=smtpConfigStore.js.map