"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const crypto_1 = require("crypto");
const cors_1 = __importDefault(require("cors"));
const promise_1 = __importDefault(require("mysql2/promise"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const admin_1 = __importDefault(require("./routes/admin"));
const chatbot_1 = __importDefault(require("./routes/chatbot"));
const email_1 = require("./services/email");
const contentNormalize_1 = require("./utils/contentNormalize");
const slug_1 = require("./utils/slug");
const siteSettingsStore_1 = require("./services/siteSettingsStore");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const CANONICAL_IN_PHONE_DISPLAY = '+91 7020631149';
function parseJsonMaybe(value) {
    let parsed = value;
    while (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed);
        }
        catch {
            break;
        }
    }
    return parsed;
}
function applyCanonicalContactPhones(content) {
    let raw = content;
    if (Buffer.isBuffer(raw)) {
        raw = raw.toString('utf8');
    }
    const originalString = typeof raw === 'string' ? raw : null;
    const parsed = parseJsonMaybe(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        return content;
    const obj = parsed;
    const next = { ...obj };
    next.phone = CANONICAL_IN_PHONE_DISPLAY;
    next.whatsapp_number = CANONICAL_IN_PHONE_DISPLAY;
    if (originalString != null)
        return JSON.stringify(next);
    return next;
}
app.set('trust proxy', 1);
const defaultAllowedOrigins = [
    'https://cottonunique.com',
    'https://www.cottonunique.com',
    'https://cottonunique.de',
    'https://www.cottonunique.de',
    'https://app.cottonunique.com',
    'http://localhost:5173',
];
function parseAllowedOrigins() {
    const configured = (process.env.FRONTEND_URL || '')
        .split(',')
        .map((value) => value.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    return [...new Set([...defaultAllowedOrigins, ...configured])];
}
const allowedOriginSet = new Set(parseAllowedOrigins());
function isAllowedCorsOrigin(origin) {
    if (allowedOriginSet.has(origin))
        return true;
    try {
        const url = new URL(origin);
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        if (host === 'localhost') {
            return url.protocol === 'http:' && url.port === '5173';
        }
        return (host === 'cottonunique.com' ||
            host === 'cottonunique.de' ||
            host.endsWith('.cottonunique.com') ||
            host.endsWith('.cottonunique.de'));
    }
    catch {
        return false;
    }
}
app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (isAllowedCorsOrigin(origin)) {
            callback(null, origin);
            return;
        }
        console.warn(`CORS blocked for origin: ${origin}`);
        callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
function apiRequestPath(req) {
    const raw = (req.originalUrl || req.url || req.path || '').split('?')[0];
    const idx = raw.indexOf('/api');
    const afterApi = idx >= 0 ? raw.slice(idx + 4) : raw;
    return afterApi.startsWith('/') ? afterApi : `/${afterApi}`;
}
function isPublicCatalogGet(req) {
    if (req.method !== 'GET')
        return false;
    const p = apiRequestPath(req);
    return (p.startsWith('/content/') ||
        p === '/site/settings' ||
        p === '/chatbot/settings' ||
        p === '/products' ||
        p.startsWith('/products/') ||
        p === '/health' ||
        p === '/health/db');
}
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '500', 10);
const limiter = (0, express_rate_limit_1.default)({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (req.method === 'OPTIONS')
            return true;
        if (isPublicCatalogGet(req))
            return true;
        return false;
    },
});
app.use('/api', limiter);
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'cottoniq_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
if (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD.trim() !== '') {
    dbConfig.password = process.env.DB_PASSWORD;
}
console.log('🔧 Database config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    hasPassword: !!dbConfig.password
});
const pool = promise_1.default.createPool(dbConfig);
async function repairEmptyProductIds() {
    let repaired = 0;
    try {
        for (;;) {
            const [check] = await pool.execute(`SELECT 1 AS ok FROM products WHERE TRIM(COALESCE(id, '')) = '' LIMIT 1`);
            if (!Array.isArray(check) || check.length === 0)
                break;
            const newId = (0, crypto_1.randomUUID)();
            const [upd] = await pool.execute(`UPDATE products SET id = ? WHERE TRIM(COALESCE(id, '')) = '' LIMIT 1`, [newId]);
            if (upd.affectedRows === 0)
                break;
            repaired += 1;
            if (repaired > 100) {
                console.warn('repairEmptyProductIds: stopped after 100 updates (unexpected loop)');
                break;
            }
        }
        if (repaired > 0) {
            console.log(`🔧 Repaired ${repaired} product row(s) that had an empty id`);
        }
    }
    catch (e) {
        console.error('repairEmptyProductIds failed (non-fatal):', e);
    }
}
async function ensureProductSlugColumn() {
    try {
        await pool.execute(`ALTER TABLE products ADD COLUMN slug VARCHAR(255) NULL AFTER name`);
    }
    catch (e) {
        const err = e;
        if (err?.code !== 'ER_DUP_FIELDNAME') {
            console.warn('ensureProductSlugColumn (add column):', e);
        }
    }
    try {
        await pool.execute(`ALTER TABLE products ADD UNIQUE INDEX idx_products_slug (slug)`);
    }
    catch (e) {
        const err = e;
        if (err?.code !== 'ER_DUP_KEYNAME') {
            console.warn('ensureProductSlugColumn (unique index):', e);
        }
    }
}
async function ensureProductSlugs() {
    try {
        await ensureProductSlugColumn();
        const [rows] = await pool.execute(`SELECT id, name FROM products WHERE slug IS NULL OR TRIM(slug) = ''`);
        if (!Array.isArray(rows) || rows.length === 0)
            return;
        let updated = 0;
        for (const row of rows) {
            const id = String(row.id ?? '').trim();
            const name = String(row.name ?? '').trim();
            if (!id || !name)
                continue;
            const slug = await (0, slug_1.generateUniqueProductSlug)(pool, name, id);
            await pool.execute(`UPDATE products SET slug = ? WHERE id = ?`, [slug, id]);
            updated += 1;
        }
        if (updated > 0) {
            console.log(`🔧 Backfilled slug for ${updated} product row(s)`);
        }
    }
    catch (e) {
        console.error('ensureProductSlugs failed (non-fatal):', e);
    }
}
async function ensureSampleRequestsTable() {
    try {
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS sample_requests (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        product_id VARCHAR(36) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255) DEFAULT NULL,
        email VARCHAR(255) NOT NULL,
        region VARCHAR(100) DEFAULT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'new',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sample_status (status),
        INDEX idx_sample_created (created_at),
        INDEX idx_sample_product (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    }
    catch (e) {
        console.error('ensureSampleRequestsTable failed (non-fatal):', e);
    }
}
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL database');
        connection.release();
        await repairEmptyProductIds();
        await ensureProductSlugs();
        await (0, slug_1.migrateProductSlugsToSeoPattern)(pool);
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
    }
}
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC');
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
app.get('/api/products/featured', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM products WHERE is_active = TRUE AND is_featured = TRUE ORDER BY created_at DESC');
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({ error: 'Failed to fetch featured products' });
    }
});
app.get('/api/products/related/:id', async (req, res) => {
    try {
        const param = String(req.params.id || '').trim();
        if (!param) {
            return res.json([]);
        }
        const [currentRows] = await pool.execute(`SELECT id, category FROM products
       WHERE is_active = TRUE AND (slug = ? OR id = ?)
       LIMIT 1`, [param, param]);
        if (!Array.isArray(currentRows) || currentRows.length === 0) {
            return res.json([]);
        }
        const current = currentRows[0];
        const productId = String(current.id);
        const category = String(current.category ?? '');
        const [rows] = await pool.execute(`SELECT * FROM products
       WHERE is_active = TRUE AND id != ? AND category = ?
       ORDER BY is_featured DESC, created_at DESC
       LIMIT 4`, [productId, category]);
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching related products:', error);
        res.status(500).json({ error: 'Failed to fetch related products' });
    }
});
app.get('/api/products/:slug', async (req, res) => {
    try {
        const slug = String(req.params.slug || '').trim();
        if (!slug) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const [rows] = await pool.execute(`SELECT * FROM products
       WHERE is_active = TRUE AND (slug = ? OR id = ?)
       LIMIT 1`, [slug, slug]);
        if (Array.isArray(rows) && rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(rows[0]);
    }
    catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});
app.post('/api/inquiries', async (req, res) => {
    try {
        const { name, company, email, region, order_type, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }
        const [result] = await pool.execute('INSERT INTO inquiries (name, company, email, region, order_type, message) VALUES (?, ?, ?, ?, ?, ?)', [name, company, email, region, order_type, message]);
        const payload = { name, company, email, region, order_type, message };
        (0, email_1.sendInquiryEmail)(payload).catch(() => {
        });
        res.status(201).json({
            message: 'Inquiry submitted successfully',
            id: result.insertId
        });
    }
    catch (error) {
        console.error('Error submitting inquiry:', error);
        res.status(500).json({ error: 'Failed to submit inquiry' });
    }
});
app.post('/api/sample-requests', async (req, res) => {
    try {
        const { product_id, product_name, name, company, email, region, message } = req.body;
        const pid = String(product_id || '').trim();
        const pname = String(product_name || '').trim();
        const nm = String(name || '').trim();
        const em = String(email || '').trim();
        const msg = String(message || '').trim();
        if (!pid || !pname) {
            return res.status(400).json({ error: 'Product is required' });
        }
        if (!nm || !em || !msg) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }
        if (msg.length < 10) {
            return res.status(400).json({ error: 'Message must be at least 10 characters' });
        }
        const id = (0, crypto_1.randomUUID)();
        await pool.execute(`INSERT INTO sample_requests (id, product_id, product_name, name, company, email, region, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [id, pid, pname, nm, company || null, em, region || null, msg]);
        (0, email_1.sendSampleRequestEmail)({
            name: nm,
            company: company ? String(company) : undefined,
            email: em,
            region: region ? String(region) : undefined,
            message: msg,
            productId: pid,
            productName: pname,
        }).catch(() => { });
        res.status(201).json({ message: 'Sample request submitted successfully', id });
    }
    catch (error) {
        console.error('Error submitting sample request:', error);
        res.status(500).json({ error: 'Failed to submit sample request' });
    }
});
app.get('/api/content/:sectionKey', async (req, res) => {
    try {
        const sectionKey = String(req.params.sectionKey ?? '');
        const [rows] = await pool.execute('SELECT * FROM content_sections WHERE section_key = ? AND is_active = TRUE', [sectionKey]);
        if (Array.isArray(rows) && rows.length === 0) {
            return res.status(404).json({ error: 'Content section not found' });
        }
        const row = rows[0];
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        const parsed = (0, contentNormalize_1.parseContentColumn)(row.content);
        let content = parsed ?? row.content;
        if (sectionKey === 'contact') {
            content = applyCanonicalContactPhones(content);
        }
        else if (parsed && sectionKey) {
            content = (0, contentNormalize_1.normalizeSectionContent)(sectionKey, parsed);
        }
        res.json({ ...row, content });
    }
    catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});
app.use('/api/admin', admin_1.default);
app.get('/api/chatbot/settings', async (req, res) => {
    try {
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS chatbot_settings (
        id INT PRIMARY KEY DEFAULT 1,
        is_enabled TINYINT(1) NOT NULL DEFAULT 1,
        custom_instructions TEXT,
        disallowed_topics TEXT,
        welcome_message TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        const [rows] = await pool.execute('SELECT is_enabled AS enabled, welcome_message AS welcomeMessage FROM chatbot_settings WHERE id = 1');
        if (Array.isArray(rows) && rows.length === 0) {
            await pool.execute('INSERT INTO chatbot_settings (id, is_enabled) VALUES (1, 1)');
            return res.json({ enabled: true, welcomeMessage: null });
        }
        const row = rows[0];
        const raw = row?.enabled;
        const enabled = raw === 1 || raw === true || (typeof raw === 'string' && raw.trim() === '1');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.json({
            enabled: !!enabled,
            welcomeMessage: row?.welcomeMessage ?? null,
        });
    }
    catch (error) {
        console.error('Error fetching chatbot settings:', error);
        res.setHeader('Cache-Control', 'no-store');
        res.json({ enabled: true, welcomeMessage: null });
    }
});
app.get('/api/site/settings', async (_req, res) => {
    try {
        const settings = await (0, siteSettingsStore_1.getSiteSettingsPublic)();
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.json(settings);
    }
    catch (error) {
        console.error('Error fetching site settings:', error);
        res.setHeader('Cache-Control', 'no-store');
        res.json({ languageToggleEnabled: false });
    }
});
app.get('/api/chatbot/visibility-diagnostics', async (req, res) => {
    try {
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS chatbot_settings (
        id INT PRIMARY KEY DEFAULT 1,
        is_enabled TINYINT(1) NOT NULL DEFAULT 1,
        custom_instructions TEXT,
        disallowed_topics TEXT,
        welcome_message TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        const [rows] = await pool.execute('SELECT is_enabled AS enabled, welcome_message AS welcomeMessage FROM chatbot_settings WHERE id = 1');
        const rowExists = Array.isArray(rows) && rows.length > 0;
        const row = rowExists ? rows[0] : null;
        const raw = row?.enabled;
        const rawType = raw === undefined ? 'undefined' : typeof raw;
        const rawString = raw != null ? String(raw) : 'null';
        const publicEnabled = raw === 1 || raw === true || (typeof raw === 'string' && raw.trim() === '1');
        const steps = [];
        steps.push({
            step: '1. Database row exists',
            pass: rowExists,
            detail: rowExists ? `Row id=1 exists. is_enabled (as "enabled") = ${JSON.stringify(raw)} (${rawType})` : 'No row with id=1. Public API would insert (1,1) and return enabled: true.',
        });
        steps.push({
            step: '2. Database value means "disabled"',
            pass: rowExists && !publicEnabled,
            detail: rowExists
                ? `Value ${JSON.stringify(raw)} is treated as ${publicEnabled ? 'ENABLED (1/true/"1")' : 'DISABLED (0 or anything else)'}. Public API will return enabled: ${publicEnabled}.`
                : 'N/A (no row).',
        });
        steps.push({
            step: '3. Public API would return enabled: false',
            pass: !publicEnabled,
            detail: !publicEnabled
                ? 'GET /api/chatbot/settings returns { enabled: false }. Frontend should hide the chatbot.'
                : 'GET /api/chatbot/settings returns { enabled: true }. Frontend will show the chatbot.',
        });
        const possibleCauses = [];
        if (!rowExists)
            possibleCauses.push('Chatbot settings row (id=1) is missing. Save from Admin once to create it.');
        else if (publicEnabled) {
            possibleCauses.push('Toggle is On or was not saved. Set toggle to Off and click Save.');
            possibleCauses.push('Admin and public API use the same DB; if this diagnostic shows enabled: false but the site still shows the button, the site may be using a different API URL (check .env VITE_API_URL) or a cached response.');
        }
        if (rowExists && !publicEnabled) {
            possibleCauses.push('Backend is correct. If the chatbot still shows: refresh the main site tab or click on it (refetch on focus), or check the browser Network tab for GET .../chatbot/settings response.');
        }
        res.json({
            timestamp: new Date().toISOString(),
            database: {
                rowExists,
                rawValue: raw,
                rawType,
                rawString,
                json: JSON.stringify(row),
            },
            publicApiLogic: {
                enabled: Boolean(publicEnabled),
                description: 'Exactly what GET /api/chatbot/settings returns for "enabled" (same logic as the route)',
            },
            steps,
            possibleCauses,
            verdict: {
                chatbotWillShowOnSite: Boolean(publicEnabled),
                suggestion: publicEnabled
                    ? 'Chatbot will SHOW. Set toggle to Off, click Save, then run diagnostics again. Then refresh or focus the main site tab.'
                    : 'Chatbot should be HIDDEN. Refresh the main site tab (or switch to it) so it refetches settings.',
            },
            frontendNote: 'Main site uses VITE_API_URL or http://localhost:3001/api. It calls GET /chatbot/settings and hides the button when enabled === false.',
        });
    }
    catch (error) {
        console.error('Chatbot visibility diagnostics error:', error);
        res.status(500).json({
            timestamp: new Date().toISOString(),
            error: error.message,
            suggestion: 'Check backend logs and database connection.',
        });
    }
});
app.use('/api/chatbot', (0, chatbot_1.default)(pool));
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.get('/api/health/db', async (req, res) => {
    const configured = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        database: process.env.DB_NAME || 'cottoniq_db',
        user: process.env.DB_USER || 'root',
    };
    try {
        const [rows] = await pool.execute('SELECT DATABASE() AS currentDb, @@hostname AS mysqlHostname, @@version_comment AS mysqlVersion');
        const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : {};
        res.json({
            ok: true,
            configured,
            live: {
                currentDatabase: row.currentDb,
                mysqlServerHostname: row.mysqlHostname,
                mysqlVersion: row.mysqlVersion,
            },
            hint: configured.database === 'u810591308_cottoniq_db' || String(row.currentDb || '').includes('u810591308')
                ? 'Using hosted-style database name (matches production DB name).'
                : 'Using local-style database name. Hosted production DB is typically named u810591308_cottoniq_db.',
        });
    }
    catch (error) {
        const err = error;
        res.status(503).json({
            ok: false,
            configured,
            error: err.message || 'Database unreachable',
            code: err.code,
        });
    }
});
async function bootstrap() {
    await ensureSampleRequestsTable();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || '(defaults only)'}`);
        console.log(`🔒 CORS allowlist (${allowedOriginSet.size} entries) + *.cottonunique.com / *.cottonunique.de`);
        testConnection();
    });
}
bootstrap().catch((err) => {
    console.error('Server bootstrap failed:', err);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map