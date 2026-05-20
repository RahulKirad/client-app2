import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll position after route changes. Plain navigations go to top; when the URL
 * has a hash (e.g. /#contact), scroll to that element after the next route’s DOM
 * exists — retries cover sibling effect order and slightly late mounts.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    const id = decodeURIComponent(hash.replace(/^#/, ''));
    if (!id) {
      window.scrollTo(0, 0);
      return;
    }

    let cleaned = false;
    let scrolledToTarget = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const tryScrollToHash = () => {
      if (cleaned) return;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        scrolledToTarget = true;
      }
    };

    for (const delay of [0, 50, 120, 250, 450]) {
      timeouts.push(window.setTimeout(tryScrollToHash, delay));
    }

    timeouts.push(
      window.setTimeout(() => {
        if (cleaned || scrolledToTarget) return;
        window.scrollTo(0, 0);
      }, 600)
    );

    return () => {
      cleaned = true;
      timeouts.forEach(clearTimeout);
    };
  }, [pathname, hash]);

  return null;
}
