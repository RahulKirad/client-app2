// API client for MySQL backend

/** Node API host — real backend; storefront reaches it via same-origin /api PHP proxy. */
export const PRODUCTION_API_BASE_URL = 'https://app.cottonunique.com/api';

function isPublicStorefrontHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'app.cottonunique.com') return false;
  return (
    host === 'cottonunique.com' ||
    host.endsWith('.cottonunique.com') ||
    host === 'cottonunique.de' ||
    host.endsWith('.cottonunique.de')
  );
}

/** Ensures the base ends with /api (e.g. if VITE_API_URL is only http://localhost:3001). */
function normalizeViteApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').trim().replace(/\/$/, '');
  if (/^\/api$/i.test(raw)) return '/api';
  if (/\/api$/i.test(raw)) return raw;
  return `${raw}/api`;
}

function resolveApiBaseUrl(): string {
  // cottonunique.com / .de → same-origin /api (PHP proxy → app.cottonunique.com). No CORS.
  if (typeof window !== 'undefined' && isPublicStorefrontHost(window.location.hostname)) {
    return '/api';
  }
  const raw = (import.meta.env.VITE_API_URL || '').trim();
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw.replace(/\/$/, '').endsWith('/api')
      ? raw.replace(/\/$/, '')
      : `${raw.replace(/\/$/, '')}/api`;
  }
  if (raw === '/api' || raw === '') {
    return '/api';
  }
  return normalizeViteApiBaseUrl();
}

export const API_BASE_URL = resolveApiBaseUrl();

/** Admin uploads talk directly to Node (multipart is unreliable through PHP proxy). */
export function getAdminApiBaseUrl(): string {
  if (typeof window !== 'undefined' && isPublicStorefrontHost(window.location.hostname)) {
    return PRODUCTION_API_BASE_URL;
  }
  return API_BASE_URL.startsWith('http') ? API_BASE_URL : PRODUCTION_API_BASE_URL;
}

/** Origin for /uploads/… paths returned by the API. */
export function getApiOrigin(): string {
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    return API_BASE_URL.replace(/\/api\/?$/, '');
  }
  if (API_BASE_URL.startsWith('/')) {
    return typeof window !== 'undefined' ? window.location.origin : 'https://cottonunique.com';
  }
  return API_BASE_URL.replace(/\/api\/?$/, '');
}

export interface Product {
  id: string;
  slug?: string;
  name: string;
  category: string;
  description: string;
  material: string;
  print_type: string;
  packaging: string;
  moq: string;
  price: number;
  image_url: string;
  gallery_images: string[];
  specifications: Record<string, any>;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Stored German translations (populated by backend on create/update). */
  name_de?: string;
  category_de?: string;
  description_de?: string;
  material_de?: string;
  print_type_de?: string;
  packaging_de?: string;
  moq_de?: string;
  specifications_de?: Record<string, any> | string;
}

export interface Inquiry {
  id?: string;
  name: string;
  company?: string;
  email: string;
  region?: string;
  order_type?: string;
  message: string;
  status?: string;
  created_at?: string;
}

export interface SampleRequestInput {
  product_id: string;
  product_name: string;
  name: string;
  company?: string;
  email: string;
  region?: string;
  message: string;
}

export interface SampleRequestRow extends SampleRequestInput {
  id: string;
  status: string;
  created_at: string;
  /** Present when admin list joins `products` (current catalog image). */
  product_image_url?: string | null;
  /** JSON array string or parsed gallery from joined product. */
  product_gallery_images?: string | unknown | null;
  product_description?: string | null;
  product_category?: string | null;
  product_material?: string | null;
  product_print_type?: string | null;
  product_packaging?: string | null;
  product_moq?: string | null;
  product_price?: number | string | null;
  product_specifications?: string | Record<string, unknown> | null;
}

export interface ContentSection {
  id: string;
  section_key: string;
  title: string;
  content: Record<string, any>;
  is_active: boolean;
  updated_at: string;
}

/** Resolve image/media paths returned by API across local and hosted environments. */
export function resolveMediaUrl(url?: string | null, cacheBuster?: string | number | null): string {
  if (!url) return '/images/placeholder-product.jpg';
  let resolved: string;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    resolved = url;
  } else if (url.startsWith('/images')) {
    resolved = url;
  } else {
    resolved = `${getApiOrigin()}${url.startsWith('/') ? url : `/${url}`}`;
  }
  if (cacheBuster == null || cacheBuster === '') return resolved;
  const sep = resolved.includes('?') ? '&' : '?';
  return `${resolved}${sep}v=${encodeURIComponent(String(cacheBuster))}`;
}

export const CONTENT_UPDATED_EVENT = 'cottonunique-content-updated';

export function notifyContentUpdated(sectionKey?: string) {
  invalidateContentSectionCache(sectionKey);
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(CONTENT_UPDATED_EVENT, { detail: { sectionKey } })
  );
}

const CONTENT_SECTION_CACHE_MS = 60_000;
const contentSectionCache = new Map<string, { at: number; data: ContentSection }>();
const contentSectionInflight = new Map<string, Promise<ContentSection>>();
let allContentSectionsInflight: Promise<Record<string, ContentSection>> | null = null;
let allContentSectionsCache: { at: number; data: Record<string, ContentSection> } | null = null;
let contentBatchCooldownUntil = 0;

