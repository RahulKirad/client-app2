import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ShoppingBag, Filter, Grid, List, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { apiClient, Product, normalizeProducts, resolveMediaUrl } from '../lib/api';
import PageSeo from '../components/PageSeo';
import { IMG } from '../lib/imageSizes';
import { buildTitle, productPath, truncateMeta } from '../lib/seo';
import { goToHomeContactSection } from '../lib/scrollToContact';
import { htmlToPlainText } from '../lib/productDescriptionHtml';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SampleRequestModal from '../components/SampleRequestModal';

const PRODUCTS_PER_PAGE = 8;

/** All searchable text for a product (name, fields, specs, price). */
function productSearchHaystack(p: Product): string {
  let specText = '';
  try {
    if (p.specifications && typeof p.specifications === 'object') {
      specText = JSON.stringify(p.specifications);
    }
  } catch {
    specText = '';
  }
  const parts = [
    p.name,
    htmlToPlainText(p.description),
    p.category,
    p.material,
    p.print_type,
    p.packaging,
    p.moq,
    String(p.price),
    specText,
  ];
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Match if every search word appears in the haystack (substring or word prefix). */
function productMatchesSearchQuery(p: Product, rawQuery: string): boolean {
  const normalizedQuery = rawQuery
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!normalizedQuery) return true;

  const haystack = productSearchHaystack(p);
  const tokens = normalizedQuery.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return true;

  const words = haystack.split(' ').filter(Boolean);

  return tokens.every((token) => {
    if (haystack.includes(token)) return true;
    if (token.length >= 2) {
      return words.some((w) => w.startsWith(token));
    }
    return words.some((w) => w === token);
  });
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sampleProduct, setSampleProduct] = useState<Product | null>(null);

  const categories = ['All', 'Classic Cotton Totes', 'Foldable Travel Totes', 'Branded Corporate Totes', 'Seasonal Gift Editions'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'name_desc', label: 'Name Z-A' },
    { value: 'price', label: 'Price Low-High' },
    { value: 'price_desc', label: 'Price High-Low' },
    { value: 'featured', label: 'Featured First' }
  ];

  useEffect(() => {
    fetchProducts();

    // Scroll to products section if hash is present in URL
    if (window.location.hash === '#products-list') {
      setTimeout(() => {
        const element = document.getElementById('products-list');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await apiClient.getProducts();
      setProducts(normalizeProducts(Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProducts = React.useMemo(() => {
    const searching = searchQuery.trim().length > 0;
    let filtered: Product[];

    if (searching) {
      filtered = products.filter((p) => productMatchesSearchQuery(p, searchQuery));
      if (selectedCategory !== 'All') {
        filtered = filtered.filter((p) => p.category === selectedCategory);
      }
    } else {
      filtered =
        selectedCategory === 'All'
          ? products
          : products.filter((p) => p.category === selectedCategory);
    }

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'price':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'featured':
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [products, selectedCategory, sortBy, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredAndSortedProducts.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortBy, products.length, searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const id = window.setTimeout(() => {
      document.getElementById('products-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(id);
  }, [searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (filteredAndSortedProducts.length === 1) {
      navigate(productPath(filteredAndSortedProducts[0]));
    }
  };

  const productsTitle = buildTitle('Sustainable Tote Bags Catalog & Wholesale MOQs');
  const productsDescription = truncateMeta(
    'Browse Cottonunique GOTS-certified tote bags: classic cotton totes, foldable travel bags, corporate branding, and seasonal gift editions. Request samples or bulk quotes.',
    160
  );

  return (
    <div className="min-h-screen bg-white">
      <PageSeo title={productsTitle} description={productsDescription} />
      <Header />
      
      <main className="pt-20 bg-slate-50">
        {/* Top Bar */}
        <section className="bg-white border-b border-gray-200 py-5">
          <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <Link
              to="/"
              className="inline-flex items-center transition-colors font-semibold text-sm bg-white px-4 py-2 rounded-full border-2 shadow-sm hover:shadow-md"
              style={{color: 'var(--beige-700)', borderColor: 'var(--beige-600)'}}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--beige-800)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--beige-700)'}
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Home
            </Link>

            <h1 className="text-xl sm:text-2xl font-bold text-[#2C3E50] tracking-tight" style={{fontFamily: 'var(--heading-font)'}}>
              Products
            </h1>

            <div className="hidden sm:block text-sm text-[#5A6C7D] font-medium">
              Catalog Management View
            </div>
          </div>
        </section>

        {/* Filters and Controls */}
        <section className="py-6 bg-white border-b border-gray-200">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="mb-6 w-full">
              <label htmlFor="products-search" className="sr-only">
                Search products
              </label>
              <div className="relative w-full">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#5A6C7D]"
                  size={22}
                  aria-hidden
                />
                <input
                  id="products-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search products — name, material, MOQ, specs, or any word (matches whole catalog)"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 text-base font-medium text-[#2C3E50] bg-gray-50/80 placeholder:text-[#6B7280] transition-all duration-200 focus:outline-none focus:bg-white"
                  style={{ boxShadow: 'none' }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--beige-600)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232, 212, 184, 0.45)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <p className="mt-2 text-xs text-[#5A6C7D]">
                Type a word to jump to results below. If only one product matches, press Enter to open it.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Category Filter */}
              <div className="flex items-center space-x-4">
                <Filter size={20} style={{color: 'var(--beige-700)'}} />
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 text-sm ${
                        selectedCategory === category
                          ? 'text-white shadow-lg'
                          : 'bg-gray-100 text-[#2C3E50] hover:bg-gray-200'
                      }`}
                      style={selectedCategory === category ? {backgroundColor: 'var(--beige-600)'} : {}}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort and View Controls */}
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg font-medium text-sm bg-white text-[#2C3E50] transition-all duration-200"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--beige-600)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(232, 212, 184, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'text-white' : 'bg-white text-[#2C3E50] hover:bg-gray-50'}`}
                    style={viewMode === 'grid' ? {backgroundColor: 'var(--beige-600)'} : {}}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 border-l border-gray-300 ${viewMode === 'list' ? 'text-white' : 'bg-white text-[#2C3E50] hover:bg-gray-50'}`}
                    style={viewMode === 'list' ? {backgroundColor: 'var(--beige-600)'} : {}}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-[#5A6C7D] font-medium">
              {filteredAndSortedProducts.length === 0 ? (
                <>Showing 0 products</>
              ) : (
                <>
                  Showing {pageStart + 1}–{Math.min(pageStart + PRODUCTS_PER_PAGE, filteredAndSortedProducts.length)} of{' '}
                  {filteredAndSortedProducts.length} products
                  {totalPages > 1 && (
                    <span className="text-[#5A6C7D]/80"> · Page {safePage} of {totalPages}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </section>      
  {/* Products Section */}
        <section id="products-list" className="py-12 bg-gray-50 scroll-mt-20">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent" style={{borderColor: 'var(--beige-600)'}}></div>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                <Package className="mx-auto mb-4" size={64} style={{color: 'var(--beige-700)'}} />
                <h2 className="text-xl font-bold text-[#2C3E50] mb-2">No products found</h2>
                <p className="text-[#5A6C7D]">Try adjusting your filters or search to see more products.</p>
              </div>
            ) : (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 auto-rows-fr'
                      : 'space-y-6'
                  }
                >
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onRequestSample={setSampleProduct} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav
                    className="mt-12 flex flex-wrap items-center justify-center gap-2"
                    aria-label="Product list pagination"
                  >
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-[#2C3E50] bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft size={18} aria-hidden />
                      Previous
                    </button>
                    <div className="flex flex-wrap items-center justify-center gap-1 px-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            pageNum === safePage
                              ? 'text-white shadow-md'
                              : 'text-[#2C3E50] bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                          style={pageNum === safePage ? { backgroundColor: 'var(--beige-600)' } : {}}
                          aria-label={`Page ${pageNum}`}
                          aria-current={pageNum === safePage ? 'page' : undefined}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-[#2C3E50] bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      Next
                      <ChevronRight size={18} aria-hidden />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16" style={{backgroundColor: 'var(--beige-600)'}}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Place Your Order?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Contact us for samples, custom branding, or bulk orders
            </p>
            <button
              type="button"
              onClick={() => goToHomeContactSection(navigate)}
              className="inline-flex items-center space-x-2 bg-white px-8 py-3 rounded-full hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
              style={{ color: 'var(--beige-700)' }}
            >
              <ShoppingBag size={20} aria-hidden />
              <span>Get in Touch</span>
            </button>
          </div>
        </section>
      </main>

      <Footer />
      {sampleProduct ? (
        <SampleRequestModal product={sampleProduct} onClose={() => setSampleProduct(null)} />
      ) : null}
    </div>
  );
}

// Enhanced Product Card Component with Image Background Style
function ProductCard({ product, onRequestSample }: { product: Product; onRequestSample: (p: Product) => void }) {
  return (
    <Link to={productPath(product)} className="block">
      <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-[500px] flex flex-col group cursor-pointer">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={resolveMediaUrl(product.image_url)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          width={IMG.product.width}
          height={IMG.product.height}
          loading="lazy"
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
  );
}