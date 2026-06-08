import type { Product } from './api';
import type { Locale } from '../i18n/messages';

type ProductRow = Product & {
  name_de?: string | null;
  category_de?: string | null;
  description_de?: string | null;
  material_de?: string | null;
  print_type_de?: string | null;
  packaging_de?: string | null;
  moq_de?: string | null;
  specifications_de?: Record<string, unknown> | string | null;
};

function pickDe(primary: string | null | undefined, fallback: string): string {
  const value = String(primary ?? '').trim();
  return value || fallback;
}

function parseSpecificationsDe(value: ProductRow['specifications_de']): Record<string, unknown> | null {
  if (value == null || value === '') return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Overlay stored German catalog fields when locale is de. */
export function localizeProduct<T extends Product>(product: T, locale: Locale): T {
  if (locale !== 'de') return product;

  const row = product as ProductRow;
  const specsDe = parseSpecificationsDe(row.specifications_de);
  const baseSpecs =
    product.specifications && typeof product.specifications === 'object'
      ? product.specifications
      : {};

  return {
    ...product,
    name: pickDe(row.name_de, product.name),
    category: pickDe(row.category_de, product.category),
    description: pickDe(row.description_de, product.description),
    material: pickDe(row.material_de, product.material),
    print_type: pickDe(row.print_type_de, product.print_type),
    packaging: pickDe(row.packaging_de, product.packaging),
    moq: pickDe(row.moq_de, product.moq),
    specifications: specsDe ?? baseSpecs,
  };
}

export function localizeProducts<T extends Product>(products: T[], locale: Locale): T[] {
  return products.map((p) => localizeProduct(p, locale));
}
