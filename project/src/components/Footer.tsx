import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { useLocalizedSectionContent } from '../hooks/useLocalizedSectionContent';
import { IMG } from '../lib/imageSizes';
import { useI18n } from '../contexts/I18nContext';

export default function Footer() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();
  const contactFallback = {
    email_primary: 'abhishek.deolalikar@gmail.com',
    phone: '+91 7020631149',
  };
  const { content: contactInfo } = useLocalizedSectionContent('contact', contactFallback);

  return (
    <footer
      className="text-white paper-texture relative overflow-hidden"
      style={{ backgroundColor: '#A9927A' }}
    >
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 animate-float-slow" style={{backgroundColor: 'rgba(255, 255, 255, 0.1)'}}></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-15 animate-float-slow" style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', animationDelay: '2s'}}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 min-w-0">
          <div className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center mb-4 group">
              <img
                src="/images/logo/logo.png"
                alt="Cottonunique Logo"
                className="h-14 w-auto bg-white rounded-none p-1.5 border-2 border-white transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                width={IMG.logo.width}
                height={IMG.logo.height}
                loading="lazy"
              />
            </div>
            <p className="text-white/90 text-sm leading-relaxed font-medium" style={{fontFamily: 'var(--heading-font)'}}>
              {t('footer.tagline')}
            </p>
          </div>

          <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <h3 className="font-black text-lg mb-4 text-white uppercase tracking-wide transform transition-all duration-300 hover:translate-x-2" style={{fontFamily: 'var(--heading-font)'}}>{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              {[
                { name: t('nav.about'), href: '/#about' },
                { name: t('nav.products'), href: '/#products' },
                { name: t('nav.corporate'), href: '/#corporate' },
                { name: t('nav.sustainability'), href: '/#sustainability' }
              ].map((link, index) => (
                <li key={link.name} className="transform transition-all duration-300 hover:translate-x-2" style={{animationDelay: `${0.3 + index * 0.1}s`}}>
                  <Link 
                    to={link.href} 
                    className="text-white/90 hover:text-[#FBBF24] transition-all duration-300 font-medium uppercase tracking-wide inline-block relative group" 
                    style={{fontFamily: 'var(--heading-font)'}}
                  >
                    {link.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FBBF24] group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <h3 className="font-black text-lg mb-4 text-white uppercase tracking-wide transform transition-all duration-300 hover:translate-x-2" style={{fontFamily: 'var(--heading-font)'}}>{t('footer.certifications')}</h3>
            <ul className="space-y-2 text-white/90">
              {[
                t('footer.cert.gots'),
                t('footer.cert.fsc'),
                t('footer.cert.msme'),
                t('footer.cert.export')
              ].map((cert, index) => (
                <li 
                  key={cert} 
                  className="flex items-center space-x-2 transform transition-all duration-300 hover:translate-x-2 group" 
                  style={{animationDelay: `${0.4 + index * 0.1}s`}}
                >
                  <span className="w-2 h-2 rounded-full transform transition-all duration-300 group-hover:scale-150 group-hover:shadow-lg" style={{backgroundColor: 'var(--beige-600)'}}></span>
                  <span className="font-medium uppercase tracking-wide" style={{fontFamily: 'var(--body-font)'}}>{cert}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <h3 className="font-black text-lg mb-4 text-white uppercase tracking-wide transform transition-all duration-300 hover:translate-x-2" style={{fontFamily: 'var(--heading-font)'}}>{t('footer.contactInfo')}</h3>
            <ul className="space-y-3 text-white/90">
              <li className="flex items-start space-x-2 group transform transition-all duration-300 hover:translate-x-2">
                <Mail size={18} className="mt-1 flex-shrink-0 text-[#FBBF24] transform transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" />
                <span className="text-sm font-medium break-all" style={{fontFamily: 'var(--heading-font)'}}>
                  {String(contactInfo.email_primary || contactFallback.email_primary)}
                </span>
              </li>
              <li className="flex items-start space-x-2 group transform transition-all duration-300 hover:translate-x-2">
                <Phone size={18} className="mt-1 flex-shrink-0 text-[#FBBF24] transform transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" />
                <span className="text-sm font-medium" style={{fontFamily: 'var(--heading-font)'}}>
                  {String(contactInfo.phone || contactFallback.phone)}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <p
          className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-4xl mb-8 animate-fade-in-up"
          style={{ fontFamily: 'var(--body-font)' }}
        >
          {t('footer.wholesale')}
        </p>

        <div className="border-t-2 border-white/30 pt-8 flex flex-col md:flex-row justify-between items-center animate-fade-in-up" style={{animationDelay: '0.6s'}}>
          <p className="text-white/90 text-sm font-medium transform transition-all duration-300 hover:scale-105" style={{fontFamily: 'var(--heading-font)'}}>
            © {currentYear} Cottonunique. {t('footer.rights')}
          </p>
          <div className="flex flex-wrap gap-4 mt-4 md:mt-0 justify-center md:justify-end">
            <Link 
              to="/privacy" 
              className="text-white/90 hover:text-[#FBBF24] text-sm transition-all duration-300 font-medium uppercase tracking-wide transform hover:scale-110 relative group" 
              style={{fontFamily: 'var(--heading-font)'}}
            >
              {t('footer.privacy')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FBBF24] group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
