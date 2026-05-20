import { useManagedSectionContent } from '../../hooks/useManagedSectionContent';
import { resolveMediaUrl } from '../../lib/api';
import InternalAppLink from '../InternalAppLink';

interface BannerProps {
  bannerKey: 'main_banner' | 'about_banner' | 'corporate_banner' | 'sustainability_banner' | 'export_banner';
  fallback: {
    title: string;
    subtitle: string;
    description?: string;
    image: string;
    cta_text?: string;
    cta_link?: string;
  };
  className?: string;
  showCTA?: boolean;
}

const bannersFallback = {
  main_banner: {
    title: 'Premium Sustainable Tote Bags',
    subtitle: 'Eco-friendly solutions for global commerce',
    description: 'GOTS-certified cotton totes designed for businesses worldwide',
    image: '/images/banner/baner5.png',
    cta_text: 'Explore Products',
    cta_link: '/#products',
  },
  about_banner: {
    title: 'About Our Mission',
    subtitle: 'Sustainable craftsmanship meets global standards',
    image: '/images/aboutus/about1.png',
  },
  corporate_banner: {
    title: 'Corporate Solutions',
    subtitle: 'Custom branding for global teams',
    image: '/images/corporate/image2.png',
  },
  sustainability_banner: {
    title: 'Sustainability First',
    subtitle: 'Every product tells a story of positive impact',
    image: '/images/new/WhatsApp Image 2025-12-27 at 6.17.05 PM.jpeg',
  },
  export_banner: {
    title: 'Export & Compliance',
    subtitle: 'Seamless global delivery with complete compliance',
    image: '/images/new/WhatsApp Image 2025-12-27 at 6.17.08 PM (2).jpeg',
  },
};

export default function Banner({ bannerKey, fallback, className = '', showCTA = false }: BannerProps) {
  const { content: bannersContent } = useManagedSectionContent('banners', bannersFallback);
  const bannerData = bannersContent[bannerKey] || fallback;

  return (
    <div className={`relative h-64 md:h-96 rounded-lg overflow-hidden ${className}`}>
      <img
        src={resolveMediaUrl(String(bannerData.image || fallback.image))}
        alt={String(bannerData.title || fallback.title)}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 text-white">
        <h3 className="text-xl sm:text-3xl md:text-4xl font-black mb-2 uppercase tracking-wide" style={{fontFamily: 'var(--heading-font)'}}>
          {String(bannerData.title || fallback.title)}
        </h3>
        <p className="text-sm sm:text-lg font-medium mb-2" style={{fontFamily: 'var(--heading-font)'}}>
          {String(bannerData.subtitle || fallback.subtitle)}
        </p>
        {bannerData.description && (
          <p className="text-sm opacity-90 mb-4 max-w-2xl">
            {String(bannerData.description)}
          </p>
        )}
        {showCTA && bannerData.cta_text && bannerData.cta_link && (
          <InternalAppLink
            href={String(bannerData.cta_link)}
            className="inline-flex items-center px-6 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-200"
          >
            {String(bannerData.cta_text)}
          </InternalAppLink>
        )}
      </div>
    </div>
  );
}