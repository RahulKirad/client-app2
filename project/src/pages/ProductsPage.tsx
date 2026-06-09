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

type ProductGridRow =
  | { type: 'pair'; items: Product[] }
  | { type: 'single'; items: [Product] };

/** Mobile rhythm: two cards, then one full-width card, repeating. */
function buildAlternatingProductRows(products: Product[]): ProductGridRow[] {
  const rows: ProductGridRow[] = [];
  let i = 0;
  while (i < products.length) {
    if (i + 1 < products.length) {
      rows.push({ type: 'pair', items: products.slice(i, i + 2) });
      i += 2;
      if (i < products.length) {
        rows.push({ type: 'single', items: [products[i]] });
        i += 1;
      }
    } else {
      rows.push({ type: 'single', items: [products[i]] });
      i += 1;
    }
  }
  return rows;
}

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
    searchPlaceholderShort: 'Search products…',
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
    showingZeroShort: '0 products',
    showingRange: (from: number, to: number, total: number) =>
      `Showing ${from}–${to} of ${total} products`,
    showingRangeShort: (from: number, to: number, total: number) => `${from}–${to} of ${total}`,
    pageOf: (page: number, totalPages: number) => ` · Page ${page} of ${totalPages}`,
    pageOfShort: (page: number, totalPages: number) => ` · ${page}/${totalPages}`,
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
    requestSampleShort: 'Sample',
    listMaterial: 'Material',
    listPrint: 'Print',
    listMoq: 'MOQ',
    listPackaging: 'Packaging',
    viewDetails: 'View details',
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
    searchPlaceholderShort: 'Produkte suchen…',
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
    showingZeroShort: '0 Produkte',
    showingRange: (from: number, to: number, total: number) =>
      `Zeige ${from}–${to} von ${total} Produkten`,
    showingRangeShort: (from: number, to: number, total: number) => `${from}–${to} von ${total}`,
    pageOf: (page: number, totalPages: number) => ` · Seite ${page} von ${totalPages}`,
    pageOfShort: (page: number, totalPages: number) => ` · ${page}/${totalPages}`,
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
    requestSampleShort: 'Muster',
    listMaterial: 'Material',
    listPrint: 'Druck',
    listMoq: 'MOQ',
    listPackaging: 'Verpackung',
    viewDetails: 'Details ansehen',
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

type ProductsPageCopy = (typeof productsPageCopy)['en'];

