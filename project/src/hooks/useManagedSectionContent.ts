import { useEffect, useRef, useState } from 'react';
import { apiClient, CONTENT_UPDATED_EVENT } from '../lib/api';

function parseContent(value: unknown): Record<string, unknown> | null {
  let parsed: unknown = value;
  while (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      break;
    }
  }
  return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
}

/** Same issue as admin: `slides` may be a JSON string in some DB exports / column types. */
function normalizeHeroSlidesField(parsed: Record<string, unknown>): Record<string, unknown> {
  if (!('slides' in parsed)) return parsed;
  let v: unknown = parsed.slides;
  for (let d = 0; d < 4 && typeof v === 'string'; d++) {
    const t = (v as string).trim();
    if (!t) return { ...parsed, slides: [] };
    try {
      v = JSON.parse(t);
    } catch {
      return { ...parsed, slides: [] };
    }
  }
  const slides = Array.isArray(v) ? v : [];
  return { ...parsed, slides };
}

export type ManagedSectionContentResult<T extends Record<string, unknown>> = {
  content: T;
  /** Bumps when API content is refetched — use for image cache-busting. */
  version: string;
};

/**
 * Loads content by section_key from backend and merges onto fallback values.
 * Keeps UI stable by returning fallback when API data is unavailable.
 */
export function useManagedSectionContent<T extends Record<string, unknown>>(
  sectionKey: string,
  fallback: T
): ManagedSectionContentResult<T> {
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  const [content, setContent] = useState<T>(fallback);
  const [version, setVersion] = useState('');
  const lastFetchAtRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const fetchSection = (force = false) => {
      const now = Date.now();
      if (!force && now - lastFetchAtRef.current < 30_000) {
        return;
      }
      lastFetchAtRef.current = now;

      apiClient
        .getContentSection(sectionKey)
        .then((section) => {
          if (cancelled) return;
          const fb = fallbackRef.current;
          const parsed = parseContent(section?.content);
          if (!parsed) {
            setContent(fb);
            setVersion('');
            return;
          }
          const source = sectionKey === 'hero' ? normalizeHeroSlidesField(parsed) : parsed;
          setContent({ ...fb, ...(source as Partial<T>) });
          setVersion(String(section?.updated_at ?? Date.now()));
        })
        .catch(() => {
          if (!cancelled) {
            setContent(fallbackRef.current);
            setVersion('');
          }
        });
    };

    fetchSection(true);

    const onFocus = () => fetchSection(false);
    window.addEventListener('focus', onFocus);

    const onContentUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ sectionKey?: string }>).detail;
      if (!detail?.sectionKey || detail.sectionKey === sectionKey) {
        fetchSection(true);
      }
    };
    window.addEventListener(CONTENT_UPDATED_EVENT, onContentUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      window.removeEventListener(CONTENT_UPDATED_EVENT, onContentUpdated);
    };
  }, [sectionKey]);

  return { content, version };
}
