const API_BASE =
  (process.env.VITE_API_URL || 'https://app.cottonunique.com/api').replace(/\/$/, '');

const STATIC_ROUTES = ['/', '/products', '/privacy'];

const FALLBACK_PRODUCT_SLUGS = [
  'ecotote-duopack-cotton-tote-bag',
  'floral-elegance-canvas-tote-bag',
  'watercolor-collection-tote-bag',
  'sunflower-embroidered-tote-bag',
];

/** Routes for vite-plugin-sitemap (static pages + product detail URLs). */
export async function getSitemapRoutes() {
  const routes = [...STATIC_ROUTES];

  try {
    const res = await fetch(`${API_BASE}/products`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`products API ${res.status}`);
    const products = await res.json();
    if (!Array.isArray(products)) throw new Error('invalid products payload');

    for (const product of products) {
      const slug = product?.slug?.trim() || product?.id?.trim();
      if (slug) routes.push(`/products/${encodeURIComponent(String(slug))}`);
    }
  } catch (err) {
    console.warn('[sitemap] Could not fetch products; using fallback slugs:', err?.message || err);
    for (const slug of FALLBACK_PRODUCT_SLUGS) {
      routes.push(`/products/${slug}`);
    }
  }

  return [...new Set(routes)];
}
