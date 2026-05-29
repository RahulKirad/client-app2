import mysql from 'mysql2/promise';

function getDbConfig(): mysql.PoolOptions {
  const dbConfig: mysql.PoolOptions = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'cottoniq_db',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  };
  if (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD.trim() !== '') {
    (dbConfig as { password?: string }).password = process.env.DB_PASSWORD;
  }
  return dbConfig;
}

let _pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!_pool) {
    _pool = mysql.createPool(getDbConfig());
  }
  return _pool;
}

export type SiteSettingsPublic = {
  languageToggleEnabled: boolean;
};

export type SiteSettingsAdmin = SiteSettingsPublic & {
  updatedAt: string | null;
};

function rowEnabled(value: unknown): boolean {
  return value === 1 || value === true || (typeof value === 'string' && value.trim() === '1');
}

export async function ensureSiteSettingsTable(): Promise<void> {
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
  if ((rows as { c: number }[])[0]?.c === 0) {
    await pool.execute(
      'INSERT INTO site_settings (id, language_toggle_enabled) VALUES (1, 0)'
    );
  }
}

export async function getSiteSettingsPublic(): Promise<SiteSettingsPublic> {
  await ensureSiteSettingsTable();
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT language_toggle_enabled AS languageToggleEnabled FROM site_settings WHERE id = 1'
  );
  const row = Array.isArray(rows) && rows.length > 0 ? (rows as Record<string, unknown>[])[0] : null;
  return {
    languageToggleEnabled: row ? rowEnabled(row.languageToggleEnabled) : false,
  };
}

export async function getSiteSettingsAdmin(): Promise<SiteSettingsAdmin> {
  await ensureSiteSettingsTable();
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT language_toggle_enabled AS languageToggleEnabled, updated_at AS updatedAt
     FROM site_settings WHERE id = 1`
  );
  const row = Array.isArray(rows) && rows.length > 0 ? (rows as Record<string, unknown>[])[0] : null;
  return {
    languageToggleEnabled: row ? rowEnabled(row.languageToggleEnabled) : false,
    updatedAt: row?.updatedAt != null ? String(row.updatedAt) : null,
  };
}

export async function saveSiteSettings(params: {
  languageToggleEnabled: boolean;
}): Promise<SiteSettingsPublic> {
  await ensureSiteSettingsTable();
  const pool = getPool();
  const enabled = params.languageToggleEnabled ? 1 : 0;
  await pool.execute(
    `INSERT INTO site_settings (id, language_toggle_enabled, updated_at)
     VALUES (1, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       language_toggle_enabled = VALUES(language_toggle_enabled),
       updated_at = CURRENT_TIMESTAMP`,
    [enabled]
  );
  return { languageToggleEnabled: enabled === 1 };
}
