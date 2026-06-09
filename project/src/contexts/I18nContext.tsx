import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { messages, type Locale } from '../i18n/messages';
import { isGermanHostname } from '../lib/germanDomain';

type Currency = 'EUR' | 'USD' | 'INR';

type I18nContextValue = {
  locale: Locale;
  /** Locale used for copy (matches user toggle; defaults to DE on cottonunique.de). */
  effectiveLocale: Locale;
  isGermanDomain: boolean;
  setLocale: (l: Locale) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  t: (key: string) => string;
  domainHint: string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function detectInitialLocale(): Locale {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('cu_locale') : null;
  if (stored === 'en' || stored === 'de') return stored;
  if (isGermanHostname()) return 'de';
  return 'en';
}

function detectInitialCurrency(locale: Locale): Currency {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('cu_currency') : null;
  if (stored === 'EUR' || stored === 'USD' || stored === 'INR') return stored;
  return locale === 'de' ? 'EUR' : 'INR';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectInitialLocale());
  const [currency, setCurrencyState] = useState<Currency>(() => detectInitialCurrency(detectInitialLocale()));

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('cu_locale', l);
    if (l === 'de') setCurrencyState('EUR');
  };

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('cu_currency', c);
  };

  const isGermanDomain = isGermanHostname();
  const effectiveLocale: Locale = locale;

  const t = (key: string) =>
    messages[effectiveLocale][key] || messages.en[key] || key;

  const domainHint =
    effectiveLocale === 'de'
      ? 'Recommended domain: https://cottonunique.de'
      : 'Recommended domain: https://cottonunique.com';

  const value = useMemo(
    () => ({
      locale,
      effectiveLocale,
      isGermanDomain,
      setLocale,
      currency,
      setCurrency,
      t,
      domainHint,
    }),
    [locale, effectiveLocale, isGermanDomain, currency]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

