import type { Product } from './api';
import { resolveMediaUrl } from './api';
import { MAIN_CONTACT_EMAIL } from './brand';
import { htmlToPlainText } from './productDescriptionHtml';

export const BRAND_NAME = 'Cottonunique';

/** Build-time fallback origin (no trailing slash). */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://cottonunique.com'
).replace(/\/$/, '');

export const PUBLIC_SITE_HOSTS = new Set([
  'cottonunique.com',
  'www.cottonunique.com',
  'cottonunique.de',
  'www.cottonunique.de',
]);

/** Active origin in the browser; falls back to SITE_URL during build/SSR. */
export function resolveSiteUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin && origin !== 'null') {
      return origin.replace(/\/$/, '');
    }
  }
  return SITE_URL;
}

export const DEFAULT_OG_IMAGE = '/images/logo/logo.png';

/** First hero slide — LCP candidate on homepage. */
export const HERO_LCP_IMAGE_PATH = '/images/banner/baner5.png';

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    url: resolveSiteUrl(),
    logo: absoluteUrl(DEFAULT_OG_IMAGE),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description:
      'GOTS-certified organic cotton tote bag manufacturer and exporter from India. Custom printing, bulk orders, export-ready.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: MAIN_CONTACT_EMAIL,
      availableLanguage: ['English', 'Hindi'],
    },
    areaServed: 'Worldwide',
    knowsAbout: [
      'organic cotton tote bags',
      'GOTS certified bags',
      'sustainable packaging',
      'custom tote bags',
    ],
  };
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND_NAME,
    url: resolveSiteUrl(),
    description:
      'Premium GOTS-certified sustainable cotton tote bags for corporates, NGOs, and global exporters.',
    publisher: {
      '@type': 'Organization',
      name: BRAND_NAME,
      logo: absoluteUrl(DEFAULT_OG_IMAGE),
    },
  };
}

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
  const base = resolveSiteUrl();
  if (!path) return base;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
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
        item: resolveSiteUrl(),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: `${resolveSiteUrl()}/products`,
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
      const host = u.hostname.toLowerCase().replace(/^www\./, '');
      if (typeof window !== 'undefined' && u.hostname === window.location.hostname) return true;
      return PUBLIC_SITE_HOSTS.has(u.hostname.toLowerCase()) || PUBLIC_SITE_HOSTS.has(host);
    } catch {
      return false;
    }
  }
  return false;
}
