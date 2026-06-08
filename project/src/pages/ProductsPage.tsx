import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ShoppingBag, Filter, Grid, List, ChevronLeft, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { apiClient, Product, normalizeProducts, resolveMediaUrl } from '../lib/api';
import PageSeo from '../components/PageSeo';
import { IMG } from '../lib/imageSizes';
import { buildTitle, productPath, truncateMeta } from '../lib/seo';
import { goToHomeContactSection } from '../lib/scrollToContact';
import { htmlToPlainText } from '../lib/productDescriptionHtml';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SampleRequestModal from '../components/SampleRequestModal';
import { useI18n } from '../contexts/I18nContext';
import { localizeProduct } from '../lib/localizeProduct';

const PRODUCTS_PER_PAGE = 8;

type CategoryKey =
  | 'All'
  | 'Classic Cotton Totes'
  | 'Foldable Travel Totes'
  | 'Branded Corporate Totes'
  | 'Seasonal Gift Editions';

const CATEGORY_OPTIONS: { value: CategoryKey }[] = [
  { value: 'All' },
  { value: 'Classic Cotton Totes' },
  { value: 'Foldable Travel Totes' },
  { value: 'Branded Corporate Totes' },
  { value: 'Seasonal Gift Editions' },
];

const productsPageCopy = {
  en: {
    backHome: 'Back to Home',
    backShort: 'Back',
    title: 'Products',
    catalogView: 'Catalog Management View',
    searchLabel: 'Search products',
    searchPlaceholder:
      'Search products — name, material, MOQ, specs, or any word (matches whole catalog)',
    searchHint:
      'Type a word to jump to results below. If only one product matches, press Enter to open it.',
    filterByCategory: 'Filter by category',
    filters: 'Filters',
    showFilters: 'Show filters',
    hideFilters: 'Hide filters',
    sortNewest: 'Newest First',
    sortName: 'Name A-Z',
    sortNameDesc: 'Name Z-A',
    sortPrice: 'Price Low-High',
    sortPriceDesc: 'Price High-Low',
    sortFeatured: 'Featured First',
    showingZero: 'Showing 0 products',
    showingRange: (from: number, to: number, total: number) =>
      `Showing ${from}–${to} of ${total} products`,
    pageOf: (page: number, totalPages: number) => ` · Page ${page} of ${totalPages}`,
    noProducts: 'No products found',
    noProductsHint: 'Try adjusting your filters or search to see more products.',
    paginationLabel: 'Product list pagination',
    previous: 'Previous',
    next: 'Next',
    pageAria: (page: number) => `Page ${page}`,
    ctaTitle: 'Ready to Place Your Order?',
    ctaBody: 'Contact us for samples, custom branding, or bulk orders',
    ctaButton: 'Get in Touch',
    requestSample: 'Request Sample',
    seoTitle: 'Sustainable Tote Bags Catalog & Wholesale MOQs',
    seoDescription:
      'Browse Cottonunique GOTS-certified tote bags: classic cotton totes, foldable travel bags, corporate branding, and seasonal gift editions. Request samples or bulk quotes.',
    categories: {
      All: 'All',
      'Classic Cotton Totes': 'Classic Cotton Totes',
      'Foldable Travel Totes': 'Foldable Travel Totes',
      'Branded Corporate Totes': 'Branded Corporate Totes',
      'Seasonal Gift Editions': 'Seasonal Gift Editions',
    } satisfies Record<CategoryKey, string>,
  },
  de: {
    backHome: 'Zurück zur Startseite',
    backShort: 'Zurück',
    title: 'Produkte',
    catalogView: 'Katalogansicht',
    searchLabel: 'Produkte suchen',
    searchPlaceholder:
      'Produkte suchen — Name, Material, MOQ, Spezifikationen oder ein beliebiges Wort (durchsucht den gesamten Katalog)',
    searchHint:
      'Geben Sie ein Wort ein, um zu den Ergebnissen zu springen. Wenn nur ein Produkt passt, drücken Sie Enter, um es zu öffnen.',
    filterByCategory: 'Nach Kategorie filtern',
    filters: 'Filter',
    showFilters: 'Filter anzeigen',
    hideFilters: 'Filter ausblenden',
    sortNewest: 'Neueste zuerst',
    sortName: 'Name A-Z',
    sortNameDesc: 'Name Z-A',
    sortPrice: 'Preis aufsteigend',
    sortPriceDesc: 'Preis absteigend',
    sortFeatured: 'Empfohlene zuerst',
    showingZero: '0 Produkte angezeigt',
    showingRange: (from: number, to: number, total: number) =>
      `Zeige ${from}–${to} von ${total} Produkten`,
    pageOf: (page: number, totalPages: number) => ` · Seite ${page} von ${totalPages}`,
    noProducts: 'Keine Produkte gefunden',
    noProductsHint: 'Passen Sie Filter oder Suche an, um mehr Produkte zu sehen.',
    paginationLabel: 'Seitennavigation der Produktliste',
    previous: 'Zurück',
    next: 'Weiter',
    pageAria: (page: number) => `Seite ${page}`,
    ctaTitle: 'Bereit, Ihre Bestellung aufzugeben?',
    ctaBody: 'Kontaktieren Sie uns für Muster, individuelles Branding oder Großbestellungen',
    ctaButton: 'Kontakt aufnehmen',
    requestSample: 'Muster anfordern',
    seoTitle: 'Nachhaltige Tragetaschen – Katalog & Großhandels-MOQs',
    seoDescription:
      'Entdecken Sie GOTS-zertifizierte Cottonunique Tragetaschen: klassische Baumwolltaschen, faltbare Reisetaschen, Unternehmens-Branding und saisonale Geschenkeditionen. Muster oder Großmengen-Angebote anfragen.',
    categories: {
      All: 'Alle',
      'Classic Cotton Totes': 'Klassische Baumwolltaschen',
      'Foldable Travel Totes': 'Faltbare Reisetaschen',
      'Branded Corporate Totes': 'Gebrandete Unternehmenstaschen',
      'Seasonal Gift Editions': 'Saisonale Geschenkeditionen',
    } satisfies Record<CategoryKey, string>,
  },
};

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
    p.name_de,
    htmlToPlainText(p.description),
    p.description_de ? htmlToPlainText(p.description_de) : '',
    p.category,
    p.category_de,
    p.material,
    p.material_de,
    p.print_type,
    p.print_type_de,
    p.packaging,
    p.packaging_de,
    p.moq,
    p.moq_de,
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
  const { effectiveLocale, t } = useI18n();
  const copy = productsPageCopy[effectiveLocale];
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sampleProduct, setSampleProduct] = useState<Product | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setFiltersOpen(true);
    }
  }, []);

  const sortOptions = [
    { value: 'newest', label: copy.sortNewest },
    { value: 'name', label: copy.sortName },
    { value: 'name_desc', label: copy.sortNameDesc },
    { value: 'price', label: copy.sortPrice },
    { value: 'price_desc', label: copy.sortPriceDesc },
    { value: 'featured', label: copy.sortFeatured },
  ];

  const requestSampleLabel = t('products.requestSamples') || copy.requestSample;

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
  const paginatedProducts = filteredAndSortedProducts
    .slice(pageStart, pageStart + PRODUCTS_PER_PAGE)
    .map((p) => localizeProduct(p, effectiveLocale));

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

  const productsTitle = buildTitle(copy.seoTitle);
  const productsDescription = truncateMeta(copy.seoDescription, 160);

  return (
    <div className="min-h-screen bg-white">
      <PageSeo title={productsTitle} description={productsDescription} />
      <Header />
      
      <main className="pt-20 bg-slate-50">
        {/* Top Bar */}
        <section className="bg-white border-b border-gray-200 py-5">
          <div className="relative flex min-h-[2.75rem] w-full items-center justify-between gap-4 px-4 sm:min-h-0 sm:px-6 lg:px-8">
            <Link
              to="/"
              className="relative z-10 inline-flex shrink-0 items-center transition-colors font-semibold text-sm bg-white px-3 py-2 rounded-full border-2 shadow-sm hover:shadow-md sm:px-4"
              style={{color: 'var(--beige-700)', borderColor: 'var(--beige-600)'}}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--beige-800)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--beige-700)'}
            >
              <ArrowLeft size={18} className="mr-2 hidden sm:inline" aria-hidden />
              <span className="sm:hidden">{copy.backShort}</span>
              <span className="hidden sm:inline">{copy.backHome}</span>
            </Link>

            <h1
              className="pointer-events-none absolute left-1/2 top-1/2 w-max max-w-[calc(100%-7rem)] -translate-x-1/2 -translate-y-1/2 text-center text-xl font-bold tracking-tight text-[#2C3E50] sm:pointer-events-auto sm:static sm:max-w-none sm:translate-x-0 sm:translate-y-0 sm:text-left sm:text-2xl"
              style={{ fontFamily: 'var(--heading-font)' }}
            >
              {t('nav.products') || copy.title}
            </h1>

            <div className="hidden shrink-0 text-sm font-medium text-[#5A6C7D] sm:block">
              {copy.catalogView}
            </div>
          </div>
        </section>

        {/* Filters and Controls */}
        <section className="py-6 bg-white border-b border-gray-200">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="mb-6 w-full">
              <label htmlFor="products-search" className="sr-only">
                {copy.searchLabel}
              </label>
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#5A6C7D] sm:left-4"
                  size={18}
                  aria-hidden
                />
                <input
                  id="products-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={copy.searchPlaceholder}
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/80 py-2.5 pl-10 pr-3 text-sm font-medium text-[#2C3E50] placeholder:text-[#6B7280] transition-all duration-200 focus:outline-none focus:bg-white sm:py-3.5 sm:pl-12 sm:pr-4 sm:text-base"
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
            </div>

            {/* Filters panel (collapsible: categories, sort, view) */}
            <div className="w-full">
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-left transition-colors hover:bg-gray-100"
                aria-expanded={filtersOpen}
                aria-controls="products-filters-panel"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <Filter size={16} className="shrink-0" style={{ color: 'var(--beige-700)' }} aria-hidden />
                  <span className="text-sm font-semibold text-[#2C3E50]">{copy.filters}</span>
                  {!filtersOpen ? (
                    <>
                      {selectedCategory !== 'All' ? (
                        <span
                          className="max-w-[8rem] truncate rounded-full px-2 py-0.5 text-[10px] font-semibold text-white sm:max-w-none sm:text-xs"
                          style={{ backgroundColor: 'var(--beige-600)' }}
                        >
                          {copy.categories[selectedCategory]}
                        </span>
                      ) : null}
                      <span className="truncate text-[10px] font-medium text-[#5A6C7D] sm:text-xs">
                        {sortOptions.find((o) => o.value === sortBy)?.label}
                      </span>
                    </>
                  ) : null}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#5A6C7D]">
                  <span className="hidden sm:inline">{filtersOpen ? copy.hideFilters : copy.showFilters}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </span>
              </button>

              <div
                id="products-filters-panel"
                className={filtersOpen ? 'mt-3 space-y-4' : 'hidden'}
              >
                <p className="text-xs leading-relaxed text-[#5A6C7D]">{copy.searchHint}</p>

                <div>
                  <p className="mb-2 text-xs font-semibold text-[#2C3E50]">{copy.filterByCategory}</p>
                  <div
                    className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:gap-1.5"
                    role="group"
                    aria-label={copy.filterByCategory}
                  >
                    {CATEGORY_OPTIONS.map(({ value }, index) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedCategory(value)}
                        className={`flex min-h-[2.25rem] items-center justify-center rounded-full px-2.5 py-1.5 text-center text-[11px] font-semibold leading-snug transition-all duration-300 sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs sm:whitespace-nowrap ${
                          index === CATEGORY_OPTIONS.length - 1 && CATEGORY_OPTIONS.length % 2 === 1
                            ? 'col-span-2 sm:col-span-1'
                            : ''
                        } ${
                          selectedCategory === value
                            ? 'text-white shadow-md'
                            : 'bg-gray-100 text-[#2C3E50] hover:bg-gray-200'
                        }`}
                        style={selectedCategory === value ? { backgroundColor: 'var(--beige-600)' } : {}}
                      >
                        {copy.categories[value]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-[#2C3E50] transition-all duration-200 sm:min-w-[11rem] sm:flex-none"
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

                  <div className="flex shrink-0 overflow-hidden rounded-lg border border-gray-300">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'text-white' : 'bg-white text-[#2C3E50] hover:bg-gray-50'}`}
                      style={viewMode === 'grid' ? { backgroundColor: 'var(--beige-600)' } : {}}
                      aria-label="Grid view"
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`border-l border-gray-300 p-2 ${viewMode === 'list' ? 'text-white' : 'bg-white text-[#2C3E50] hover:bg-gray-50'}`}
                      style={viewMode === 'list' ? { backgroundColor: 'var(--beige-600)' } : {}}
                      aria-label="List view"
                    >
                      <List size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-[#5A6C7D] font-medium">
              {filteredAndSortedProducts.length === 0 ? (
                <>{copy.showingZero}</>
              ) : (
                <>
                  {copy.showingRange(
                    pageStart + 1,
                    Math.min(pageStart + PRODUCTS_PER_PAGE, filteredAndSortedProducts.length),
                    filteredAndSortedProducts.length
                  )}
                  {totalPages > 1 && (
                    <span className="text-[#5A6C7D]/80">{copy.pageOf(safePage, totalPages)}</span>
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
                <h2 className="text-xl font-bold text-[#2C3E50] mb-2">{copy.noProducts}</h2>
                <p className="text-[#5A6C7D]">{copy.noProductsHint}</p>
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
                    <ProductCard
                      key={product.id}
                      product={product}
                      onRequestSample={setSampleProduct}
                      requestSampleLabel={requestSampleLabel}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav
                    className="mt-12 flex flex-wrap items-center justify-center gap-2"
                    aria-label={copy.paginationLabel}
                  >
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-[#2C3E50] bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft size={18} aria-hidden />
                      {copy.previous}
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
                          aria-label={copy.pageAria(pageNum)}
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
                      {copy.next}
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
              {copy.ctaTitle}
            </h2>
            <p className="text-xl text-white/90 mb-8">
              {copy.ctaBody}
            </p>
            <button
              type="button"
              onClick={() => goToHomeContactSection(navigate)}
              className="inline-flex items-center space-x-2 bg-white px-8 py-3 rounded-full hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
              style={{ color: 'var(--beige-700)' }}
            >
              <ShoppingBag size={20} aria-hidden />
              <span>{copy.ctaButton}</span>
            </button>
          </div>
        </section>
      </main>

      <Footer />
      {sampleProduct ? (
        <SampleRequestModal
          product={localizeProduct(sampleProduct, effectiveLocale)}
          onClose={() => setSampleProduct(null)}
        />
      ) : null}
    </div>
  );
}

// Enhanced Product Card Component with Image Background Style
function ProductCard({
  product,
  onRequestSample,
  requestSampleLabel,
}: {
  product: Product;
  onRequestSample: (p: Product) => void;
  requestSampleLabel: string;
}) {
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
          aria-label={requestSampleLabel}
        >
          {requestSampleLabel}
        </button>
      </div>
      </div>
    </Link>
  );
}