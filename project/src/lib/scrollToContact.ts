import type { NavigateFunction } from 'react-router-dom';

const RETRY_DELAYS_MS = [0, 80, 180, 350, 550] as const;

/**
 * Go to the main page with #contact and scroll the contact section into view.
 * Uses delayed retries so scrolling works after the home route DOM mounts.
 */
export function goToHomeContactSection(navigate: NavigateFunction): void {
  navigate({ pathname: '/', hash: 'contact' });
  for (const ms of RETRY_DELAYS_MS) {
    window.setTimeout(() => {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, ms);
  }
}
