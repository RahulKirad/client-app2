import type { Product } from './api';
import { resolveMediaUrl } from './api';
import { htmlToPlainText } from './productDescriptionHtml';

export const BRAND_NAME = 'Cottonunique';

/** Public site origin (no trailing slash). Override with VITE_SITE_URL in production. */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://cottonunique.com'
).replace(/\/$/, '');

export const DEFAULT_OG_IMAGE = '/images/logo/logo.png';

export function truncateMeta(text: string, maxLen: number): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 1).trim()}…`;
}

export function buildTitle(primary: string): string {
  const suffix = ` | ${BRAND_NAME}`;
  const maxPrimary = 60 - suffix.length;
  const head = truncateMeta(primary, Math.max(20, maxPrimary));
  return `${head}${suffix}`;
}

export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function productPath(product: Pick<Product, 'id' | 'slug'>): string {
  const segment = (product.slug && String(product.slug).trim()) || product.id;
  return `/products/${encodeURIComponent(segment)}`;
}

/** Product detail `<title>` — pattern: "[Name] — Organic Cotton Tote Bag | Buy Bulk India | Cottonunique" */
export function buildProductTitle(productName: string): string {
  return truncateMeta(
    `${productName} — Organic Cotton Tote Bag | Buy Bulk India | Cottonunique`,
    60
  );
}

/** Product meta description — bulk / GOTS / export-ready pattern. */
export function buildProductDescription(productName: string): string {
  return truncateMeta(
    `Buy ${productName} in bulk from Cottonunique, India's trusted GOTS-certified tote bag manufacturer. Custom printing, export-ready, minimum order available. Get a quote today.`,
    160
  );
}

export function productSeoFromRecord(product: Product) {
  const title = buildProductTitle(product.name);
  const description = buildProductDescription(product.name);
  const image = resolveMediaUrl(product.image_url || undefined);
  const ogImage = image.startsWith('http') ? image : absoluteUrl(image);
  return { title, description, ogImage, ogType: 'product' as const };
}

export function buildProductJsonLd(product: Product) {
  const plain =
    htmlToPlainText(product.description) || buildProductDescription(product.name);
  const image = resolveMediaUrl(product.image_url || undefined);
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: truncateMeta(plain, 5000),
    image: imageUrl,
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(productPath(product)),
      priceCurrency: 'INR',
      price: String(product.price ?? 0),
      availability: 'https://schema.org/InStock',
    },
  };
}

export function buildProductBreadcrumbJsonLd(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: `${SITE_URL}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: absoluteUrl(productPath(product)),
      },
    ],
  };
}

export function isInternalAppHref(href: string): boolean {
  const h = href.trim();
  if (!h || h.startsWith('mailto:') || h.startsWith('tel:')) return false;
  if (h.startsWith('#')) return true;
  if (h.startsWith('/')) return true;
  if (h.startsWith('http://') || h.startsWith('https://')) {
    try {
      const u = new URL(h);
      const siteHost = new URL(SITE_URL).hostname;
      if (typeof window !== 'undefined' && u.hostname === window.location.hostname) return true;
      return u.hostname === siteHost;
    } catch {
      return false;
    }
  }
  return false;
}
