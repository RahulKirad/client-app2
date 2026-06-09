"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translatePlainTextEnToDe = translatePlainTextEnToDe;
exports.translateHtmlEnToDe = translateHtmlEnToDe;
exports.translateSpecificationsEnToDe = translateSpecificationsEnToDe;
exports.translateProductFieldsToGerman = translateProductFieldsToGerman;
exports.ensureProductI18nColumns = ensureProductI18nColumns;
exports.syncProductGermanTranslation = syncProductGermanTranslation;
exports.refreshAllProductGermanTranslations = refreshAllProductGermanTranslations;
exports.backfillMissingProductGermanTranslations = backfillMissingProductGermanTranslations;
const productCatalogDe_1 = require("../i18n/productCatalogDe");
const productDeDictionary_1 = require("../i18n/productDeDictionary");
const SORTED_PHRASES = [...productDeDictionary_1.PRODUCT_PHRASES_DE].sort((a, b) => b[0].length - a[0].length);
const SORTED_SPEC_VALUES = Object.entries(productDeDictionary_1.SPEC_VALUE_DE).sort((a, b) => b[0].length - a[0].length);
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function normalizeCatalogKey(name) {
    return String(name ?? '').trim();
}
function lookupCatalogEntry(name) {
    const key = normalizeCatalogKey(name);
    if (productCatalogDe_1.PRODUCT_CATALOG_DE[key])
        return productCatalogDe_1.PRODUCT_CATALOG_DE[key];
    const asciiApostrophe = key.replace(/\u2019/g, "'");
    if (productCatalogDe_1.PRODUCT_CATALOG_DE[asciiApostrophe])
        return productCatalogDe_1.PRODUCT_CATALOG_DE[asciiApostrophe];
    const curlyApostrophe = key.replace(/'/g, '\u2019');
    if (productCatalogDe_1.PRODUCT_CATALOG_DE[curlyApostrophe])
        return productCatalogDe_1.PRODUCT_CATALOG_DE[curlyApostrophe];
    return null;
}
function parseSpecifications(value) {
    if (value == null || value === '')
        return {};
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value;
    }
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                ? parsed
                : {};
        }
        catch {
            return {};
        }
    }
    return {};
}
function applyPhraseDictionary(text) {
    let result = text;
    for (const [en, de] of SORTED_PHRASES) {
        if (!en.trim())
            continue;
        const pattern = new RegExp(escapeRegExp(en), 'gi');
        result = result.replace(pattern, de);
    }
    return result;
}
function applyWordGlossary(text) {
    return text.replace(/\b[A-Za-z][A-Za-z'-]*\b/g, (word) => {
        const lower = word.toLowerCase();
        const mapped = productDeDictionary_1.PRODUCT_WORDS_DE[lower];
        if (!mapped)
            return word;
        if (word === word.toUpperCase())
            return mapped.toUpperCase();
        if (word[0] === word[0].toUpperCase()) {
            return mapped.charAt(0).toUpperCase() + mapped.slice(1);
        }
        return mapped;
    });
}
function applySpecValueDictionary(text) {
    let result = text;
    for (const [en, de] of SORTED_SPEC_VALUES) {
        const pattern = new RegExp(escapeRegExp(en), 'gi');
        result = result.replace(pattern, de);
    }
    return result;
}
function polishGermanText(text) {
    return text
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/\s+%/g, ' %')
        .replace(/Bio-\s+Baumwolle/g, 'Bio-Baumwolle')
        .replace(/Unternehmens-\s+/g, 'Unternehmens-')
        .trim();
}
function translatePlainTextEnToDe(text) {
    const input = String(text ?? '');
    if (!input.trim())
        return input;
    let result = applySpecValueDictionary(input);
    result = applyPhraseDictionary(result);
    result = applyWordGlossary(result);
    return polishGermanText(result);
}
function translateHtmlEnToDe(html) {
    const input = String(html ?? '');
    if (!input.trim())
        return input;
    return input
        .split(/(<[^>]+>)/g)
        .map((segment) => {
        if (segment.startsWith('<'))
            return segment;
        return translatePlainTextEnToDe(segment);
    })
        .join('');
}
function translateCategory(category) {
    const trimmed = String(category ?? '').trim();
    return productDeDictionary_1.PRODUCT_CATEGORY_DE[trimmed] ?? translatePlainTextEnToDe(trimmed);
}
function translateSpecKey(key) {
    const normalized = key.trim().toLowerCase().replace(/\s+/g, '_');
    if (productDeDictionary_1.SPEC_KEY_DE[normalized])
        return productDeDictionary_1.SPEC_KEY_DE[normalized];
    const spaced = key.trim().toLowerCase();
    if (productDeDictionary_1.SPEC_KEY_DE[spaced])
        return productDeDictionary_1.SPEC_KEY_DE[spaced];
    return translatePlainTextEnToDe(key.replace(/_/g, ' '));
}
function translateSpecValue(value) {
    if (value == null)
        return value;
    if (typeof value === 'string') {
        const exact = productDeDictionary_1.SPEC_VALUE_DE[value.trim()] ?? productDeDictionary_1.SPEC_VALUE_DE[value];
        return exact ?? translatePlainTextEnToDe(value);
    }
    if (typeof value === 'number' || typeof value === 'boolean')
        return value;
    if (Array.isArray(value))
        return value.map(translateSpecValue);
    if (typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[translateSpecKey(k)] = translateSpecValue(v);
        }
        return out;
    }
    return value;
}
function translateSpecificationsEnToDe(specs) {
    const out = {};
    for (const [key, value] of Object.entries(specs)) {
        if (key === 'pricing') {
            out[key] = value;
            continue;
        }
        const deKey = translateSpecKey(key);
        out[deKey] = translateSpecValue(value);
    }
    return out;
}
function translateMoq(moq) {
    const trimmed = String(moq ?? '').trim();
    if (!trimmed)
        return '';
    const exact = productDeDictionary_1.SPEC_VALUE_DE[trimmed];
    if (exact)
        return exact;
    return translatePlainTextEnToDe(trimmed);
}
function translateStandardField(value) {
    const trimmed = String(value ?? '').trim();
    if (!trimmed)
        return '';
    const exact = productDeDictionary_1.SPEC_VALUE_DE[trimmed];
    if (exact)
        return exact;
    return translatePlainTextEnToDe(trimmed);
}
function translateProductFieldsToGerman(input) {
    const catalog = lookupCatalogEntry(input.name);
    if (catalog) {
        const specs = input.specifications ?? {};
        const specsDe = translateSpecificationsEnToDe(Object.fromEntries(Object.entries(specs).filter(([k]) => k !== 'pricing')));
        return {
            name_de: catalog.name_de,
            category_de: catalog.category_de,
            description_de: catalog.description_de,
            material_de: catalog.material_de || translateStandardField(input.material),
            print_type_de: catalog.print_type_de || translateStandardField(input.print_type),
            packaging_de: catalog.packaging_de || translateStandardField(input.packaging),
            moq_de: catalog.moq_de || translateMoq(input.moq),
            specifications_de: JSON.stringify(specsDe),
        };
    }
    const specs = input.specifications ?? {};
    const specsDe = translateSpecificationsEnToDe(Object.fromEntries(Object.entries(specs).filter(([k]) => k !== 'pricing')));
    return {
        name_de: translatePlainTextEnToDe(input.name),
        category_de: translateCategory(input.category),
        description_de: translateHtmlEnToDe(input.description),
        material_de: translateStandardField(input.material),
        print_type_de: translateStandardField(input.print_type),
        packaging_de: translateStandardField(input.packaging),
        moq_de: translateMoq(input.moq),
        specifications_de: JSON.stringify(specsDe),
    };
}
async function ensureProductI18nColumns(pool) {
    const columns = [
        { name: 'name_de', ddl: 'ADD COLUMN name_de VARCHAR(255) NULL AFTER name' },
        { name: 'category_de', ddl: 'ADD COLUMN category_de VARCHAR(100) NULL AFTER category' },
        { name: 'description_de', ddl: 'ADD COLUMN description_de TEXT NULL AFTER description' },
        { name: 'material_de', ddl: 'ADD COLUMN material_de VARCHAR(255) NULL AFTER material' },
        { name: 'print_type_de', ddl: 'ADD COLUMN print_type_de VARCHAR(255) NULL AFTER print_type' },
        { name: 'packaging_de', ddl: 'ADD COLUMN packaging_de VARCHAR(255) NULL AFTER packaging' },
        { name: 'moq_de', ddl: 'ADD COLUMN moq_de VARCHAR(255) NULL AFTER moq' },
        { name: 'specifications_de', ddl: 'ADD COLUMN specifications_de JSON NULL AFTER specifications' },
    ];
    for (const col of columns) {
        try {
            await pool.execute(`ALTER TABLE products ${col.ddl}`);
        }
        catch (e) {
            const err = e;
            if (err?.code !== 'ER_DUP_FIELDNAME') {
                console.warn(`ensureProductI18nColumns (${col.name}):`, e);
            }
        }
    }
}
async function syncProductGermanTranslation(pool, productId) {
    const id = String(productId ?? '').trim();
    if (!id)
        return false;
    const [rows] = await pool.execute(`SELECT name, category, description, material, print_type, packaging, moq, specifications
     FROM products WHERE id = ? LIMIT 1`, [id]);
    if (!Array.isArray(rows) || rows.length === 0)
        return false;
    const row = rows[0];
    const translation = translateProductFieldsToGerman({
        name: String(row.name ?? ''),
        category: String(row.category ?? ''),
        description: String(row.description ?? ''),
        material: String(row.material ?? ''),
        print_type: String(row.print_type ?? ''),
        packaging: String(row.packaging ?? ''),
        moq: String(row.moq ?? ''),
        specifications: parseSpecifications(row.specifications),
    });
    if (!translation.name_de)
        return false;
    await pool.execute(`UPDATE products SET
      name_de = ?, category_de = ?, description_de = ?,
      material_de = ?, print_type_de = ?, packaging_de = ?, moq_de = ?,
      specifications_de = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`, [
        translation.name_de,
        translation.category_de,
        translation.description_de,
        translation.material_de,
        translation.print_type_de,
        translation.packaging_de,
        translation.moq_de,
        translation.specifications_de,
        id,
    ]);
    return true;
}
async function refreshAllProductGermanTranslations(pool) {
    try {
        await ensureProductI18nColumns(pool);
        const [rows] = await pool.execute(`SELECT id, name FROM products ORDER BY updated_at DESC`);
        if (!Array.isArray(rows) || rows.length === 0)
            return;
        console.log(`🌐 Refreshing German translations for ${rows.length} product(s)...`);
        let ok = 0;
        for (const row of rows) {
            const id = String(row.id ?? '').trim();
            if (!id)
                continue;
            const synced = await syncProductGermanTranslation(pool, id);
            if (synced)
                ok += 1;
        }
        if (ok > 0) {
            console.log(`🌐 German product translations updated for ${ok} product(s)`);
        }
    }
    catch (e) {
        console.error('refreshAllProductGermanTranslations failed (non-fatal):', e);
    }
}
async function backfillMissingProductGermanTranslations(pool) {
    await refreshAllProductGermanTranslations(pool);
}
//# sourceMappingURL=productTranslation.js.map