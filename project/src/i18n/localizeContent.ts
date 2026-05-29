import type { Locale } from './messages';
import { sectionContentDe } from './sectionContentDe';

const MEDIA_KEY = /^(image|.*_image|image_.*|logo|.*_url)$/i;

function isMediaField(key: string): boolean {
  return MEDIA_KEY.test(key);
}

type Slide = Record<string, unknown>;

function localizeSlides(apiSlides: unknown, deSlides: unknown): Slide[] {
  const en = Array.isArray(apiSlides) ? (apiSlides as Slide[]) : [];
  const de = Array.isArray(deSlides) ? (deSlides as Slide[]) : [];
  if (de.length === 0) return en;
  const count = Math.max(en.length, de.length);
  const result: Slide[] = [];
  for (let i = 0; i < count; i++) {
    const api = en[i] ?? en[en.length - 1] ?? {};
    const overlay = de[i] ?? de[de.length - 1] ?? {};
    result.push({
      ...api,
      ...overlay,
      image: api.image ?? overlay.image,
    });
  }
  return result;
}

function mergeBannerMap(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...base };
  for (const [key, val] of Object.entries(overlay)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const prev = (out[key] && typeof out[key] === 'object' ? out[key] : {}) as Record<string, unknown>;
      out[key] = { ...prev, ...(val as Record<string, unknown>) };
    }
  }
  return out;
}

function mergeLocalized(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };

  for (const [key, val] of Object.entries(overlay)) {
    if (key === 'slides') {
      out.slides = localizeSlides(base.slides, val);
      continue;
    }
    if (key === 'outer_bag' || key === 'inner_bag') {
      const prev =
        base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])
          ? (base[key] as Record<string, unknown>)
          : {};
      out[key] = { ...prev, ...(val as Record<string, unknown>) };
      continue;
    }
    if (
      val &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      (key.endsWith('_banner') || key === 'main_banner' || key === 'about_banner')
    ) {
      const prev =
        base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])
          ? (base[key] as Record<string, unknown>)
          : {};
      out[key] = { ...prev, ...(val as Record<string, unknown>) };
      continue;
    }
    if (Array.isArray(val) && key === 'items') {
      out.items = val;
      continue;
    }
    if (typeof val === 'string' && !isMediaField(key)) {
      out[key] = val;
    }
  }

  if (overlay.banners && typeof overlay.banners === 'object') {
    out.banners = mergeBannerMap(
      (base.banners as Record<string, unknown>) ?? base,
      overlay.banners as Record<string, unknown>
    );
  }

  return out;
}

/** Apply German CMS text overlays while keeping images/URLs from the API. */
export function localizeSection<T extends Record<string, unknown>>(
  sectionKey: string,
  content: T,
  locale: Locale
): T {
  if (locale !== 'de') return content;
  const overlay = sectionContentDe[sectionKey];
  if (!overlay) return content;
  return mergeLocalized(content, overlay) as T;
}
