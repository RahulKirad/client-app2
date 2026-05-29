"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSiteSettingsTable = ensureSiteSettingsTable;
exports.getSiteSettingsPublic = getSiteSettingsPublic;
exports.getSiteSettingsAdmin = getSiteSettingsAdmin;
exports.saveSiteSettings = saveSiteSettings;
const promise_1 = __importDefault(require("mysql2/promise"));
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
function getPool() {
    if (!_pool) {
        _pool = promise_1.default.createPool(getDbConfig());
    }
    return _pool;
}
function rowEnabled(value) {
    return value === 1 || value === true || (typeof value === 'string' && value.trim() === '1');
}
async function ensureSiteSettingsTable() {
    const pool = getPool();
    await pool.execute(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INT PRIMARY KEY DEFAULT 1,
      language_toggle_enabled TINYINT(1) NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT site_settings_single_row CHECK (id = 1)
    )
  `);
    const [rows] = await pool.execute('SELECT COUNT(*) AS c FROM site_settings');
    if (rows[0]?.c === 0) {
        await pool.execute('INSERT INTO site_settings (id, language_toggle_enabled) VALUES (1, 0)');
    }
}
async function getSiteSettingsPublic() {
    await ensureSiteSettingsTable();
    const pool = getPool();
    const [rows] = await pool.execute('SELECT language_toggle_enabled AS languageToggleEnabled FROM site_settings WHERE id = 1');
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    return {
        languageToggleEnabled: row ? rowEnabled(row.languageToggleEnabled) : false,
    };
}
async function getSiteSettingsAdmin() {
    await ensureSiteSettingsTable();
    const pool = getPool();
    const [rows] = await pool.execute(`SELECT language_toggle_enabled AS languageToggleEnabled, updated_at AS updatedAt
     FROM site_settings WHERE id = 1`);
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    return {
        languageToggleEnabled: row ? rowEnabled(row.languageToggleEnabled) : false,
        updatedAt: row?.updatedAt != null ? String(row.updatedAt) : null,
    };
}
async function saveSiteSettings(params) {
    await ensureSiteSettingsTable();
    const pool = getPool();
    const enabled = params.languageToggleEnabled ? 1 : 0;
    await pool.execute(`INSERT INTO site_settings (id, language_toggle_enabled, updated_at)
     VALUES (1, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       language_toggle_enabled = VALUES(language_toggle_enabled),
       updated_at = CURRENT_TIMESTAMP`, [enabled]);
    return { languageToggleEnabled: enabled === 1 };
}
//# sourceMappingURL=siteSettingsStore.js.map