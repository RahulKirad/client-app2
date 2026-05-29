import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { IMG } from '../lib/imageSizes';
import { apiClient } from '../lib/api';
import { useI18n } from '../contexts/I18nContext';
import LanguageToggle from './LanguageToggle';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const isHomePage = location.pathname === '/';
  const [showLanguageToggle, setShowLanguageToggle] = useState(false);

  useEffect(() => {
    const cacheKey = 'cu_site_settings_v1';
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { languageToggleEnabled?: boolean; at?: number };
        if (parsed.at && Date.now() - parsed.at < 5 * 60 * 1000) {
          setShowLanguageToggle(!!parsed.languageToggleEnabled);
          return;
        }
      } catch {
        /* ignore */
      }
    }
    apiClient
      .getSiteSettings()
      .then((s) => {
        setShowLanguageToggle(s.languageToggleEnabled);
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ languageToggleEnabled: s.languageToggleEnabled, at: Date.now() })
        );
      })
      .catch(() => setShowLanguageToggle(false));
  }, []);

  const navLinks = [
    { name: t('nav.home'), path: '#home', route: '/' },
    { name: t('nav.about'), path: '#about', route: '/' },
    { name: t('nav.products'), path: '#products-list', route: '/products' },
    { name: t('nav.corporate'), path: '#corporate', route: '/' },
    { name: t('nav.sustainability'), path: '#sustainability', route: '/' },
    { name: t('nav.export'), path: '#export', route: '/' },
    { name: t('nav.contact'), path: '#contact', route: '/' },
  ];

  const scrollToSection = (path: string, route?: string) => {
    setIsMenuOpen(false);

    // Standalone routes (e.g. /products) — not home hash sections
    if (route && route !== '/') {
      const url = path.startsWith('#') ? `${route}${path}` : route;
      navigate(url);
      if (path.startsWith('#')) {
        setTimeout(() => {
          document.querySelector(path)?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
      return;
    }

    // If we're not on the home page and trying to navigate to a home page section
    if (!isHomePage && route === '/') {
      // Navigate to home page first, clearing any hash
      navigate(route || '/', { replace: true });
      // Wait for navigation and component mount, then scroll
      setTimeout(() => {
        const element = document.querySelector(path);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          // If element not found immediately, try again after a longer delay
          setTimeout(() => {
            const retryElement = document.querySelector(path);
            if (retryElement) {
              retryElement.scrollIntoView({ behavior: 'smooth' });
            }
          }, 300);
        }
      }, 150);
    } else if (isHomePage) {
      // We're on home page, just scroll
      const element = document.querySelector(path);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // For other routes, just navigate
      if (route) {
        navigate(route);
      }
    }
  };

  return (
    <header
      className="fixed w-full top-0 z-50 transition-all duration-300 animate-fade-in"
      style={{
        fontFamily: 'var(--body-font)',
        background: 'linear-gradient(to bottom, #ffffff, var(--beige-100))',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
          <div
            className="flex items-center min-w-0 cursor-pointer group"
            onClick={() => scrollToSection('#home', '/')}
            onKeyDown={(e) => e.key === 'Enter' && scrollToSection('#home', '/')}
            role="button"
            tabIndex={0}
            aria-label="Cottonunique home"
          >
            <img
              src="/images/logo/logo.png"
              alt="Cottonunique - Premium sustainable tote bags"
              className="h-12 sm:h-14 md:h-20 w-auto max-h-20 transform group-hover:scale-110 transition-transform duration-300"
              width={IMG.logo.width}
              height={IMG.logo.height}
              loading="lazy"
            />
          </div>

          <nav className="hidden lg:flex items-center space-x-6" aria-label="Main navigation">
            {navLinks.map((link, index) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.path, link.route)}
                className="text-[var(--text-color)] hover:text-[var(--beige-700)] font-medium text-sm transition-all duration-200 relative group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s`, fontFamily: 'var(--body-font)' }}
                aria-label={`Go to ${link.name}`}
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 bg-[var(--beige-600)]" aria-hidden />
              </button>
            ))}
            <button
              onClick={() => scrollToSection('#contact')}
              className="px-6 py-2.5 rounded transition-all duration-200 flex items-center space-x-2 font-medium text-sm"
              style={{ backgroundColor: 'var(--beige-400)', color: 'var(--text-color)', fontFamily: 'var(--body-font)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--beige-500)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--beige-400)')}
              aria-label="Get a quote - go to contact"
            >
              <ShoppingBag size={18} aria-hidden />
              <span>{t('nav.getQuote')}</span>
            </button>
            {showLanguageToggle ? <LanguageToggle /> : null}
          </nav>

          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-[var(--beige-100)] transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} style={{ color: 'var(--text-color)' }} aria-hidden /> : <Menu size={24} style={{ color: 'var(--text-color)' }} aria-hidden />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden border-t border-[var(--beige-200)]" style={{ background: 'linear-gradient(to bottom, #ffffff, var(--beige-100))', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <nav className="px-4 pt-4 pb-6 space-y-3" aria-label="Mobile menu">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.path, link.route)}
                className="block w-full text-left px-4 py-3 text-[var(--text-color)] hover:bg-[var(--beige-100)] hover:text-[var(--beige-700)] rounded-lg transition-all duration-200 font-medium text-sm"
                style={{fontFamily: 'var(--body-font)'}}
              >
                {link.name}
              </button>
            ))}
            <button
              onClick={() => scrollToSection('#contact')}
              className="w-full bg-[var(--beige-400)] text-[var(--text-color)] px-6 py-3 rounded hover:bg-[var(--beige-500)] transition-all duration-200 flex items-center justify-center space-x-2 font-medium text-sm"
              style={{fontFamily: 'var(--body-font)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'}}
            >
              <ShoppingBag size={18} />
              <span>{t('nav.getQuote')}</span>
            </button>
            {showLanguageToggle ? (
              <div className="flex justify-end pt-2">
                <LanguageToggle />
              </div>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