function ProductResultsSummary({
  copy,
  total,
  pageStart,
  safePage,
  totalPages,
  variant = 'inline',
  className = '',
}: {
  copy: ProductsPageCopy;
  total: number;
  pageStart: number;
  safePage: number;
  totalPages: number;
  variant?: 'inline' | 'panel';
  className?: string;
}) {
  const from = pageStart + 1;
  const to = Math.min(pageStart + PRODUCTS_PER_PAGE, total);

  const wrapperClass =
    variant === 'panel'
      ? 'border-t border-gray-100 px-2 pt-3 pb-1.5 sm:px-0 sm:pt-3.5 sm:pb-2'
      : 'px-2 pt-2.5 pb-1.5 sm:px-0 sm:pt-3 sm:pb-2';

  return (
    <div
      className={`products-results-summary ${wrapperClass} ${className}`.trim()}
      aria-live="polite"
    >
      <p className="text-[10px] font-medium leading-snug text-[#5A6C7D] sm:text-sm">
        {total === 0 ? (
          <>
            <span className="sm:hidden">{copy.showingZeroShort}</span>
            <span className="hidden sm:inline">{copy.showingZero}</span>
          </>
        ) : (
          <>
            <span className="sm:hidden">
              {copy.showingRangeShort(from, to, total)}
              {totalPages > 1 ? copy.pageOfShort(safePage, totalPages) : ''}
            </span>
            <span className="hidden sm:inline">
              {copy.showingRange(from, to, total)}
              {totalPages > 1 ? (
                <span className="text-[#5A6C7D]/80">{copy.pageOf(safePage, totalPages)}</span>
              ) : null}
            </span>
          </>
        )}
      </p>
    </div>
  );
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
  const [compactChrome, setCompactChrome] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = () => setCompactChrome(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
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
        {/* Page header + search / filters */}
        <section className="bg-white border-b border-gray-200">
          <div className="w-full space-y-2 px-4 py-2 sm:space-y-5 sm:px-6 sm:py-5 lg:px-8">
            <div className="relative flex min-h-[2rem] w-full items-center justify-between gap-2 sm:min-h-0 sm:gap-4">
              <Link
                to="/"
                className="relative z-10 inline-flex shrink-0 items-center rounded-full border-2 bg-white px-2 py-0.5 text-[11px] font-semibold shadow-sm transition-colors hover:shadow-md sm:px-4 sm:py-2 sm:text-sm"
                style={{ color: 'var(--beige-700)', borderColor: 'var(--beige-600)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--beige-800)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--beige-700)'; }}
              >
                <ArrowLeft size={14} className="mr-1 hidden sm:mr-2 sm:inline sm:h-[18px] sm:w-[18px]" aria-hidden />
                <span className="sm:hidden">{copy.backShort}</span>
                <span className="hidden sm:inline">{copy.backHome}</span>
              </Link>

              <h1
                className="pointer-events-none absolute left-1/2 top-1/2 w-max max-w-[calc(100%-5.5rem)] -translate-x-1/2 -translate-y-1/2 text-center text-base font-bold tracking-tight text-[#2C3E50] sm:pointer-events-auto sm:static sm:max-w-none sm:translate-x-0 sm:translate-y-0 sm:text-left sm:text-2xl"
                style={{ fontFamily: 'var(--heading-font)' }}
              >
                {t('nav.products') || copy.title}
              </h1>

              <div className="hidden shrink-0 text-sm font-medium text-[#5A6C7D] sm:block">
                {copy.catalogView}
              </div>
            </div>

            <div className="w-full sm:mb-1">
              <label htmlFor="products-search" className="sr-only">
                {copy.searchLabel}
              </label>
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5A6C7D] sm:left-4 sm:h-[18px] sm:w-[18px]"
                    aria-hidden
                  />
                  <input
                    id="products-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={compactChrome ? copy.searchPlaceholderShort : copy.searchPlaceholder}
                    className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50/80 py-0 pl-8 pr-2 text-xs font-medium text-[#2C3E50] placeholder:text-[#6B7280] transition-all duration-200 focus:border-[var(--beige-600)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(232,212,184,0.45)] sm:h-auto sm:rounded-xl sm:border-2 sm:py-3.5 sm:pl-12 sm:pr-4 sm:text-base"
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setFiltersOpen((open) => !open)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50/80 transition-colors hover:bg-gray-100 sm:h-auto sm:w-auto sm:rounded-xl sm:px-4 sm:py-3.5"
                  aria-expanded={filtersOpen}
                  aria-controls="products-filters-panel"
                  aria-label={filtersOpen ? copy.hideFilters : copy.showFilters}
                >
                  <Filter size={14} className="shrink-0 sm:h-4 sm:w-4" style={{ color: 'var(--beige-700)' }} aria-hidden />
                  <span className="hidden text-sm font-semibold text-[#2C3E50] sm:inline">{copy.filters}</span>
                  <ChevronDown
                    size={14}
                    className={`hidden shrink-0 text-[#5A6C7D] transition-transform duration-200 sm:block sm:h-[18px] sm:w-[18px] ${filtersOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
              </div>

              {!filtersOpen ? (
                <ProductResultsSummary
                  copy={copy}
                  total={filteredAndSortedProducts.length}
                  pageStart={pageStart}
                  safePage={safePage}
                  totalPages={totalPages}
                  variant="inline"
                />
              ) : null}

              <div
                id="products-filters-panel"
                className={filtersOpen ? 'mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm sm:mt-3 sm:rounded-xl' : 'hidden'}
              >
                <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
                  <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2C3E50]">
                      {copy.filterByCategory}
                    </p>
                    <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-9 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-[#2C3E50] transition-all duration-200 sm:min-w-[11.5rem] sm:flex-none"
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

                      <div className="flex h-9 shrink-0 overflow-hidden rounded-lg border border-gray-300">
                        <button
                          type="button"
                          onClick={() => setViewMode('grid')}
                          className={`flex h-full w-9 items-center justify-center ${viewMode === 'grid' ? 'text-white' : 'bg-white text-[#2C3E50] hover:bg-gray-50'}`}
                          style={viewMode === 'grid' ? { backgroundColor: 'var(--beige-600)' } : {}}
                          aria-label="Grid view"
                        >
                          <Grid size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('list')}
                          className={`flex h-full w-9 items-center justify-center border-l border-gray-300 ${viewMode === 'list' ? 'text-white' : 'bg-white text-[#2C3E50] hover:bg-gray-50'}`}
                          style={viewMode === 'list' ? { backgroundColor: 'var(--beige-600)' } : {}}
                          aria-label="List view"
                        >
                          <List size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap"
                    role="group"
                    aria-label={copy.filterByCategory}
                  >
                    {CATEGORY_OPTIONS.map(({ value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedCategory(value)}
                        className={`inline-flex min-h-9 h-auto w-full min-w-0 items-center justify-center rounded-full px-1.5 py-1.5 text-center text-[10px] font-semibold leading-tight transition-all duration-200 sm:h-9 sm:w-auto sm:px-4 sm:py-0 sm:text-xs ${
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

                  <ProductResultsSummary
                    copy={copy}
                    total={filteredAndSortedProducts.length}
                    pageStart={pageStart}
                    safePage={safePage}
                    totalPages={totalPages}
                    variant="panel"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Products Section */}
        <section id="products-list" className="scroll-mt-[4.5rem] bg-gray-50 py-5 sm:scroll-mt-20 sm:py-12">
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
                {viewMode === 'grid' ? (
                  <>
                    <div className="flex flex-col gap-4 lg:hidden">
                      {buildAlternatingProductRows(paginatedProducts).map((row, rowIdx) =>
                        row.type === 'pair' ? (
                          <div key={`pair-${rowIdx}`} className="grid grid-cols-2 gap-3">
                            {row.items.map((product) => (
                              <ProductCard
                                key={product.id}
                                product={product}
                                onRequestSample={setSampleProduct}
                                requestSampleLabel={requestSampleLabel}
                                buttonText={copy.requestSampleShort}
                                size="mobile-pair"
                              />
                            ))}
                          </div>
                        ) : (
                          <div key={`single-${rowIdx}`} className="grid grid-cols-1">
                            {row.items.map((product) => (
                              <ProductCard
                                key={product.id}
                                product={product}
                                onRequestSample={setSampleProduct}
                                requestSampleLabel={requestSampleLabel}
                                size="mobile-single"
                              />
                            ))}
                          </div>
                        ),
                      )}
                    </div>
                    <div className="hidden auto-rows-fr gap-8 lg:grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {paginatedProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onRequestSample={setSampleProduct}
                          requestSampleLabel={requestSampleLabel}
                          size="desktop"
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
                    {paginatedProducts.map((product) => (
                      <ProductListRow
                        key={product.id}
                        product={product}
                        onRequestSample={setSampleProduct}
                        requestSampleLabel={requestSampleLabel}
                        copy={copy}
                      />
                    ))}
                  </div>
                )}

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
        <section
          className="py-8 sm:py-12 lg:py-16"
          style={{ backgroundColor: 'var(--beige-600)' }}
        >
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-2 text-xl font-bold leading-tight text-white sm:mb-3 sm:text-2xl lg:mb-4 lg:text-3xl">
              {copy.ctaTitle}
            </h2>
            <p className="mx-auto mb-4 max-w-md text-sm leading-snug text-white/90 sm:mb-6 sm:max-w-none sm:text-lg sm:leading-relaxed lg:mb-8 lg:text-xl">
              {copy.ctaBody}
            </p>
            <button
              type="button"
              onClick={() => goToHomeContactSection(navigate)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-sm font-semibold shadow-md transition-all duration-300 hover:bg-gray-100 hover:shadow-lg sm:gap-2 sm:px-8 sm:py-3 sm:text-base sm:shadow-lg sm:hover:shadow-xl"
              style={{ color: 'var(--beige-700)' }}
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
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

const PRODUCT_CARD_SIZE = {
  'mobile-pair': {
    shell:
      'h-[220px] min-[360px]:h-[240px] min-[400px]:h-[250px] rounded-xl shadow-md',
    content: 'p-3',
    title: 'mb-1 text-sm font-bold leading-snug min-[400px]:text-base',
    button:
      'mt-1.5 rounded-md border-0 font-semibold cursor-pointer inline-flex items-center justify-center transition-all duration-300 !py-1 !px-2 text-[10px] leading-tight min-[400px]:!py-1.5 min-[400px]:!px-2.5 min-[400px]:text-[11px]',
  },
  'mobile-single': {
    shell:
      'h-[280px] min-[360px]:h-[300px] min-[400px]:h-[320px] rounded-xl shadow-md',
    content: 'p-4',
    title: 'mb-2 text-base font-bold leading-snug',
    button: 'mt-3 !px-3 !py-2.5 text-xs',
  },
  desktop: {
    shell:
      'rounded-2xl shadow-lg transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl md:h-[360px] lg:h-[400px] xl:h-[440px]',
    content: 'p-5 lg:p-6',
    title: 'mb-2 text-xl font-bold leading-snug lg:text-2xl xl:text-3xl',
    button: 'mt-4 !px-4 !py-2.5 text-sm lg:mt-5 lg:!py-3 lg:text-base',
  },
} as const;

// Enhanced Product Card Component with Image Background Style
function ProductCard({
  product,
  onRequestSample,
  requestSampleLabel,
  buttonText,
  size = 'desktop',
}: {
  product: Product;
  onRequestSample: (p: Product) => void;
  requestSampleLabel: string;
  buttonText?: string;
  size?: keyof typeof PRODUCT_CARD_SIZE;
}) {
  const styles = PRODUCT_CARD_SIZE[size];
  const isDesktop = size === 'desktop';
  const isMobilePair = size === 'mobile-pair';
  const displayButtonLabel = buttonText ?? requestSampleLabel;

  return (
    <Link to={productPath(product)} className="block">
      <div
        className={`group relative flex w-full cursor-pointer flex-col overflow-hidden transition-all duration-500 group-hover:shadow-xl ${styles.shell}`}
      >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={resolveMediaUrl(product.image_url)}
          alt={product.name}
          className={`h-full w-full object-cover transition-transform duration-500 ${isDesktop ? 'group-hover:scale-110' : 'group-hover:scale-105'}`}
          width={IMG.product.width}
          height={IMG.product.height}
          loading="lazy"
        />
      </div>

      {/* Dark Gradient Overlay - Lighter by default, darker on hover */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-500"
        style={{
          background:
            'linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 30%, rgba(0, 0, 0, 0.1) 50%, transparent 100%)',
        }}
      />
      {isDesktop ? (
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none group-hover:opacity-100"
          style={{
            background:
              'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0.3) 60%, transparent 100%)',
          }}
        />
      ) : null}

      {/* Content Overlay */}
      <div className={`relative z-10 flex h-full flex-col justify-end ${styles.content}`}>
        {/* Title - Always Visible */}
        <h3 className={`line-clamp-2 text-white drop-shadow-lg ${styles.title}`}>
          {product.name}
        </h3>

        {/* Description - desktop hover only */}
        <div className={`overflow-hidden ${isDesktop ? 'block' : 'hidden'}`}>
          <p className="mb-4 max-h-0 translate-y-4 text-sm leading-relaxed text-white/90 opacity-0 drop-shadow-md transition-all delay-100 duration-500 group-hover:max-h-32 group-hover:translate-y-0 group-hover:opacity-100 sm:text-base">
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
          className={`w-full ${isMobilePair ? styles.button : `btn-cta-primary ${styles.button}`}`}
          style={{backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#78350F'}}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            if (!isMobilePair) e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            if (!isMobilePair) e.currentTarget.style.transform = 'translateY(0)';
          }}
          aria-label={requestSampleLabel}
        >
          {displayButtonLabel}
        </button>
      </div>
      </div>
    </Link>
  );
}

function ProductListRow({
  product,
  onRequestSample,
  requestSampleLabel,
  copy,
}: {
  product: Product;
  onRequestSample: (p: Product) => void;
  requestSampleLabel: string;
  copy: (typeof productsPageCopy)['en'];
}) {
  const specLines = [
    product.material ? { label: copy.listMaterial, value: product.material } : null,
    product.print_type ? { label: copy.listPrint, value: product.print_type } : null,
    product.moq ? { label: copy.listMoq, value: product.moq } : null,
    product.packaging ? { label: copy.listPackaging, value: product.packaging } : null,
  ].filter((line): line is { label: string; value: string } => line !== null);

  const showPrice = Number(product.price) > 0;

  return (
    <article className="flex items-stretch gap-3 px-3 py-3 transition-colors hover:bg-gray-50/80 sm:gap-4 sm:px-5 sm:py-3.5">
      <Link to={productPath(product)} className="shrink-0 self-center">
        <img
          src={resolveMediaUrl(product.image_url)}
          alt={product.name}
          className="h-[72px] w-[72px] rounded-md border border-gray-100 bg-gray-50 object-cover sm:h-20 sm:w-20"
          width={IMG.product.width}
          height={IMG.product.height}
          loading="lazy"
        />
      </Link>

      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
        <div className="min-w-0 flex-1">
          <Link to={productPath(product)} className="group block">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[#2C3E50] group-hover:underline sm:text-base">
              {product.name}
            </h3>
          </Link>
          <p className="mt-0.5 truncate text-xs font-medium text-[#5A6C7D]">{product.category}</p>

          {specLines.length > 0 ? (
            <ul className="mt-1.5 space-y-0.5">
              {specLines.slice(0, 3).map((line) => (
                <li key={line.label} className="text-[11px] leading-tight text-[#5A6C7D] sm:text-xs">
                  <span className="font-semibold text-[#2C3E50]">{line.label}:</span>{' '}
                  <span>{line.value}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center gap-2 self-center">
          {showPrice ? (
            <p className="text-base font-bold tabular-nums text-[#2C3E50] sm:text-lg">
              ${Number(product.price).toFixed(2)}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => onRequestSample(product)}
            className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--beige-600)' }}
            aria-label={requestSampleLabel}
          >
            {requestSampleLabel}
          </button>

          <Link
            to={productPath(product)}
            className="text-[11px] font-semibold text-[#5A6C7D] underline-offset-2 hover:text-[#2C3E50] hover:underline sm:text-xs"
          >
            {copy.viewDetails}
          </Link>
        </div>
      </div>
    </article>
  );
}