import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import RichProductDescription from './RichProductDescription';

type Props = {
  description: string | null | undefined;
  /** Max height when collapsed (Tailwind max-h-*). Default ~18rem */
  collapsedMaxClassName?: string;
};

/**
 * Long descriptions: clamp height with a fade, then "Read more" reveals the rest below.
 * "Read less" restores the clamp.
 */
export default function ExpandableRichProductDescription({
  description,
  collapsedMaxClassName = 'max-h-[18rem]',
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap || expanded) return;
    const inner = wrap.firstElementChild as HTMLElement | null;
    if (!inner) {
      setCanExpand(false);
      return;
    }
    setCanExpand(inner.scrollHeight > wrap.clientHeight + 2);
  }, [expanded]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const run = () => measure();
    run();
    const raf = requestAnimationFrame(run);

    if (expanded) {
      return () => cancelAnimationFrame(raf);
    }

    const ro = new ResizeObserver(run);
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [description, expanded, measure]);

  useEffect(() => {
    setExpanded(false);
  }, [description]);

  const raw = description ?? '';
  if (!raw.trim()) return null;

  return (
    <div className="expandable-product-desc">
      <div
        ref={wrapRef}
        className={
          expanded
            ? 'relative'
            : `relative overflow-hidden ${collapsedMaxClassName}`
        }
      >
        <RichProductDescription description={description} />
        {!expanded && canExpand ? (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-white via-white/90 to-transparent"
            aria-hidden
          />
        ) : null}
      </div>
      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 text-sm font-semibold underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
          style={{ color: 'var(--beige-700)' }}
          aria-expanded={expanded}
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      ) : null}
    </div>
  );
}
