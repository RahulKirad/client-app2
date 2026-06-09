import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient, Product, normalizeProducts } from '../../lib/api';
import ProductCarousel from '../ui/ProductCarousel';
import SampleRequestModal from '../SampleRequestModal';
import { useLocalizedSectionContent } from '../../hooks/useLocalizedSectionContent';
import { useI18n } from '../../contexts/I18nContext';
import { localizeProduct } from '../../lib/localizeProduct';

const productsHomeFallback = {
  heading: 'Organic Cotton Tote Bags for Every Market',
  subheading: 'Premium sustainable bags designed for global commerce',
  cta_primary: 'View All Products',
  cta_secondary: 'Request Samples',
};

const HOME_CAROUSEL_COUNT = 16;

function shuffleInPlace<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Products() {
  const { t, effectiveLocale } = useI18n();
  const { content: sectionContent } = useLocalizedSectionContent('products_home', productsHomeFallback);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sampleProduct, setSampleProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await apiClient.getProducts();
      const normalized = normalizeProducts(Array.isArray(data) ? data : []);
      const randomSubset = shuffleInPlace(normalized).slice(0, HOME_CAROUSEL_COUNT);
      setProducts(randomSubset);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const displayProducts = useMemo(
    () => products.map((p) => localizeProduct(p, effectiveLocale)),
    [products, effectiveLocale]
  );

  const scrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="products" className="pt-4 pb-24 sm:pb-28">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <h2 className="heading-h2 text-4xl sm:text-5xl lg:text-6xl mb-4 text-center" style={{color: 'var(--heading-color)'}}>
            {String(sectionContent.heading || productsHomeFallback.heading)}
          </h2>
          <p className="body-text-lg text-lg sm:text-xl max-w-3xl mx-auto text-center" style={{color: 'var(--text-primary)'}}>
            {String(sectionContent.subheading || productsHomeFallback.subheading)}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent" style={{borderColor: 'var(--beige-600)'}}></div>
          </div>
        ) : (
          <>
            {/* Product Carousel */}
            <div className="mb-14 sm:mb-16">
              <ProductCarousel products={displayProducts} onRequestSample={setSampleProduct} />
            </div>

          </>
        )}

        {/* All Buttons in Single Line */}
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          <Link
            to="/products#products-list"
            className="inline-flex items-center space-x-2 px-8 py-3 rounded-lg transition-all duration-300 soft-shadow group font-medium"
            style={{backgroundColor: 'var(--beige-300)', color: 'var(--text-color)', border: '2px solid var(--beige-600)', borderColor: 'var(--beige-600)'}}
            onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = 'var(--beige-400)'; e.currentTarget.style.borderColor = 'var(--beige-700)'}}
            onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'var(--beige-300)'; e.currentTarget.style.borderColor = 'var(--beige-600)'}}
          >
            <span>{String(sectionContent.cta_primary || productsHomeFallback.cta_primary)}</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            onClick={scrollToContact}
            className="btn-cta-primary flex items-center justify-center space-x-2"
            style={{backgroundColor: 'var(--beige-700)', color: 'white', border: '2px solid var(--beige-800)', borderColor: 'var(--beige-800)'}}
            aria-label={t('products.requestSamples')}
            onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = 'var(--beige-800)'; e.currentTarget.style.borderColor = 'var(--beige-900)'}}
            onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'var(--beige-700)'; e.currentTarget.style.borderColor = 'var(--beige-800)'}}
          >
            <ShoppingBag size={20} />
            <span>{String(sectionContent.cta_secondary || productsHomeFallback.cta_secondary)}</span>
          </button>
        </div>
      </div>
      {sampleProduct ? (
        <SampleRequestModal
          product={localizeProduct(sampleProduct, effectiveLocale)}
          onClose={() => setSampleProduct(null)}
        />
      ) : null}
    </section>
  );
}
