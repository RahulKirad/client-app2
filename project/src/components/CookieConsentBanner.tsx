import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import {
  COOKIE_OPEN_EVENT,
  clearCookieConsent,
  readCookieConsent,
  saveCookieConsent,
} from '../lib/cookieConsent';

export default function CookieConsentBanner() {
  const { locale, isGermanDomain } = useI18n();
  const [visible, setVisible] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!isGermanDomain) return;
    const consent = readCookieConsent();
    if (!consent) setVisible(true);
  }, [isGermanDomain]);

  useEffect(() => {
    const onOpen = () => {
      if (!isGermanDomain) return;
      const existing = readCookieConsent();
      if (existing) {
        setAnalytics(existing.analytics);
        setMarketing(existing.marketing);
      }
      setVisible(true);
      setShowAdvanced(true);
    };
    window.addEventListener(COOKIE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_OPEN_EVENT, onOpen);
  }, [isGermanDomain]);

  if (!isGermanDomain || !visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] border-t border-stone-300 bg-white/95 backdrop-blur px-4 py-3 shadow-2xl">
      <div className="mx-auto max-w-7xl flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-700">
          {locale === 'de'
            ? 'Wir verwenden Cookies, um die Website zu verbessern. Bitte stimmen Sie der Nutzung von Cookies zu.'
            : 'We use cookies to improve your experience. Please accept cookies to continue on this domain.'}
          {' '}
          <Link to="/cookies" className="underline font-medium">
            {locale === 'de' ? 'Mehr erfahren' : 'Learn more'}
          </Link>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              saveCookieConsent({ necessary: true, analytics: false, marketing: false });
              setVisible(false);
              setShowAdvanced(false);
            }}
            className="rounded px-4 py-2 text-sm font-semibold border border-stone-400 text-stone-700 hover:bg-stone-100"
          >
            {locale === 'de' ? 'Nur notwendige' : 'Necessary only'}
          </button>
          <button
            type="button"
            onClick={() => {
              saveCookieConsent({ necessary: true, analytics: true, marketing: true });
              setVisible(false);
              setShowAdvanced(false);
            }}
            className="rounded px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--beige-700)' }}
          >
            {locale === 'de' ? 'Alle akzeptieren' : 'Accept all'}
          </button>
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="rounded px-4 py-2 text-sm font-semibold border border-stone-400 text-stone-700 hover:bg-stone-100"
          >
            {locale === 'de' ? 'Einstellungen' : 'Customize'}
          </button>
        </div>
      </div>
      {showAdvanced ? (
        <div className="mx-auto max-w-7xl mt-3 rounded border border-stone-300 bg-white p-3 text-sm">
          <div className="space-y-2">
            <label className="flex items-start gap-2">
              <input type="checkbox" checked disabled className="mt-1" />
              <span>
                <strong>{locale === 'de' ? 'Notwendige Cookies' : 'Necessary cookies'}</strong> —{' '}
                {locale === 'de' ? 'immer aktiv' : 'always active'}
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1" />
              <span><strong>{locale === 'de' ? 'Analyse' : 'Analytics'}</strong></span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1" />
              <span><strong>{locale === 'de' ? 'Marketing' : 'Marketing'}</strong></span>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                saveCookieConsent({ necessary: true, analytics, marketing });
                setVisible(false);
                setShowAdvanced(false);
              }}
              className="rounded px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: 'var(--beige-700)' }}
            >
              {locale === 'de' ? 'Auswahl speichern' : 'Save preferences'}
            </button>
            <button
              type="button"
              onClick={() => {
                clearCookieConsent();
                setAnalytics(false);
                setMarketing(false);
              }}
              className="rounded px-4 py-2 text-sm font-semibold border border-stone-400 text-stone-700 hover:bg-stone-100"
            >
              {locale === 'de' ? 'Zurücksetzen' : 'Reset'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

