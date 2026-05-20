/** Parse content column (JSON object or string, possibly double-encoded). */
export function parseContentColumn(raw: unknown): Record<string, unknown> | null {
  let parsed: unknown = raw;
  for (let depth = 0; depth < 4 && typeof parsed === 'string'; depth++) {
    const s = parsed.trim();
    if (!s) return null;
    try {
      parsed = JSON.parse(s);
    } catch {
      return null;
    }
  }
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null;
}

/** Hero `slides` may be an array or a JSON string (hosted DBs / legacy imports). */
export function coerceHeroSlidesArray(raw: unknown): Record<string, unknown>[] {
  let v: unknown = raw;
  for (let depth = 0; depth < 4 && typeof v === 'string'; depth++) {
    const s = (v as string).trim();
    if (!s) return [];
    try {
      v = JSON.parse(s);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(v)) return [];
  return v
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({ ...(item as Record<string, unknown>) }));
}

export function normalizeHeroContent(content: Record<string, unknown>): Record<string, unknown> {
  const slides = coerceHeroSlidesArray(content.slides);
  return { ...content, slides };
}

export function normalizeSectionContent(
  sectionKey: string,
  content: Record<string, unknown>
): Record<string, unknown> {
  if (sectionKey === 'hero') return normalizeHeroContent(content);
  return content;
}
