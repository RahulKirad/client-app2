// API client for MySQL backend

/** Ensures the base ends with /api (e.g. if VITE_API_URL is only http://localhost:3001). */
function normalizeViteApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').trim().replace(/\/$/, '');
  if (/\/api$/i.test(raw)) return raw;
  return `${raw}/api`;
}

export const API_BASE_URL = normalizeViteApiBaseUrl();
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
// const API_BASE_URL = 'https://app.cottonunique.com/api';

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
    resolved = `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
  }
  if (cacheBuster == null || cacheBuster === '') return resolved;
  const sep = resolved.includes('?') ? '&' : '?';
  return `${resolved}${sep}v=${encodeURIComponent(String(cacheBuster))}`;
}

export const CONTENT_UPDATED_EVENT = 'cottonunique-content-updated';

export function notifyContentUpdated(sectionKey?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(CONTENT_UPDATED_EVENT, { detail: { sectionKey } })
  );
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
    };
  });
}

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
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
    const data = await this.request<unknown[]>('/products');
    return Array.isArray(data) ? normalizeProducts(data) : [];
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

  // Content
  async getContentSection(sectionKey: string): Promise<ContentSection> {
    const url = `${API_BASE_URL}/content/${encodeURIComponent(sectionKey)}?t=${Date.now()}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Chatbot
  async getChatbotSettings(): Promise<{ enabled: boolean; welcomeMessage: string | null }> {
    const url = `${API_BASE_URL}/chatbot/settings?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store', headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return {
      enabled: data.enabled === true || data.enabled === 1,
      welcomeMessage: data.welcomeMessage ?? null,
    };
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