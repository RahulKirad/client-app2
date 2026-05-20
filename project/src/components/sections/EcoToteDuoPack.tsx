import { CheckCircle, ShoppingBag, Package, Leaf } from 'lucide-react';
import { useManagedSectionContent } from '../../hooks/useManagedSectionContent';
import { resolveMediaUrl } from '../../lib/api';
import { ecototeDuopackDefaults, mergeEcototeContent } from '../../data/ecototeDuopackDefaults';

export default function EcoToteDuoPack() {
  const { content: sectionContent } = useManagedSectionContent(
    'ecotote_duopack',
    ecototeDuopackDefaults as unknown as Record<string, unknown>
  );
  const c = mergeEcototeContent(sectionContent);

  return (
    <section id="ecotote-duopack" className="pt-6 pb-16 sm:pt-8 sm:pb-20 bg-white relative overflow-hidden">
      <div className="w-full mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        {/* Hero Section: Image on Left, Text on Right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 md:gap-10 lg:gap-14 items-start md:items-center mb-10 sm:mb-12 md:mb-16">
          {/* Left Side - Image (fluid height + diagonal clip scales with box) */}
          <div className="relative order-1 md:order-1 w-full min-w-0">
            <div className="relative mx-auto w-full max-w-[min(100%,36rem)] md:mx-0 md:max-w-none min-h-0">
              <div className="relative flex w-full min-h-[10rem] items-center justify-center overflow-hidden rounded-2xl bg-white sm:min-h-[11rem]">
                <img
                  src={resolveMediaUrl(String(c.image || ecototeDuopackDefaults.image))}
                  alt="EcoTote DuoPack - Sustainable Garment Packaging"
                  className="mx-auto block h-auto max-h-[min(64dvh,32rem)] w-auto max-w-full object-contain sm:max-h-[min(68dvh,36rem)] md:max-h-[min(74dvh,40rem)] lg:max-h-[min(78dvh,44rem)]"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)',
                  }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  decoding="async"
                />
              </div>
            </div>
          </div>

          {/* Right Side - Hero Content */}
          <div className="space-y-5 sm:space-y-6 md:space-y-8 order-2 md:order-2 min-w-0">
            {/* Large Heading */}
            <h2
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] sm:leading-tight break-words"
              style={{ color: '#9ca3af', fontFamily: 'var(--heading-font)' }}
            >
              {c.heading}
            </h2>
            
            {/* Our Competitive Edge Section */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{color: '#1a1a1a', fontFamily: 'var(--heading-font)'}}>
                {c.subheading}
              </h3>
              <p className="body-text text-xs sm:text-sm md:text-base leading-relaxed" style={{color: '#1a1a1a', fontFamily: 'var(--body-font)'}}>
                {c.description}
              </p>
            </div>

            {/* Why Choose EcoTote DuoPack - Beige Box */}
            <div className="rounded-xl p-3 md:p-4" style={{
              background: 'linear-gradient(to bottom, rgba(245, 238, 220, 0.5), rgba(235, 220, 195, 0.4))',
              border: '1px solid rgba(235, 220, 195, 0.5)'
            }}>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2" style={{color: '#1a1a1a', fontFamily: 'var(--heading-font)'}}>
                Why Choose EcoTote DuoPack
              </h3>
              <p className="body-text text-xs sm:text-sm mb-2 md:mb-3" style={{color: '#1a1a1a', fontFamily: 'var(--body-font)'}}>
                Over 20 years of sustainable packaging experience with leading fashion brands and global exporters.
              </p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] mt-0.5 flex-shrink-0" style={{color: 'var(--beige-700)'}} />
                  <span className="body-text text-xs sm:text-sm" style={{color: '#1a1a1a', fontFamily: 'var(--body-font)'}}>
                    Zero-waste: Reusable + compostable packaging
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] mt-0.5 flex-shrink-0" style={{color: 'var(--beige-700)'}} />
                  <span className="body-text text-xs sm:text-sm" style={{color: '#1a1a1a', fontFamily: 'var(--body-font)'}}>
                    EU compliant: Plastic-free export ready
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] mt-0.5 flex-shrink-0" style={{color: 'var(--beige-700)'}} />
                  <span className="body-text text-xs sm:text-sm" style={{color: '#1a1a1a', fontFamily: 'var(--body-font)'}}>
                    Flexible MOQ: Starting from 500 units
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Specifications Section - Outer Bag and Inner Bag */}
        <div className="mb-10 sm:mb-12 md:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8 lg:gap-10 min-w-0">
            {/* Outer Bag */}
            <div className="space-y-3 md:space-y-4 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 pb-2 md:pb-3 border-b border-[var(--beige-300)]">
                <div className="p-1.5 md:p-2 rounded-lg" style={{backgroundColor: 'var(--beige-200)'}}>
                  <Package size={20} className="md:w-6 md:h-6" style={{color: 'var(--beige-700)'}} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold" style={{color: 'var(--heading-color)', fontFamily: 'var(--heading-font)'}}>
                  {c.outer_bag.title}
                </h3>
              </div>
              <div className="space-y-2 md:space-y-2.5">
                <div className="flex items-start gap-2 md:gap-2.5">
                  <CheckCircle size={16} className="md:w-[18px] md:h-[18px] mt-0.5 flex-shrink-0" style={{color: 'var(--beige-700)'}} />
                  <span className="body-text text-xs sm:text-sm">
                    <strong>Material:</strong> {c.outer_bag.material}
                  </span>
                </div>
                <div className="flex items-start gap-2 md:gap-2.5">
                  <CheckCircle size={16} className="md:w-[18px] md:h-[18px] mt-0.5 flex-shrink-0" style={{color: 'var(--beige-700)'}} />
                  <span className="body-text text-xs sm:text-sm">
                    <strong>Size:</strong> {c.outer_bag.size}
                  </span>
                </div>
                <div className="flex items-start gap-2 md:gap-2.5">
                  <CheckCircle size={16} className="md:w-[18px] md:h-[18px] mt-0.5 flex-shrink-0" style={{color: 'var(--beige-700)'}} />
                  <span className="body-text text-xs sm:text-sm">
                    <strong>Printing:</strong> {c.outer_bag.printing}
                  </span>
                </div>
                <div className="flex items-start gap-2 md:gap-2.5">
                  <CheckCircle size={16} className="md:w-[18px] md:h-[18px] mt-0.5 flex-shrink-0" style={{color: 'var(--beige-700)'}} />
                  <span className="body-text text-xs sm:text-sm">
                    <strong>Certification:</strong> {c.outer_bag.certification}
                  </span>
                </div>
              </div>
            </div>

            {/* Inner Bag */}
            <div className="space-y-3 md:space-y-4 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 pb-2 md:pb-3 border-b border-[var(--beige-300)]">
                <div className="p-1.5 md:p-2 rounded-lg" style={{backgroundColor: 'var(--beige-200)'}}>
                  <Leaf size={20} className="md:w-6 md:h-6" style={{color: 'var(--beige-700)'}} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold" style={{color: 'var(--heading-color)', fontFamily: 'var(--heading-font)'}}>
                  {c.inner_bag.title}
                </h3>
              </div>
              <div className="space-y-2 md:space-y-2.5">
                <div className="flex items-start gap-2 md:gap-2.5">
                  <CheckCircle size={16} className="md:w-[18px] md:h-[18px] mt-0.5 flex-shrink-0" style={{color: 'var(--beige-700)'}} />
                  <span className="body-text text-xs sm:text-sm">
                    <strong>Material:</strong> {c.inner_bag.material}
                  </span>
                </div>
                <div className="flex items-start gap-2 md:gap-2.5">
                  <CheckCircle size={16} className="md:w-[18px] md:h-[18px] mt-0.5 flex-shrink-0" style={{color: 'var(--beige-700)'}} />
                  <span className="body-text text-xs sm:text-sm">
                    <strong>Size:</strong> {c.inner_bag.size}
                  </span>
                </div>
                <div className="flex items-start gap-2 md:gap-2.5">
                  <CheckCircle size={16} className="md:w-[18px] md:h-[18px] mt-0.5 flex-shrink-0" style={{color: 'var(--beige-700)'}} />
                  <span className="body-text text-xs sm:text-sm">
                    <strong>Finish:</strong> {c.inner_bag.finish}
                  </span>
                </div>
                <div className="flex items-start gap-2 md:gap-2.5">
                  <CheckCircle size={16} className="md:w-[18px] md:h-[18px] mt-0.5 flex-shrink-0" style={{color: 'var(--beige-700)'}} />
                  <span className="body-text text-xs sm:text-sm">
                    <strong>Certification:</strong> {c.inner_bag.certification}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center px-1">
          <button
            onClick={() => {
              const element = document.querySelector('#contact');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="btn-cta-primary inline-flex w-full max-w-md sm:w-auto mx-auto px-5 sm:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg rounded-lg transition-all duration-300 justify-center"
            style={{backgroundColor: 'var(--beige-700)', color: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'}}
            onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = 'var(--beige-800)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)'}}
            onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'var(--beige-700)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'}}
          >
            <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
            <span>{c.cta}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
