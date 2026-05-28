import { Link, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageSeo from '../components/PageSeo';
import { buildTitle, truncateMeta } from '../lib/seo';
import { useI18n } from '../contexts/I18nContext';

type LegalKind = 'impressum' | 'privacy' | 'cookies' | 'withdrawal' | 'terms' | 'shipping';

const legalMap: Record<LegalKind, { en: string; de: string }> = {
  impressum: { en: 'Impressum', de: 'Impressum' },
  privacy: { en: 'Privacy Policy', de: 'Datenschutzerklärung' },
  cookies: { en: 'Cookie Policy', de: 'Cookie-Richtlinie' },
  withdrawal: { en: 'Right of Withdrawal', de: 'Widerrufsrecht' },
  terms: { en: 'Terms & Conditions', de: 'AGB' },
  shipping: { en: 'Shipping Policy', de: 'Versandinformationen' },
};

function kindFromPath(path: string): LegalKind {
  if (path.includes('/impressum')) return 'impressum';
  if (path.includes('/cookies')) return 'cookies';
  if (path.includes('/shipping')) return 'shipping';
  if (path.includes('/widerruf')) return 'withdrawal';
  if (path.includes('/agb')) return 'terms';
  return 'privacy';
}

export default function LegalPage() {
  const { pathname } = useLocation();
  const { locale } = useI18n();
  const kind = kindFromPath(pathname);
  const heading = legalMap[kind][locale];
  const title = buildTitle(heading);
  const description = truncateMeta(
    locale === 'de'
      ? `${heading} für den Online-Shop von Cottonunique mit Platzhaltern für Unternehmensangaben und rechtliche Pflichtinformationen.`
      : `${heading} for Cottonunique ecommerce store including placeholders for business and legal details.`,
    160
  );

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <PageSeo title={title} description={description} />
      <Header />
      <main className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--heading-color)', fontFamily: 'var(--heading-font)' }}>
            {heading}
          </h1>
          <p className="text-sm text-[var(--text-color)] mb-8" style={{ fontFamily: 'var(--body-font)' }}>
            {locale === 'de' ? 'Stand:' : 'Last updated:'} {new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-IN')}
          </p>
          <div className="prose prose-lg max-w-none space-y-4" style={{ fontFamily: 'var(--body-font)', color: '#3a2f1f' }}>
            {kind === 'cookies' ? (
              <>
                <p>
                  {locale === 'de'
                    ? 'Diese Website verwendet notwendige Cookies sowie – nach Ihrer Einwilligung – Analyse- und Marketing-Cookies.'
                    : 'This website uses necessary cookies and, subject to your consent, analytics and marketing cookies.'}
                </p>
                <ul>
                  <li>{locale === 'de' ? 'Notwendig: Sitzungsfunktion, Sicherheit und grundlegende Navigation (immer aktiv).' : 'Necessary: session, security, and core navigation (always active).'}</li>
                  <li>{locale === 'de' ? 'Analyse: Reichweitenmessung und Leistungsanalyse (optional).' : 'Analytics: usage and performance measurement (optional).'}</li>
                  <li>{locale === 'de' ? 'Marketing: Personalisierung und Kampagnenmessung (optional).' : 'Marketing: personalization and campaign attribution (optional).'}</li>
                  <li>{locale === 'de' ? 'Sie können Ihre Einwilligung jederzeit ändern oder widerrufen.' : 'You can change or withdraw consent at any time.'}</li>
                </ul>
              </>
            ) : (
              <>
                <p>
                  {locale === 'de'
                    ? 'Hinweis: Bitte ersetzen Sie die folgenden Platzhalter durch die rechtlich geprüften Unternehmensdaten.'
                    : 'Note: Replace placeholders below with legally reviewed business information.'}
                </p>
                <ul>
                  <li>{locale === 'de' ? 'Firmenname: [Ihr Unternehmen]' : 'Company name: [Cotton Unique]'}</li>
                  <li>{locale === 'de' ? 'Adresse: [Straße, PLZ, Stadt, Land]' : 'Address: [Street, ZIP, City, Country]'}</li>
                  <li>{locale === 'de' ? 'Vertretungsberechtigte Person: [Name]' : 'Authorized representative: [Name]'}</li>
                  <li>{locale === 'de' ? 'Kontakt: [E-Mail], [Telefon]' : 'Contact: [Email], [Phone]'}</li>
                  <li>{locale === 'de' ? 'USt-IdNr.: [VAT ID]' : 'VAT ID: [VAT ID]'}</li>
                  <li>{locale === 'de' ? 'Registereintrag: [Handelsregister]' : 'Commercial register: [Registry details]'}</li>
                </ul>
              </>
            )}
          </div>
          <p className="mt-12">
            <Link to="/" className="font-medium underline" style={{ color: '#78350F' }}>
              {locale === 'de' ? '← Zurück zur Startseite' : '← Back to home'}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

