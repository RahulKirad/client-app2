import { useState, useEffect, type ImgHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocalizedSectionContent } from '../../hooks/useLocalizedSectionContent';
import { useI18n } from '../../contexts/I18nContext';
import { resolveMediaUrl } from '../../lib/api';
import { IMG } from '../../lib/imageSizes';

const heroContentFallback = {
  headline: 'Where intelligent design meets ethical craftsmanship',
  subheadline: 'Smart. Sustainable. Global.',
  cta_primary: 'Contact Us',
  cta_secondary: 'View Products',
  slides: [
    {
      title: 'ECOTOTE DUOPACK',
      subtitle: 'Sustainable Packaging',
      description: 'Reusable Cotton Tote + Compostable Inner Bag. Plastic-free packaging for fashion brands and exporters.',
      image: '/images/banner/baner5.png',
      badge: 'Premium. Sustainable. Zero-Waste.',
    },
    {
      title: 'FLORAL ELEGANCE',
      subtitle: 'Premium Canvas Totes',
      description: 'Beautiful cream canvas tote bags featuring vibrant floral designs. Perfect blend of style and sustainability for your everyday needs.',
      image: '/images/banner/baner1.jpeg',
      badge: 'Elegant. Stylish. Sustainable.',
    },
    {
      title: 'FIND JOY',
      subtitle: 'In The Ordinary',
      description: 'Light beige canvas tote with cheerful bee design. Spread positivity and joy with our beautifully crafted, eco-friendly tote bags.',
      image: '/images/banner/baner2.jpeg',
      badge: 'Joyful. Inspiring. Eco-Friendly.',
    },
    {
      title: 'WATERCOLOR COLLECTION',
      subtitle: 'Artistic Designs',
      description: 'Stunning watercolor floral prints on premium canvas. Each tote is a work of art, combining functionality with beautiful aesthetics.',
      image: '/images/banner/baner3.jpeg',
      badge: 'Artistic. Unique. Premium.',
    },
    {
      title: 'SUNFLOWER EMBROIDERED',
      subtitle: 'Handcrafted Excellence',
      description: 'Exquisite embroidered sunflower design on natural canvas. Handcrafted with attention to detail for a truly special tote bag.',
      image: '/images/banner/baner4.jpeg',
      badge: 'Handcrafted. Detailed. Special.',
    },
  ],
};

export default function Hero() {
  const { t } = useI18n();
  const { content: heroContent, version: heroVersion } = useLocalizedSectionContent('hero', heroContentFallback);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = Array.isArray(heroContent.slides) && heroContent.slides.length > 0
    ? heroContent.slides
    : heroContentFallback.slides;

  // Auto-slide effect
  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleMouseDown = () => {
    setIsPaused(true);
  };

  const handleMouseUp = () => {
    setIsPaused(false);
  };

  const handleTouchStart = () => {
    setIsPaused(true);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
  };

  return (
    <section id="home" className="relative w-full max-w-[100vw] flex flex-col overflow-hidden pt-20">
      {/* Slide band height: svh + min/max caps so imagery fills edge-to-edge without overwhelming small screens */}
      <div
        className="group relative isolate w-full min-h-[380px] h-[54svh] max-h-[480px] sm:min-h-[420px] sm:h-[58svh] sm:max-h-[540px] md:min-h-[460px] md:h-[62svh] md:max-h-[600px] lg:h-[min(68vh,46rem)] lg:max-h-[680px] overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, index) => (
          <div
            key={`${index}-${String(slide.image ?? '')}`}
            className={`absolute inset-0 min-h-full w-full h-full transition-all duration-700 ${
              index === currentSlide 
                ? 'opacity-100 z-10' 
                : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background fills slide edge-to-edge at every breakpoint; image scales with object-cover */}
            <div
              className="absolute inset-0 z-0 min-h-full w-full overflow-hidden"
              style={{ backgroundColor: 'var(--beige-100)' }}
            >
              <img
                src={resolveMediaUrl(slide.image, heroVersion || slide.image)}
                alt={`${slide.title} - ${slide.subtitle}. ${slide.description}`}
                className="pointer-events-none absolute inset-0 z-0 block h-full w-full min-h-full min-w-full max-w-none object-cover object-[center_42%] sm:object-[center_40%] md:object-[center_38%] lg:object-center"
                width={IMG.hero.width}
                height={IMG.hero.height}
                sizes="100vw"
                decoding="async"
                loading={index === 0 ? 'eager' : 'lazy'}
                {...(index === 0
                  ? ({ fetchpriority: 'high' } as ImgHTMLAttributes<HTMLImageElement>)
                  : ({ fetchpriority: 'low' } as ImgHTMLAttributes<HTMLImageElement>))}
              />
              {/* Dark Overlay for Text Readability */}
              <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
              <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Text Content Overlay */}
            <div className="relative z-10 flex h-full min-h-full w-full items-center py-6 sm:py-12 md:py-16">
              <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
                <div className="max-w-2xl space-y-4 sm:space-y-6 md:space-y-8">
                  <div className="inline-flex items-center space-x-2 px-5 py-1.5 rounded-full text-xs font-medium animate-bounce-subtle soft-shadow bg-white/90 backdrop-blur-sm">
                    <Sparkles size={14} className="animate-spin-slow" style={{color: 'var(--beige-700)'}} aria-hidden />
                    <span style={{color: 'var(--beige-700)'}}>{slide.badge}</span>
                  </div>

                  <h2 className="text-xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white drop-shadow-lg" style={{fontFamily: 'var(--heading-font)'}}>
                    {slide.title}{' '}
                    <span className="block mt-2 text-white/95">
                      {slide.subtitle}
                    </span>
                  </h2>

                  <p className="line-clamp-3 text-xs sm:text-base lg:text-lg leading-relaxed font-normal text-white/90 drop-shadow-md max-w-xl sm:line-clamp-none" style={{fontFamily: 'var(--body-font)'}}>
                    {slide.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 sm:gap-3 sm:pt-2">
                    <Link
                      to="/#contact"
                      className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded font-semibold text-xs sm:text-sm transition-all duration-200 bg-white text-[#78350F] hover:bg-[var(--beige-100)] shadow-lg"
                      style={{ fontFamily: 'var(--heading-font)' }}
                    >
                      {String(heroContent.cta_primary || heroContentFallback.cta_primary)}
                    </Link>
                    <Link
                      to="/#products"
                      className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded font-semibold text-xs sm:text-sm transition-all duration-200 border-2 border-white text-white hover:bg-white/10"
                      style={{ fontFamily: 'var(--heading-font)' }}
                    >
                      {String(heroContent.cta_secondary || heroContentFallback.cta_secondary)}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          className="pointer-events-none absolute left-2 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/30 bg-white/10 p-2 text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:border-white/50 focus-visible:pointer-events-auto focus-visible:opacity-100 sm:left-4 sm:p-2.5 group-hover:pointer-events-auto group-hover:opacity-100"
          aria-label={t('hero.prevSlide')}
        >
          <ChevronLeft size={22} className="drop-shadow-md" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          className="pointer-events-none absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/30 bg-white/10 p-2 text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:border-white/50 focus-visible:pointer-events-auto focus-visible:opacity-100 sm:right-4 sm:p-2.5 group-hover:pointer-events-auto group-hover:opacity-100"
          aria-label={t('hero.nextSlide')}
        >
          <ChevronRight size={22} className="drop-shadow-md" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </section>
  );
}
