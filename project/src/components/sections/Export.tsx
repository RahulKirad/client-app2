import { Globe, FileText, Languages, Shield, Download, CheckCircle, Award } from 'lucide-react';
import { useLocalizedSectionContent } from '../../hooks/useLocalizedSectionContent';
import { useI18n } from '../../contexts/I18nContext';
import { exportCopy, pickLocalized } from '../../i18n/staticSectionCopy';
import Banner from './Banner';

const exportFallback = {
  heading: 'Export & Compliance',
  subheading: 'Seamless global delivery with complete regulatory compliance',
  cta_primary: 'Download Export Pack',
  cta_secondary: 'Talk to Our Compliance Team',
  image: '/images/new/WhatsApp Image 2025-12-27 at 6.17.08 PM (2).jpeg',
};

const serviceIcons = [FileText, Shield, Languages, CheckCircle];

export default function Export() {
  const { t, effectiveLocale } = useI18n();
  const { content: sectionContent } = useLocalizedSectionContent('export', exportFallback);
  const localized = pickLocalized(effectiveLocale, exportCopy);

  const regions = localized.regions;
  const services = localized.services.map((item, index) => ({
    icon: serviceIcons[index] ?? FileText,
    title: item.title,
    description: item.description,
  }));
  const documents = localized.documents;
  const certifications = localized.certifications;

  const scrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="export" className="py-20 paper-texture" style={{ backgroundColor: '#FFFBF5' }}>
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-h2 mb-4 uppercase tracking-tight" style={{color: 'var(--heading-color)'}}>
            {String(sectionContent.heading || exportFallback.heading)}
          </h2>
          <p className="body-text-lg max-w-3xl mx-auto" style={{color: 'var(--heading-color)'}}>
            {String(sectionContent.subheading || exportFallback.subheading)}
          </p>
        </div>

        {/* Export Banner */}
        <div className="mb-12">
          <Banner
            bannerKey="export_banner"
            fallback={{
              title: effectiveLocale === 'de' ? 'Export & Compliance' : 'Export & Compliance',
              subtitle:
                effectiveLocale === 'de'
                  ? 'Nahtlose weltweite Lieferung mit vollständiger Konformität'
                  : 'Seamless global delivery with complete compliance',
              image: '/images/new/WhatsApp Image 2025-12-27 at 6.17.08 PM (2).jpeg',
            }}
            className="soft-shadow-lg"
          />
        </div>

        <div className="mb-16">
          <div className="flex items-center justify-center mb-12">
            <Globe className="mr-3" size={36} style={{color: 'var(--beige-700)'}} />
            <h3 className="text-3xl font-black text-[#78350F] uppercase tracking-wide" style={{fontFamily: 'var(--heading-font)'}}>{t('export.regionsTitle')}</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {regions.map((region, index) => (
              <div
                key={index}
                className="bg-[#F0E6D8] rounded-none p-6 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 vintage-border"
              >
                <div className="text-6xl mb-4">{region.flag}</div>
                <h4 className="text-xl font-black text-[#78350F] mb-2 uppercase tracking-wide" style={{fontFamily: 'var(--heading-font)'}}>{region.name}</h4>
                <p className="font-bold uppercase tracking-wide" style={{color: 'var(--beige-700)'}}>{region.code}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h3 className="text-3xl font-black text-[#78350F] text-center mb-12 uppercase tracking-wide" style={{fontFamily: 'var(--heading-font)'}}>{t('export.servicesTitle')}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-[#F0E6D8] rounded-none p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 vintage-border"
              >
                <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-4 beige-border" style={{backgroundColor: 'var(--beige-400)'}}>
                  <service.icon size={28} style={{color: 'var(--text-color)'}} />
                </div>
                <h4 className="text-lg font-black text-[#78350F] mb-3 uppercase tracking-wide" style={{fontFamily: 'var(--heading-font)'}}>{service.title}</h4>
                <p className="text-[#78350F] text-sm leading-relaxed font-medium" style={{fontFamily: 'var(--heading-font)'}}>{service.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 sm:p-12 shadow-2xl border border-[var(--beige-300)]">
          <h3 className="text-3xl font-black text-[#78350F] text-center mb-12 uppercase tracking-wide" style={{fontFamily: 'var(--heading-font)'}}>
            {t('export.docsTitle')}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 bg-[#F0E6D8] p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-[var(--beige-300)] group"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110" style={{backgroundColor: 'var(--beige-400)'}}>
                  <CheckCircle size={16} style={{color: '#78350F'}} />
                </div>
                <span className="text-[#78350F] font-bold text-sm uppercase tracking-wide" style={{fontFamily: 'var(--heading-font)'}}>{doc}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-8 sm:p-10 shadow-lg border border-[var(--beige-300)]" style={{backgroundColor: 'var(--beige-200)'}}>
            <div className="max-w-3xl mx-auto text-center">
              <div className="mb-6">
                <FileText className="mx-auto" size={56} style={{color: '#78350F'}} />
              </div>
              <h4 className="text-3xl font-bold mb-4" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>{t('export.exportReadyTitle')}</h4>
              <p className="mb-8 leading-relaxed text-base" style={{color: '#3a2f1f', fontFamily: 'var(--body-font)'}}>
                {t('export.exportReadyBody')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={scrollToContact}
                  className="btn-cta-primary flex items-center justify-center space-x-2"
                  style={{backgroundColor: 'var(--beige-700)', color: 'white'}}
                  aria-label="Talk to Our Compliance Team"
                >
                  <span>{String(sectionContent.cta_secondary || exportFallback.cta_secondary)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Our Certifications Section */}
        <div className="mt-12 rounded-2xl p-6 sm:p-8 soft-shadow-lg" style={{backgroundColor: 'var(--beige-50)'}}>
          <div className="flex items-center justify-center mb-8">
            <div className="p-2 rounded-full" style={{backgroundColor: 'var(--beige-200)'}}>
              <Award className="animate-bounce-subtle" size={28} style={{color: '#78350F'}} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black ml-3 uppercase tracking-wide" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>{t('export.certsTitle')}</h3>
          </div>

          {/* Certifications Cards */}
          <div className="grid sm:grid-cols-3 gap-5 mb-10">
            {certifications.slice(0, 3).map((cert, index) => (
              <div
                key={index}
                className="relative rounded-2xl p-5 shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] group overflow-hidden"
              >
                {/* Decorative Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                  style={{background: `linear-gradient(135deg, var(--beige-100) 0%, var(--beige-200) 100%)`}}
                ></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-4 rounded-xl group-hover:scale-110 transition-all duration-500 shadow-lg" 
                      style={{backgroundColor: 'var(--beige-300)'}}
                    >
                      <CheckCircle size={28} style={{color: '#78350F'}} className="group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-black text-center mb-2 group-hover:opacity-90 transition-all duration-300" 
                    style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}
                  >
                    {cert.name}
                  </h4>
                  <p className="text-center text-sm font-medium leading-relaxed" 
                    style={{color: '#5a4a3a', fontFamily: 'var(--body-font)'}}
                  >
                    {cert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Our Commitments / Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="text-center p-5 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 shadow-lg group-hover:scale-110 transition-transform duration-500" 
                style={{backgroundColor: 'var(--beige-200)'}}
              >
                <p className="text-3xl font-black animate-bounce-subtle" style={{color: '#78350F'}}>100%</p>
              </div>
              <p className="font-bold text-base mt-1" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>Organic Cotton</p>
            </div>
            
            <div className="text-center p-5 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 shadow-lg group-hover:scale-110 transition-transform duration-500" 
                style={{backgroundColor: 'var(--beige-200)'}}
              >
                <p className="text-3xl font-black animate-bounce-subtle" style={{color: '#78350F', animationDelay: '0.2s'}}>50+</p>
              </div>
              <p className="font-bold text-base mt-1" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>Countries Served</p>
            </div>
            
            <div className="text-center p-5 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 shadow-lg group-hover:scale-110 transition-transform duration-500" 
                style={{backgroundColor: 'var(--beige-200)'}}
              >
                <p className="text-3xl font-black animate-bounce-subtle" style={{color: '#78350F', animationDelay: '0.4s'}}>10K+</p>
              </div>
              <p className="font-bold text-base mt-1" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>Orders Fulfilled</p>
            </div>
            
            <div className="text-center p-5 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 shadow-lg group-hover:scale-110 transition-transform duration-500" 
                style={{backgroundColor: 'var(--beige-200)'}}
              >
                <p className="text-3xl font-black animate-bounce-subtle" style={{color: '#78350F', animationDelay: '0.6s'}}>Zero</p>
              </div>
              <p className="font-bold text-base mt-1" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>Plastic Packaging</p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid sm:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-lg shadow-md beige-border" style={{backgroundColor: 'var(--beige-100)'}}>
            <p className="text-4xl font-bold mb-2" style={{color: 'var(--beige-700)'}}>50+</p>
            <p className="font-medium" style={{color: 'var(--text-color)'}}>Countries Delivered</p>
          </div>
          <div className="text-center p-6 rounded-lg shadow-md beige-border" style={{backgroundColor: 'var(--beige-100)'}}>
            <p className="text-4xl font-bold mb-2" style={{color: 'var(--beige-700)'}}>100%</p>
            <p className="font-medium" style={{color: 'var(--text-color)'}}>Compliance Rate</p>
          </div>
          <div className="text-center p-6 rounded-lg shadow-md beige-border" style={{backgroundColor: 'var(--beige-100)'}}>
            <p className="text-4xl font-bold mb-2" style={{color: 'var(--beige-700)'}}>24h</p>
            <p className="font-medium" style={{color: 'var(--text-color)'}}>Document Processing</p>
          </div>
        </div>
      </div>
    </section>
  );
}