export function invalidateContentSectionCache(sectionKey?: string) {
  contentBatchCooldownUntil = 0;
  if (sectionKey) {
    contentSectionCache.delete(sectionKey);
    contentSectionInflight.delete(sectionKey);
    allContentSectionsCache = null;
    allContentSectionsInflight = null;
    return;
  }
  contentSectionCache.clear();
  contentSectionInflight.clear();
  allContentSectionsCache = null;
  allContentSectionsInflight = null;
}

async function fetchSingleContentSection(key: string): Promise<ContentSection> {
  const res = await fetch(`${API_BASE_URL}/content/${encodeURIComponent(key)}`);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  const data = (await res.json()) as ContentSection;
  contentSectionCache.set(key, { at: Date.now(), data });
  return data;
}

async function loadAllContentSections(): Promise<Record<string, ContentSection>> {
  const now = Date.now();
  if (now < contentBatchCooldownUntil) {
    throw new Error('Content API cooling down after recent failures');
  }
  if (allContentSectionsCache && now - allContentSectionsCache.at < CONTENT_SECTION_CACHE_MS) {
    return allContentSectionsCache.data;
  }
  if (allContentSectionsInflight) {
    return allContentSectionsInflight;
  }

  allContentSectionsInflight = (async () => {
    const res = await fetch(`${API_BASE_URL}/content`);
    if (res.status === 404) {
      return {};
    }
    if (!res.ok) {
      contentBatchCooldownUntil = Date.now() + 60_000;
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const payload = (await res.json()) as { sections?: Record<string, ContentSection> };
    const sections = payload.sections ?? {};
    const at = Date.now();
    for (const [key, section] of Object.entries(sections)) {
      contentSectionCache.set(key, { at, data: section });
    }
    allContentSectionsCache = { at, data: sections };
    return sections;
  })();

  try {
    return await allContentSectionsInflight;
  } catch (error) {
    contentBatchCooldownUntil = Date.now() + 60_000;
    throw error;
  } finally {
    allContentSectionsInflight = null;
  }
}

let productsInflight: Promise<Product[]> | null = null;
let productsCache: { at: number; data: Product[] } | null = null;
const PRODUCTS_CACHE_MS = 30_000;

const publicSettingsCache = new Map<string, { at: number; data: unknown }>();
const publicSettingsInflight = new Map<string, Promise<unknown>>();
let publicSettingsCooldownUntil = 0;
const PUBLIC_SETTINGS_CACHE_MS = 120_000;
const PUBLIC_SETTINGS_COOLDOWN_MS = 120_000;

async function getCachedPublicSettings<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  if (now < publicSettingsCooldownUntil) {
    const cached = publicSettingsCache.get(key);
    if (cached) return cached.data as T;
    throw new Error('Settings API cooling down after recent failures');
  }

  const cached = publicSettingsCache.get(key);
  if (cached && now - cached.at < PUBLIC_SETTINGS_CACHE_MS) {
    return cached.data as T;
  }

  const inflight = publicSettingsInflight.get(key);
  if (inflight) return inflight as Promise<T>;

  const promise = loader()
    .then((data) => {
      publicSettingsCache.set(key, { at: Date.now(), data });
      return data;
    })
    .catch((error) => {
      publicSettingsCooldownUntil = Date.now() + PUBLIC_SETTINGS_COOLDOWN_MS;
      throw error;
    })
    .finally(() => {
      publicSettingsInflight.delete(key);
    });

  publicSettingsInflight.set(key, promise);
  return promise;
}

export function invalidateProductsCache() {
  productsCache = null;
  productsInflight = null;
}

