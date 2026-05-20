import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Product, resolveMediaUrl } from '../../lib/api';
import { productPath } from '../../lib/seo';
import { htmlToPlainText } from '../../lib/productDescriptionHtml';

interface ProductCarouselProps {
  products: Product[];
  onRequestSample: (product: Product) => void;
}

const AUTOPLAY_MS = 4500;

export default function ProductCarousel({ products, onRequestSample }: ProductCarouselProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Show 4 products at a time on desktop, 2 on tablet, 1 on mobile
  const getItemsPerView = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 4;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }
    return 4;
  };

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView());

  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setPageIndex(0);
  }, [products]);

  const maxStart = Math.max(0, products.length - itemsPerView);
  const numPages =
    products.length <= itemsPerView ? 1 : Math.ceil(products.length / itemsPerView);
  const startIndex = Math.min(pageIndex * itemsPerView, maxStart);

  useEffect(() => {
    setPageIndex((p) => Math.min(p, Math.max(0, numPages - 1)));
  }, [itemsPerView, products.length, numPages]);

  useEffect(() => {
    if (!isAutoPlaying || products.length <= itemsPerView || numPages <= 1) return;

    const interval = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % numPages);
    }, AUTOPLAY_MS);

    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length, itemsPerView, numPages]);

  const nextSlide = () => {
    setPageIndex((prev) => (prev + 1) % numPages);
  };

  const prevSlide = () => {
    setPageIndex((prev) => (prev <= 0 ? numPages - 1 : prev - 1));
  };

  const goToPage = (page: number) => {
    setPageIndex(Math.max(0, Math.min(page, numPages - 1)));
  };

  if (products.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <Package className="mx-auto text-slate-400 mb-4" size={48} />
          <p className="text-slate-600">No products available</p>
        </div>
      </div>
    );
  }

  const showNavigation = products.length > itemsPerView;
  // % is relative to the flex row width; skip startIndex of n products => scroll (startIndex/n) of row.
  const translateXPercent =
    products.length > 0 ? (startIndex / products.length) * 100 : 0;

  return (
    <div
      className="relative py-6 sm:py-8 md:py-10"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Navigation Arrows */}
      {showNavigation && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 shadow-lg rounded-lg p-3 transition-all duration-300 group soft-shadow beige-border"
            style={{backgroundColor: 'var(--beige-100)'}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--beige-200)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--beige-100)'}
            aria-label="Previous products"
          >
            <ChevronLeft size={20} style={{color: 'var(--beige-700)'}} className="group-hover:opacity-80" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 shadow-lg rounded-lg p-3 transition-all duration-300 group soft-shadow beige-border"
            style={{backgroundColor: 'var(--beige-100)'}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--beige-200)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--beige-100)'}
            aria-label="Next products"
          >
            <ChevronRight size={20} style={{color: 'var(--beige-700)'}} className="group-hover:opacity-80" />
          </button>
        </>
      )}

      {/* Horizontal clip only — vertical room for scale, ring-offset, shadow, hover lift */}
      <div className="overflow-x-hidden overflow-y-visible">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ 
            transform: `translateX(-${translateXPercent}%)`,
            width: `${(products.length / itemsPerView) * 100}%`
          }}
        >
          {products.map((product, productIndex) => {
            const isInActiveSlide =
              productIndex >= startIndex &&
              productIndex < startIndex + itemsPerView;
            return (
              <div
                key={product.id}
                className="flex-shrink-0 px-3"
                style={{ width: `${100 / products.length}%` }}
              >
                <Link to={productPath(product)} className="block">
                  <div
                    className={`relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2 h-[460px] sm:h-[500px] lg:h-[540px] flex flex-col group cursor-pointer ${
                      isInActiveSlide
                        ? 'ring-[3px] ring-[var(--beige-500)] ring-offset-2 ring-offset-[var(--beige-100)] scale-[1.02] z-[1] shadow-xl'
                        : 'ring-0 ring-offset-0 scale-100'
                    }`}
                  >
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <img
                      src={resolveMediaUrl(product.image_url)}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  {/* Dark Gradient Overlay - Lighter by default, darker on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent group-hover:from-black/85 group-hover:via-black/70 group-hover:to-transparent transition-all duration-500 pointer-events-none" 
                    style={{
                      background: 'linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 30%, rgba(0, 0, 0, 0.1) 50%, transparent 100%)'
                    }}
                  />
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0.3) 60%, transparent 100%)'
                    }}
                  />

                  {/* Content Overlay */}
                  <div className="relative z-10 flex flex-col h-full justify-end p-6">
                    {/* Title - Always Visible */}
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 drop-shadow-lg">
                      {product.name}
                    </h3>

                    {/* Description - Hidden by default, appears on hover */}
                    <div className="overflow-hidden">
                      <p className="text-white/90 text-sm sm:text-base mb-4 drop-shadow-md leading-relaxed transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100 max-h-0 group-hover:max-h-32">
                        {htmlToPlainText(product.description)}
                      </p>
                    </div>

                    {/* Call to Action Button - Always Visible */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRequestSample(product);
                      }}
                      className="w-full btn-cta-primary mt-5"
                      style={{backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#78350F'}}
                      onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'translateY(-2px)';}}
                      onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)'; e.currentTarget.style.transform = 'translateY(0)';}}
                      aria-label="Request Sample"
                    >
                      Request Sample
                    </button>
                  </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots: one per full page (e.g. 16 products @ 4-wide = 4 dots) */}
      {showNavigation && numPages > 1 && (
        <div className="flex justify-center mt-10 sm:mt-12 space-x-2">
          {Array.from({ length: numPages }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToPage(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 beige-border ${
                index === pageIndex
                  ? 'scale-110'
                  : 'opacity-50 hover:opacity-80'
              }`}
              style={index === pageIndex ? {backgroundColor: 'var(--beige-600)', borderColor: 'var(--beige-400)'} : {backgroundColor: 'var(--beige-300)', borderColor: 'var(--beige-400)'}}
              aria-label={`Go to page ${index + 1} of ${numPages}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}