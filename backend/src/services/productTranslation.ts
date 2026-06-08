import type { Pool, RowDataPacket } from 'mysql2/promise';
import { PRODUCT_CATALOG_DE } from '../i18n/productCatalogDe';
import {
  PRODUCT_CATEGORY_DE,
  PRODUCT_PHRASES_DE,
  PRODUCT_WORDS_DE,
  SPEC_KEY_DE,
  SPEC_VALUE_DE,
} from '../i18n/productDeDictionary';

export interface ProductTranslationInput {
  name: string;
  category: string;
  description: string;
  material: string;
  print_type: string;
  packaging: string;
  moq: string;
  specifications: Record<string, unknown>;
}

export interface ProductGermanTranslation {
  name_de: string;
  category_de: string;
  description_de: string;
  material_de: string;
  print_type_de: string;
  packaging_de: string;
  moq_de: string;
  specifications_de: string;
}

const SORTED_PHRASES = [...PRODUCT_PHRASES_DE].sort((a, b) => b[0].length - a[0].length);
const SORTED_SPEC_VALUES = Object.entries(SPEC_VALUE_DE).sort((a, b) => b[0].length - a[0].length);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeCatalogKey(name: string): string {
  return String(name ?? '').trim();
}

function lookupCatalogEntry(name: string) {
  const key = normalizeCatalogKey(name);
  if (PRODUCT_CATALOG_DE[key]) return PRODUCT_CATALOG_DE[key];
  const asciiApostrophe = key.replace(/\u2019/g, "'");
  if (PRODUCT_CATALOG_DE[asciiApostrophe]) return PRODUCT_CATALOG_DE[asciiApostrophe];
  const curlyApostrophe = key.replace(/'/g, '\u2019');
  if (PRODUCT_CATALOG_DE[curlyApostrophe]) return PRODUCT_CATALOG_DE[curlyApostrophe];
  return null;
}

function parseSpecifications(value: unknown): Record<string, unknown> {
  if (value == null || value === '') return {};
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

function applyPhraseDictionary(text: string): string {
  let result = text;
  for (const [en, de] of SORTED_PHRASES) {
    if (!en.trim()) continue;
    const pattern = new RegExp(escapeRegExp(en), 'gi');
    result = result.replace(pattern, de);
  }
  return result;
}

function applyWordGlossary(text: string): string {
  return text.replace(/\b[A-Za-z][A-Za-z'-]*\b/g, (word) => {
    const lower = word.toLowerCase();
    const mapped = PRODUCT_WORDS_DE[lower];
    if (!mapped) return word;
    if (word === word.toUpperCase()) return mapped.toUpperCase();
    if (word[0] === word[0].toUpperCase()) {
      return mapped.charAt(0).toUpperCase() + mapped.slice(1);
    }
    return mapped;
  });
}

function applySpecValueDictionary(text: string): string {
  let result = text;
  for (const [en, de] of SORTED_SPEC_VALUES) {
    const pattern = new RegExp(escapeRegExp(en), 'gi');
    result = result.replace(pattern, de);
  }
  return result;
}

function polishGermanText(text: string): string {
  return text
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+%/g, ' %')
    .replace(/Bio-\s+Baumwolle/g, 'Bio-Baumwolle')
    .replace(/Unternehmens-\s+/g, 'Unternehmens-')
    .trim();
}

/** Apply phrase + glossary translation for unknown catalog products. */
export function translatePlainTextEnToDe(text: string): string {
  const input = String(text ?? '');
  if (!input.trim()) return input;

  let result = applySpecValueDictionary(input);
  result = applyPhraseDictionary(result);
  result = applyWordGlossary(result);
  return polishGermanText(result);
}

/** Translate visible text while preserving HTML tags/attributes. */
export function translateHtmlEnToDe(html: string): string {
  const input = String(html ?? '');
  if (!input.trim()) return input;

  return input
    .split(/(<[^>]+>)/g)
    .map((segment) => {
      if (segment.startsWith('<')) return segment;
      return translatePlainTextEnToDe(segment);
    })
    .join('');
}

function translateCategory(category: string): string {
  const trimmed = String(category ?? '').trim();
  return PRODUCT_CATEGORY_DE[trimmed] ?? translatePlainTextEnToDe(trimmed);
}

function translateSpecKey(key: string): string {
  const normalized = key.trim().toLowerCase().replace(/\s+/g, '_');
  if (SPEC_KEY_DE[normalized]) return SPEC_KEY_DE[normalized];
  const spaced = key.trim().toLowerCase();
  if (SPEC_KEY_DE[spaced]) return SPEC_KEY_DE[spaced];
  return translatePlainTextEnToDe(key.replace(/_/g, ' '));
}

function translateSpecValue(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === 'string') {
    const exact = SPEC_VALUE_DE[value.trim()] ?? SPEC_VALUE_DE[value];
    return exact ?? translatePlainTextEnToDe(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(translateSpecValue);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[translateSpecKey(k)] = translateSpecValue(v);
    }
    return out;
  }
  return value;
}

