import { sanitizeProductDescriptionHtml, isLikelyRichHtml } from '../lib/productDescriptionHtml';

type Props = {
  description: string | null | undefined;
  /** Tailwind / extra classes for the outer wrapper */
  className?: string;
  /** When true, render legacy plain text with preserved newlines */
  plainTextClassName?: string;
};

/**
 * Renders product description: sanitized HTML when stored as rich text,
 * otherwise plain text (backward compatible with old DB rows).
 */
const defaultRichClass =
  'rich-product-desc max-w-none text-slate-700 leading-relaxed ' +
  '[&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 ' +
  '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic ' +
  '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 ' +
  '[&_a]:text-emerald-700 [&_a]:underline hover:[&_a]:text-emerald-900';

export default function RichProductDescription({
  description,
  className = defaultRichClass,
  plainTextClassName = 'text-slate-700 leading-relaxed whitespace-pre-wrap',
}: Props) {
  const raw = description ?? '';
  if (!raw.trim()) return null;

  if (isLikelyRichHtml(raw)) {
    return (
      <div
        className={`rich-product-desc ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizeProductDescriptionHtml(raw) }}
      />
    );
  }

  return <p className={plainTextClassName}>{raw}</p>;
}
