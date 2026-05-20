import type { Pool } from 'mysql2/promise';
import type mysql from 'mysql2/promise';

/** Convert a product name to a URL-friendly slug (lowercase, hyphens, no special chars). */
export function toSlug(name: string): string {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

const CANONICAL_SLUG_RULES: Array<{ match: (nameSlug: string) => boolean; slug: string }> = [
  {
    match: (s) => s.includes('ecotote') && s.includes('duopack'),
    slug: 'ecotote-duopack-cotton-tote-bag',
  },
  {
    match: (s) => s.includes('floral') && s.includes('elegance'),
    slug: 'floral-elegance-canvas-tote-bag',
  },
  {
    match: (s) => s.includes('watercolor'),
    slug: 'watercolor-collection-tote-bag',
  },
  {
    match: (s) => s.includes('sunflower') && s.includes('embroider'),
    slug: 'sunflower-embroidered-tote-bag',
  },
];

/** Preferred SEO slug for a product name (canonical names or `*-tote-bag` suffix). */
export function resolvePreferredProductSlug(name: string): string {
  const nameSlug = toSlug(name);
  if (!nameSlug) return 'product-tote-bag';

  for (const { match, slug } of CANONICAL_SLUG_RULES) {
    if (match(nameSlug)) return slug;
  }

  return ensureToteBagInSlug(nameSlug);
}

/** Ensure slug contains the keyword `tote-bag` for product URLs. */
export function ensureToteBagInSlug(slug: string): string {
  let s = toSlug(slug);
  if (!s) return 'product-tote-bag';
  if (s.includes('tote-bag')) return s;

  s = s.replace(/-tote-bag$/i, '').replace(/-(tote|bag)$/i, '');
  return `${s}-tote-bag`.replace(/-{2,}/g, '-');
}

export function slugNeedsSeoUpdate(name: string, slug: string): boolean {
  const trimmed = String(slug ?? '').trim();
  if (!trimmed || !trimmed.includes('tote-bag')) return true;
  return resolvePreferredProductSlug(name) !== trimmed;
}

async function allocateUniqueSlug(
  pool: Pool,
  preferred: string,
  excludeId?: string
): Promise<string> {
  let base = ensureToteBagInSlug(preferred);
  let slug = base;
  let n = 0;

  for (;;) {
    const [rows] = await pool.execute(
      excludeId
        ? 'SELECT id FROM products WHERE slug = ? AND id != ? LIMIT 1'
        : 'SELECT id FROM products WHERE slug = ? LIMIT 1',
      excludeId ? [slug, excludeId] : [slug]
    );
    if (!Array.isArray(rows) || rows.length === 0) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function generateUniqueProductSlug(
  pool: Pool,
  name: string,
  excludeId?: string
): Promise<string> {
  const preferred = resolvePreferredProductSlug(name);
  return allocateUniqueSlug(pool, preferred, excludeId);
}

/** One-time style migration: normalize slugs to SEO pattern (`*-tote-bag`). */
export async function migrateProductSlugsToSeoPattern(pool: Pool): Promise<void> {
  try {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id, name, slug FROM products'
    );
    if (!Array.isArray(rows) || rows.length === 0) return;

    let updated = 0;
    for (const row of rows) {
      const id = String(row.id ?? '').trim();
      const name = String(row.name ?? '').trim();
      const currentSlug = String(row.slug ?? '').trim();
      if (!id || !name) continue;
      if (!slugNeedsSeoUpdate(name, currentSlug)) continue;

      const slug = await generateUniqueProductSlug(pool, name, id);
      await pool.execute('UPDATE products SET slug = ? WHERE id = ?', [slug, id]);
      updated += 1;
    }

    if (updated > 0) {
      console.log(`🔧 Updated SEO slug for ${updated} product row(s)`);
    }
  } catch (e) {
    console.error('migrateProductSlugsToSeoPattern failed (non-fatal):', e);
  }
}