/** Normalize API product rows (DB shape) to frontend Product shape. */
export function normalizeProducts(rows: unknown[]): Product[] {
  return (rows as Record<string, unknown>[]).map((row) => {
    const specs = row.specifications;
    const gallery = row.gallery_images;
    return {
      id: String(row.id ?? ''),
      slug: row.slug != null && String(row.slug).trim() !== '' ? String(row.slug) : undefined,
      name: String(row.name ?? ''),
      category: String(row.category ?? ''),
      description: String(row.description ?? ''),
      material: String(row.material ?? ''),
      print_type: String(row.print_type ?? ''),
      packaging: String(row.packaging ?? ''),
      moq: row.moq != null ? String(row.moq) : '',
      price: typeof row.price === 'number' ? row.price : parseFloat(String(row.price)) || 0,
      image_url: String(row.image_url ?? ''),
      gallery_images: Array.isArray(gallery) ? (gallery as string[]) : (typeof gallery === 'string' ? (() => { try { return JSON.parse(gallery) as string[]; } catch { return []; } })() : []),
      specifications: specs && typeof specs === 'object' && specs !== null ? specs as Record<string, any> : (typeof specs === 'string' ? (() => { try { return JSON.parse(specs) as Record<string, any>; } catch { return {}; } })() : {}),
      is_featured: Boolean(row.is_featured),
      is_active: row.is_active !== false && row.is_active !== 0,
      created_at: String(row.created_at ?? ''),
      updated_at: String(row.updated_at ?? ''),
      name_de: row.name_de != null ? String(row.name_de) : undefined,
      category_de: row.category_de != null ? String(row.category_de) : undefined,
      description_de: row.description_de != null ? String(row.description_de) : undefined,
      material_de: row.material_de != null ? String(row.material_de) : undefined,
      print_type_de: row.print_type_de != null ? String(row.print_type_de) : undefined,
      packaging_de: row.packaging_de != null ? String(row.packaging_de) : undefined,
      moq_de: row.moq_de != null ? String(row.moq_de) : undefined,
      specifications_de: (() => {
        const raw = row.specifications_de;
        if (raw == null || raw === '') return undefined;
        if (typeof raw === 'object') return raw as Record<string, any>;
        try {
          return JSON.parse(String(raw)) as Record<string, any>;
        } catch {
          return undefined;
        }
      })(),
    };
  });
}

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const method = (options?.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {
      ...(options?.headers as Record<string, string> | undefined),
    };
    // JSON Content-Type on GET triggers a CORS preflight; omit for simple cross-origin reads.
    if (method !== 'GET' && method !== 'HEAD' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Products
  async getProducts(): Promise<Product[]> {
    const now = Date.now();
    if (productsCache && now - productsCache.at < PRODUCTS_CACHE_MS) {
      return productsCache.data;
    }
    if (productsInflight) {
      return productsInflight;
    }

    productsInflight = (async () => {
      const data = await this.request<unknown[]>('/products');
      const normalized = Array.isArray(data) ? normalizeProducts(data) : [];
      productsCache = { at: Date.now(), data: normalized };
      return normalized;
    })();

    try {
      return await productsInflight;
    } finally {
      productsInflight = null;
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    const data = await this.request<unknown[]>('/products/featured');
    return Array.isArray(data) ? normalizeProducts(data) : [];
  }

  async getProduct(slugOrId: string): Promise<Product> {
    const trimmed = String(slugOrId ?? '').trim();
    if (!trimmed) {
      throw new Error('Invalid product');
    }
    const data = await this.request<Record<string, unknown>>(`/products/${encodeURIComponent(trimmed)}`);
    const list = normalizeProducts([data]);
    if (!list.length) throw new Error('Product not found');
    return list[0];
  }

  async getRelatedProducts(slugOrId: string): Promise<Product[]> {
    const trimmed = String(slugOrId ?? '').trim();
    if (!trimmed) return [];
    const data = await this.request<unknown[]>(`/products/related/${encodeURIComponent(trimmed)}`);
    return Array.isArray(data) ? normalizeProducts(data) : [];
  }

  // Inquiries
  async submitInquiry(inquiry: Omit<Inquiry, 'id' | 'status' | 'created_at'>): Promise<{ message: string; id: string }> {
    return this.request<{ message: string; id: string }>('/inquiries', {
      method: 'POST',
      body: JSON.stringify(inquiry),
    });
  }

  async submitSampleRequest(body: SampleRequestInput): Promise<{ message: string; id: string }> {
    return this.request<{ message: string; id: string }>('/sample-requests', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Content — one batched /content request for the whole page (no per-section retry storm).
  async getContentSection(sectionKey: string): Promise<ContentSection> {
    const key = sectionKey.trim();
    const now = Date.now();
    const cached = contentSectionCache.get(key);
    if (cached && now - cached.at < CONTENT_SECTION_CACHE_MS) {
      return cached.data;
    }

    const inflight = contentSectionInflight.get(key);
    if (inflight) {
      return inflight;
    }

    const promise = (async () => {
      const all = await loadAllContentSections();
      if (all[key]) {
        return all[key];
      }
      // Legacy backend without batch route: one single-section request only.
      return fetchSingleContentSection(key);
    })();

    contentSectionInflight.set(key, promise);
    try {
      return await promise;
    } finally {
      contentSectionInflight.delete(key);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Chatbot / site settings — cache + cooldown so a down API is not hammered on every focus/poll.
  async getSiteSettings(): Promise<{ languageToggleEnabled: boolean }> {
    return getCachedPublicSettings('site', async () => {
      const url = `${API_BASE_URL}/site/settings`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return {
        languageToggleEnabled:
          data.languageToggleEnabled === true || data.languageToggleEnabled === 1,
      };
    });
  }

  async getChatbotSettings(): Promise<{ enabled: boolean; welcomeMessage: string | null }> {
    return getCachedPublicSettings('chatbot', async () => {
      const url = `${API_BASE_URL}/chatbot/settings`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return {
        enabled: data.enabled === true || data.enabled === 1,
        welcomeMessage: data.welcomeMessage ?? null,
      };
    });
  }

  async sendChatMessage(
    message: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{ message: string; timestamp: string }> {
    return this.request<{ message: string; timestamp: string }>('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory }),
    });
  }

  async getChatbotDiagnostics(): Promise<any> {
    return this.request<any>('/chatbot/diagnostics');
  }
}

export const apiClient = new ApiClient();