"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDbProfile = resolveDbProfile;
exports.buildDbConfig = buildDbConfig;
exports.getResolvedDbConfig = getResolvedDbConfig;
exports.getResolvedDbProfile = getResolvedDbProfile;
exports.dbConfigLogLabel = dbConfigLogLabel;
function resolveDbProfile() {
    const raw = (process.env.DB_PROFILE || '').trim().toLowerCase();
    if (raw === 'hosted' || raw === 'production' || raw === 'prod')
        return 'hosted';
    if (raw === 'local' || raw === 'development' || raw === 'dev')
        return 'local';
    return process.env.NODE_ENV === 'production' ? 'hosted' : 'local';
}
function envKey(profile, base) {
    const suffix = profile === 'hosted' ? '_HOSTED' : '_LOCAL';
    const prefixed = process.env[`${base}${suffix}`];
    if (prefixed !== undefined && String(prefixed).trim() !== '') {
        return String(prefixed).trim();
    }
    const legacy = process.env[base];
    if (legacy !== undefined && String(legacy).trim() !== '') {
        return String(legacy).trim();
    }
    return undefined;
}
function buildDbConfig() {
    const profile = resolveDbProfile();
    const host = envKey(profile, 'DB_HOST') ?? (profile === 'hosted' ? '127.0.0.1' : 'localhost');
    const port = parseInt(envKey(profile, 'DB_PORT') || '3306', 10);
    const user = envKey(profile, 'DB_USER') ??
        (profile === 'hosted' ? '' : 'root');
    const database = envKey(profile, 'DB_NAME') ??
        (profile === 'hosted' ? '' : 'cottoniq_db');
    const config = {
        host,
        port,
        user,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    };
    const password = envKey(profile, 'DB_PASSWORD');
    if (password !== undefined && password !== '') {
        config.password = password;
    }
    return config;
}
function getResolvedDbConfig() {
    return buildDbConfig();
}
function getResolvedDbProfile() {
    return resolveDbProfile();
}
function dbConfigLogLabel(config, profile) {
    return {
        profile,
        host: config.host,
        port: config.port,
        user: config.user,
        database: config.database,
        hasPassword: !!config.password,
    };
}
//# sourceMappingURL=db.js.map