export type CookieConsent = {
  version: string;
  timestamp: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

export const COOKIE_CONSENT_KEY = 'cu_cookie_consent_v2';
export const COOKIE_CONSENT_VERSION = '2026-05-28';
export const COOKIE_OPEN_EVENT = 'cu:open-cookie-settings';

export function readCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (
      !parsed ||
      parsed.necessary !== true ||
      typeof parsed.analytics !== 'boolean' ||
      typeof parsed.marketing !== 'boolean' ||
      typeof parsed.timestamp !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCookieConsent(consent: Omit<CookieConsent, 'timestamp' | 'version'>) {
  const payload: CookieConsent = {
    version: COOKIE_CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    ...consent,
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('cu:cookie-consent-updated', { detail: payload }));
}

export function clearCookieConsent() {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  window.dispatchEvent(new CustomEvent('cu:cookie-consent-updated', { detail: null }));
}

