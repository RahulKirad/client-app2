import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLocalizedSectionContent } from '../hooks/useLocalizedSectionContent';
import { IMG } from '../lib/imageSizes';
import { useI18n } from '../contexts/I18nContext';
import { MAIN_CONTACT_EMAIL } from '../lib/brand';

const FOOTER_HEADING =
  'mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white sm:mb-3 sm:text-xs lg:text-sm';
const FOOTER_LINK =
  'inline-block text-xs font-medium text-white/85 transition-colors duration-200 hover:text-[#FBBF24] sm:text-sm';

function FooterColumn({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <h3 className={FOOTER_HEADING} style={{ fontFamily: 'var(--heading-font)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function Footer() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();
  const contactFallback = {
    email_primary: MAIN_CONTACT_EMAIL,
    phone: '+91 7020631149',
  };
  const { content: contactInfo } = useLocalizedSectionContent('contact', contactFallback);
  const email = String(contactInfo.email_primary || contactFallback.email_primary);
  const phone = String(contactInfo.phone || contactFallback.phone);

  const quickLinks = [
    { name: t('nav.about'), href: '/#about' },
    { name: t('nav.products'), href: '/#products' },
    { name: t('nav.corporate'), href: '/#corporate' },
    { name: t('nav.sustainability'), href: '/#sustainability' },
  ];

  const certifications = [
    t('footer.cert.gots'),
    t('footer.cert.fsc'),
    t('footer.cert.msme'),
    t('footer.cert.export'),
  ];

  return (
    <footer
      className="relative overflow-hidden text-white paper-texture"
      style={{ backgroundColor: '#A9927A' }}
    >
      <div
        className="pointer-events-none absolute top-0 right-0 hidden h-64 w-64 rounded-full opacity-20 blur-3xl sm:block animate-float-slow"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 hidden h-80 w-80 rounded-full opacity-15 blur-3xl sm:block animate-float-slow"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', animationDelay: '2s' }}
      />

      <div className="relative z-10 mx-auto min-w-0 max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:gap-x-8 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-0">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <img
              src="/images/logo/logo.png"
              alt="Cottonunique Logo"
              className="mb-2.5 h-9 w-auto border-2 border-white bg-white p-1 sm:mb-3 sm:h-11 lg:h-12"
              width={IMG.logo.width}
              height={IMG.logo.height}
              loading="lazy"
            />
            <p
              className="max-w-sm text-xs leading-relaxed text-white/90 sm:text-sm"
              style={{ fontFamily: 'var(--body-font)' }}
            >
              {t('footer.tagline')}
            </p>
          </div>

          {/* Quick links */}
          <FooterColumn title={t('footer.quickLinks')}>
            <ul className="space-y-1.5 sm:space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className={FOOTER_LINK}
                    style={{ fontFamily: 'var(--body-font)' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterColumn>

          {/* Certifications */}
          <FooterColumn title={t('footer.certifications')}>
            <ul className="space-y-1.5 sm:space-y-2">
              {certifications.map((cert) => (
                <li key={cert} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full sm:mt-2"
                    style={{ backgroundColor: '#FBBF24' }}
                    aria-hidden
                  />
                  <span
                    className="text-xs leading-snug text-white/85 sm:text-sm sm:leading-relaxed"
                    style={{ fontFamily: 'var(--body-font)' }}
                  >
                    {cert}
                  </span>
                </li>
              ))}
            </ul>
          </FooterColumn>

          {/* Contact */}
          <FooterColumn title={t('footer.contactInfo')} className="col-span-2 lg:col-span-1">
            <ul className="flex flex-col gap-2 sm:gap-2.5">
              <li className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Mail size={15} className="text-[#FBBF24]" aria-hidden />
                </span>
                <a
                  href={`mailto:${email}`}
                  className={`${FOOTER_LINK} break-all`}
                  style={{ fontFamily: 'var(--body-font)' }}
                >
                  {email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Phone size={15} className="text-[#FBBF24]" aria-hidden />
                </span>
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className={FOOTER_LINK}
                  style={{ fontFamily: 'var(--body-font)' }}
                >
                  {phone}
                </a>
              </li>
            </ul>
          </FooterColumn>
        </div>

        <p
          className="mt-6 border-t border-white/20 pt-5 text-xs leading-relaxed text-white/70 sm:mt-8 sm:text-sm lg:mt-10"
          style={{ fontFamily: 'var(--body-font)' }}
        >
          {t('footer.wholesale')}
        </p>

        <div className="mt-4 flex flex-col gap-2 border-t border-white/20 pt-4 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-5 lg:mt-6">
          <p
            className="text-[11px] text-white/85 sm:text-xs lg:text-sm"
            style={{ fontFamily: 'var(--body-font)' }}
          >
            © {currentYear} Cottonunique. {t('footer.rights')}
          </p>
          <Link
            to="/privacy"
            className={`${FOOTER_LINK} text-[11px] sm:text-xs lg:text-sm`}
            style={{ fontFamily: 'var(--body-font)' }}
          >
            {t('footer.privacy')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
