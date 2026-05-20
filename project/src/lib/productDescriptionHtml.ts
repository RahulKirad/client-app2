import DOMPurify from 'dompurify';

const SANITIZE_OPTIONS: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'h1',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'a',
    'blockquote',
    'span',
    'div',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
};

/** Detect stored rich HTML (Quill outputs tags like `<p>`). */
export function isLikelyRichHtml(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return /<[a-z][\s\S]*>/i.test(value.trim());
}

export function sanitizeProductDescriptionHtml(html: string): string {
  return DOMPurify.sanitize(html || '', SANITIZE_OPTIONS);
}

/** Strip tags for search, list previews, and plain snippets (SSR-safe). */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when editor content is effectively empty (Quill often sends `<p><br></p>`). */
export function isQuillDescriptionEmpty(html: string | null | undefined): boolean {
  return htmlToPlainText(html).length === 0;
}