export function translateSpecificationsEnToDe(specs: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
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

function translateMoq(moq: string): string {
  const trimmed = String(moq ?? '').trim();
  if (!trimmed) return '';
  const exact = SPEC_VALUE_DE[trimmed];
  if (exact) return exact;
  return translatePlainTextEnToDe(trimmed);
}

function translateStandardField(value: string): string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  const exact = SPEC_VALUE_DE[trimmed];
  if (exact) return exact;
  return translatePlainTextEnToDe(trimmed);
}

/** Translate product catalog fields from English to German (catalog-first, then rules). */
export function translateProductFieldsToGerman(
  input: ProductTranslationInput
): ProductGermanTranslation {
  const catalog = lookupCatalogEntry(input.name);
  if (catalog) {
    const specs = input.specifications ?? {};
    const specsDe = translateSpecificationsEnToDe(
      Object.fromEntries(Object.entries(specs).filter(([k]) => k !== 'pricing'))
    );
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
  const specsDe = translateSpecificationsEnToDe(
    Object.fromEntries(Object.entries(specs).filter(([k]) => k !== 'pricing'))
  );

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

export async function ensureProductI18nColumns(pool: Pool): Promise<void> {
  const columns: { name: string; ddl: string }[] = [
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
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code !== 'ER_DUP_FIELDNAME') {
        console.warn(`ensureProductI18nColumns (${col.name}):`, e);
      }
    }
  }
}

/** Generate and persist German fields for one product row. */
export async function syncProductGermanTranslation(pool: Pool, productId: string): Promise<boolean> {
  const id = String(productId ?? '').trim();
  if (!id) return false;

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT name, category, description, material, print_type, packaging, moq, specifications
     FROM products WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!Array.isArray(rows) || rows.length === 0) return false;

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

  if (!translation.name_de) return false;

  await pool.execute(
    `UPDATE products SET
      name_de = ?, category_de = ?, description_de = ?,
      material_de = ?, print_type_de = ?, packaging_de = ?, moq_de = ?,
      specifications_de = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      translation.name_de,
      translation.category_de,
      translation.description_de,
      translation.material_de,
      translation.print_type_de,
      translation.packaging_de,
      translation.moq_de,
      translation.specifications_de,
      id,
    ]
  );
  return true;
}

/** Re-translate every product (keeps German in sync after catalog updates). */
export async function refreshAllProductGermanTranslations(pool: Pool): Promise<void> {
  try {
    await ensureProductI18nColumns(pool);
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, name FROM products ORDER BY updated_at DESC`
    );
    if (!Array.isArray(rows) || rows.length === 0) return;

    console.log(`🌐 Refreshing German translations for ${rows.length} product(s)...`);
    let ok = 0;
    for (const row of rows) {
      const id = String(row.id ?? '').trim();
      if (!id) continue;
      const synced = await syncProductGermanTranslation(pool, id);
      if (synced) ok += 1;
    }
    if (ok > 0) {
      console.log(`🌐 German product translations updated for ${ok} product(s)`);
    }
  } catch (e) {
    console.error('refreshAllProductGermanTranslations failed (non-fatal):', e);
  }
}

/** Backfill / refresh German translations for all products (runs in background on startup). */
export async function backfillMissingProductGermanTranslations(pool: Pool): Promise<void> {
  await refreshAllProductGermanTranslations(pool);
}
