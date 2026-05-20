import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Image, Star, Eye, ExternalLink, X, FolderPlus, ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeProducts, resolveMediaUrl } from '../../lib/api';
import { htmlToPlainText, isQuillDescriptionEmpty } from '../../lib/productDescriptionHtml';
import ProductRichTextEditor from './ProductRichTextEditor';

const PRICING_CURRENCY_ORDER = ['inr', 'usd', 'eur', 'gbp', 'aed', 'sar', 'qar', 'kwd'] as const;

function legacyPriceFromMultiCurrency(
  p: Record<string, { amount: number; enabled: boolean }>
): number {
  for (const code of PRICING_CURRENCY_ORDER) {
    const cell = p[code];
    if (cell?.enabled && cell.amount > 0) return cell.amount;
  }
  return 0;
}

const DEFAULT_PRODUCT_CATEGORIES = [
  'Classic Cotton Totes',
  'Foldable Travel Totes',
  'Branded Corporate Totes',
  'Seasonal Gift Editions',
] as const;

const ADMIN_CATEGORIES_STORAGE_KEY = 'cottonunique_admin_product_categories';

/** Admin catalog list page size */
const PRODUCTS_PAGE_SIZE = 9;

/** Max images per product (admin upload + API). */
const MAX_PRODUCT_PHOTOS = 10;

function productMatchesAdminFilters(
  p: Product,
  searchRaw: string,
  categoryFilter: string,
  statusFilter: 'all' | 'active' | 'inactive',
  featuredFilter: 'all' | 'featured' | 'not'
): boolean {
  const q = searchRaw.trim().toLowerCase();
  if (q) {
    const hay = [
      p.name,
      p.category,
      p.id,
      htmlToPlainText(p.description),
      p.material,
      p.moq,
      String(p.price ?? ''),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (categoryFilter !== 'all') {
    if (p.category.trim().toLowerCase() !== categoryFilter.trim().toLowerCase()) return false;
  }
  if (statusFilter === 'active' && !p.is_active) return false;
  if (statusFilter === 'inactive' && p.is_active) return false;
  if (featuredFilter === 'featured' && !p.is_featured) return false;
  if (featuredFilter === 'not' && p.is_featured) return false;
  return true;
}

function mergeProductCategoryOptions(
  defaults: readonly string[],
  extras: string[],
  productCategoryValues: string[]
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (c: string) => {
    const t = c.trim();
    if (!t) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };
  for (const c of defaults) add(c);
  for (const c of extras) add(c);
  for (const c of productCategoryValues) add(c);
  return out;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  material: string;
  print_type: string;
  packaging: string;
  moq: string;
  price: number;
  image_url: string;
  gallery_images?: string[];
  specifications: any;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

export default function ProductsManager() {
  const { token } = useAuth();
  const MULTI_CURRENCY_ENABLED = false;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    material: '100% GOTS-certified cotton',
    print_type: 'Water-based inks',
    packaging: 'FSC-certified hangtags and labels',
    moq: '',
    price: 0,
    specifications: '{}',
    is_featured: false
  });
  
  // Multi-currency pricing state
  const [pricing, setPricing] = useState({
    inr: { amount: 0, enabled: true },
    usd: { amount: 0, enabled: false },
    eur: { amount: 0, enabled: false },
    gbp: { amount: 0, enabled: false },
    aed: { amount: 0, enabled: false },
    sar: { amount: 0, enabled: false },
    qar: { amount: 0, enabled: false },
    kwd: { amount: 0, enabled: false }
  });
  
  const [selectedCurrency, setSelectedCurrency] = useState<'inr' | 'usd' | 'eur' | 'gbp' | 'aed' | 'sar' | 'qar' | 'kwd'>('inr');
  const [showPricingSection, setShowPricingSection] = useState(false);
  
  const currencies = [
    { code: 'inr', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', region: 'Asia' },
    { code: 'usd', symbol: '$', name: 'US Dollar', flag: '🇺🇸', region: 'Americas' },
    { code: 'eur', symbol: '€', name: 'Euro', flag: '🇪🇺', region: 'Europe' },
    { code: 'gbp', symbol: '£', name: 'British Pound', flag: '🇬🇧', region: 'Europe' },
    { code: 'aed', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', region: 'Middle East' },
    { code: 'sar', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦', region: 'Middle East' },
    { code: 'qar', symbol: 'ر.ق', name: 'Qatari Riyal', flag: '🇶🇦', region: 'Middle East' },
    { code: 'kwd', symbol: 'د.ك', name: 'Kuwaiti Dinar', flag: '🇰🇼', region: 'Middle East' }
  ];
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewProductId, setPreviewProductId] = useState<string | null>(null);
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryAddError, setCategoryAddError] = useState<string | null>(null);
  const [showAddCategoryPanel, setShowAddCategoryPanel] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterFeatured, setFilterFeatured] = useState<'all' | 'featured' | 'not'>('all');
  const [page, setPage] = useState(1);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  // Use context token or localStorage so the first request (before context hydrates) still sends auth
  const authHeaders = () => {
    const t = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null);
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  useEffect(() => {
    const t = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null);
    if (t) fetchProducts();
    else setLoading(false);
  }, [token]);

  useEffect(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ADMIN_CATEGORIES_STORAGE_KEY) : null;
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setExtraCategories(parsed.filter((x): x is string => typeof x === 'string'));
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/products`, { headers: authHeaders() });
      setProducts(normalizeProducts(response.data));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    let specs: Record<string, unknown> = {};
    try {
      let parsed: unknown = formData.specifications ? JSON.parse(formData.specifications) : {};
      // Backend may return specs as a string; parse until we have an object
      while (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      specs = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    } catch {
      setSubmitError('Specifications must be valid JSON.');
      setSubmitting(false);
      return;
    }
    if (isQuillDescriptionEmpty(formData.description)) {
      setSubmitError('Please enter a product description.');
      setSubmitting(false);
      return;
    }
    if (MULTI_CURRENCY_ENABLED) {
      specs.pricing = pricing;
    }

    const priceForDb = MULTI_CURRENCY_ENABLED
      ? legacyPriceFromMultiCurrency(pricing as Record<string, { amount: number; enabled: boolean }>) || formData.price
      : formData.price || 0;

    const submitData = new FormData();
    const formPayload = { ...formData, price: priceForDb };
    Object.entries(formPayload).forEach(([key, value]) => {
      if (key === 'specifications') {
        submitData.append(key, JSON.stringify(specs));
      } else {
        submitData.append(key, value.toString());
      }
    });

    imageFiles.slice(0, MAX_PRODUCT_PHOTOS).forEach((file) => {
      submitData.append('images', file);
    });

    try {
      if (editingProduct) {
        await axios.put(`${API_BASE_URL}/admin/products/${editingProduct.id}`, submitData, {
          headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API_BASE_URL}/admin/products`, submitData, {
          headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchProducts();
      resetForm();
      setShowModal(false);
    } catch (err: unknown) {
      const ax = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { error?: string }; status?: number } }).response : null;
      const data = ax && typeof ax === 'object' && 'data' in ax ? (ax as { data?: { error?: string } }).data : null;
      const message = data?.error || (ax?.status === 401 ? 'Please log in again.' : 'Failed to save product. Check console for details.');
      setSubmitError(message);
      console.error('Error saving product:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    // Normalize specifications: API may return object or JSON string
    let specObj = product.specifications;
    if (typeof specObj === 'string') {
      try {
        specObj = JSON.parse(specObj);
      } catch {
        specObj = {};
      }
    }
    const specStr = typeof specObj === 'object' && specObj !== null
      ? JSON.stringify(specObj)
      : '{}';
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description,
      material: product.material,
      print_type: product.print_type,
      packaging: product.packaging,
      moq: product.moq,
      price: product.price,
      specifications: specStr,
      is_featured: product.is_featured
    });

    // Load pricing data if available; otherwise clear so a previous product's row state cannot leak
    const specs = specObj as Record<string, unknown>;
    if (MULTI_CURRENCY_ENABLED && specs && typeof specs.pricing === 'object' && specs.pricing !== null) {
      setPricing(specs.pricing as typeof pricing);
    } else {
      setPricing({
        inr: { amount: 0, enabled: true },
        usd: { amount: 0, enabled: false },
        eur: { amount: 0, enabled: false },
        gbp: { amount: 0, enabled: false },
        aed: { amount: 0, enabled: false },
        sar: { amount: 0, enabled: false },
        qar: { amount: 0, enabled: false },
        kwd: { amount: 0, enabled: false }
      });
    }

    setSubmitError(null);
    setNewCategoryName('');
    setCategoryAddError(null);
    setShowAddCategoryPanel(false);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API_BASE_URL}/admin/products/${id}`, { headers: authHeaders() });
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      material: '100% GOTS-certified cotton',
      print_type: 'Water-based inks',
      packaging: 'FSC-certified hangtags and labels',
      moq: '',
      price: 0,
      specifications: '{}',
      is_featured: false
    });
    setPricing({
      inr: { amount: 0, enabled: true },
      usd: { amount: 0, enabled: false },
      eur: { amount: 0, enabled: false },
      gbp: { amount: 0, enabled: false },
      aed: { amount: 0, enabled: false },
      sar: { amount: 0, enabled: false },
      qar: { amount: 0, enabled: false },
      kwd: { amount: 0, enabled: false }
    });
    setSelectedCurrency('inr');
    setImageFiles([]);
    setEditingProduct(null);
    setNewCategoryName('');
    setCategoryAddError(null);
    setShowAddCategoryPanel(false);
  };

  const categories = useMemo(
    () =>
      mergeProductCategoryOptions(
        DEFAULT_PRODUCT_CATEGORIES,
        extraCategories,
        products.map((p) => p.category || '')
      ),
    [extraCategories, products]
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((p) =>
        productMatchesAdminFilters(p, searchQuery, filterCategory, filterStatus, filterFeatured)
      ),
    [products, searchQuery, filterCategory, filterStatus, filterFeatured]
  );

  const totalPages = useMemo(() => {
    if (filteredProducts.length === 0) return 1;
    return Math.ceil(filteredProducts.length / PRODUCTS_PAGE_SIZE);
  }, [filteredProducts.length]);

  const effectivePage = Math.min(Math.max(1, page), totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (effectivePage - 1) * PRODUCTS_PAGE_SIZE;
    return filteredProducts.slice(start, start + PRODUCTS_PAGE_SIZE);
  }, [filteredProducts, effectivePage]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterCategory, filterStatus, filterFeatured]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const filterSelectClass =
    'min-w-0 sm:min-w-[10.5rem] px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500';

  const addCustomCategory = () => {
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryAddError('Enter a category name.');
      return;
    }
    const match = categories.find((c) => c.toLowerCase() === name.toLowerCase());
    if (match) {
      setFormData((fd) => ({ ...fd, category: match }));
      setNewCategoryName('');
      setCategoryAddError('That category already exists — it is selected below.');
      return;
    }
    const nextExtras = [...extraCategories, name];
    setExtraCategories(nextExtras);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ADMIN_CATEGORIES_STORAGE_KEY, JSON.stringify(nextExtras));
    }
    setFormData((fd) => ({ ...fd, category: name }));
    setNewCategoryName('');
    setCategoryAddError(null);
    setShowAddCategoryPanel(false);
  };

  const removeActiveCurrency = (code: keyof typeof pricing) => {
    setPricing((prev) => ({
      ...prev,
      [code]: { amount: 0, enabled: false }
    }));
  };

  const fieldLabelClass = 'block text-sm font-semibold text-slate-700 mb-1.5';
  const fieldInputClass =
    'w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Products</h1>
          <p className="text-slate-600">Manage your product catalog</p>
        </div>
        <button
          onClick={() => {
            setSubmitError(null);
            setNewCategoryName('');
            setCategoryAddError(null);
            setShowModal(true);
          }}
          className="flex shrink-0 items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors w-full sm:w-auto"
        >
          <Plus size={20} className="mr-2" />
          Add Product
        </button>
      </div>

      {/* Search + filters */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="relative flex-1 min-w-0 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, ID, description…"
              className={`${fieldInputClass} pl-10`}
              aria-label="Search products"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:min-w-[10.5rem]">
              Category
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={filterSelectClass}
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:min-w-[10.5rem]">
              Status
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className={filterSelectClass}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:min-w-[10.5rem]">
              Featured
              <select
                value={filterFeatured}
                onChange={(e) => setFilterFeatured(e.target.value as 'all' | 'featured' | 'not')}
                className={filterSelectClass}
              >
                <option value="all">All products</option>
                <option value="featured">Featured only</option>
                <option value="not">Not featured</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
                setFilterStatus('all');
                setFilterFeatured('all');
                setPage(1);
              }}
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 sm:self-end sm:mb-2.5 sm:ml-1"
            >
              Clear filters
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {filteredProducts.length === 0 ? (
            <>No products match the current filters.</>
          ) : (
            <>
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {(effectivePage - 1) * PRODUCTS_PAGE_SIZE + 1}
                –
                {Math.min(effectivePage * PRODUCTS_PAGE_SIZE, filteredProducts.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{filteredProducts.length}</span>
              {filteredProducts.length !== products.length ? (
                <span className="text-slate-500"> (filtered from {products.length})</span>
              ) : null}
            </>
          )}
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProducts.length === 0 && products.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center text-slate-600">
            No products yet. Click &quot;Add Product&quot; to create your first item.
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center text-slate-600">
            No products match your search or filters. Try adjusting filters or{' '}
            <button type="button" className="font-semibold text-emerald-700 underline" onClick={() => {
              setSearchQuery('');
              setFilterCategory('all');
              setFilterStatus('all');
              setFilterFeatured('all');
              setPage(1);
            }}>
              clear filters
            </button>
            .
          </div>
        ) : (
          paginatedProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setPreviewProductId(product.id)}
              className="block w-full text-left hover:opacity-95 transition-opacity cursor-pointer"
              title="Preview as customer"
            >
              <div className="relative h-48 bg-slate-100">
                {product.image_url ? (
                  <img
                    src={resolveMediaUrl(product.image_url)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    width={800}
                    height={800}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="text-slate-400" size={48} />
                  </div>
                )}
                {product.is_featured && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                    <Star size={12} className="mr-1" />
                    Featured
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-1">{product.name}</h3>
                <p className="text-sm text-slate-600 mb-2">{product.category}</p>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{htmlToPlainText(product.description)}</p>
                {/* Display multi-currency prices (parsed specs) or legacy price column */}
                <div className="mb-3">
                  {product.specifications?.pricing ? (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(product.specifications.pricing).map(([code, data]: [string, any]) => {
                        const curr = currencies.find(c => c.code === code);
                        const amt = typeof data?.amount === 'number' ? data.amount : parseFloat(String(data?.amount)) || 0;
                        return data?.enabled && amt > 0 && curr ? (
                          <span key={code} className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                            <span>{curr.symbol}{amt.toFixed(2)}</span>
                          </span>
                        ) : null;
                      })}
                    </div>
                  ) : null}
                  {(!product.specifications?.pricing ||
                    !Object.values(product.specifications.pricing as Record<string, { amount?: number; enabled?: boolean }>).some(
                      (d) => d?.enabled && (typeof d?.amount === 'number' ? d.amount : parseFloat(String(d?.amount)) || 0) > 0
                    )) && (
                    <p className="text-lg font-bold text-emerald-600">
                      ${Number(product.price).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </button>
            <div className="px-4 pb-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPreviewProductId(product.id)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Preview as customer"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit product"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete product"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center text-xs text-slate-500">
                  <Eye size={12} className="mr-1" />
                  {product.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
          </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && paginatedProducts.length > 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <button
            type="button"
            disabled={effectivePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-sm font-medium text-slate-600 tabular-nums">
            Page {effectivePage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={effectivePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      {previewProductId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">
                Preview: {products.find((p) => p.id === previewProductId)?.name ?? 'Product'}
              </h2>
              <button
                type="button"
                onClick={() => setPreviewProductId(null)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close preview"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 min-h-0 p-4">
              <iframe
                title="Product preview"
                src={`${window.location.origin}/products/${previewProductId}`}
                className="w-full h-full min-h-[70vh] rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
            <div className="p-6 md:p-7 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Fill in product details, pricing, and images. Fields are aligned for fast entry.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-7 space-y-6 bg-slate-50/40">
              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
                  {submitError}
                </div>
              )}

              <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Basic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={fieldLabelClass}>Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={fieldInputClass}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={fieldLabelClass}>Category</label>
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCategoryPanel((v) => !v);
                          setCategoryAddError(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800 hover:bg-emerald-100"
                      >
                        <FolderPlus size={14} />
                        Add category
                        {showAddCategoryPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                    {showAddCategoryPanel && (
                      <div className="mb-3 rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-3 space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => {
                              setNewCategoryName(e.target.value);
                              setCategoryAddError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomCategory();
                              }
                            }}
                            placeholder="New category name…"
                            className={`${fieldInputClass} sm:flex-1`}
                            aria-label="New category name"
                          />
                          <button
                            type="button"
                            onClick={addCustomCategory}
                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                          >
                            <FolderPlus size={18} />
                            Add
                          </button>
                        </div>
                        {categoryAddError && (
                          <p className="text-xs text-amber-800" role="status">
                            {categoryAddError}
                          </p>
                        )}
                      </div>
                    )}
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={fieldInputClass}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={fieldLabelClass}>Description</label>
                  <p className="text-xs text-slate-500 mb-2">
                    Use headings, lists, and emphasis for a structured product story. Plain text from older products still works if you do not add formatting.
                  </p>
                  <ProductRichTextEditor
                    value={formData.description}
                    onChange={(html) => setFormData({ ...formData, description: html })}
                  />
                </div>
              </section>

              {/* Multi-Currency Pricing Section (collapsible & currently disabled) */}
              <section className="rounded-xl border border-emerald-200 p-4 md:p-5 bg-emerald-50/30">
                <button
                  type="button"
                  onClick={() => setShowPricingSection((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg border border-emerald-200 bg-white px-3 py-2 text-left"
                >
                  <span className="block">
                    <span className="block text-sm font-bold text-slate-900">
                      💰 Multi-Currency Pricing (Global Markets)
                    </span>
                    <span className="mt-0.5 block text-xs font-medium text-amber-700">
                      Currently disabled – you can ignore this for now.
                    </span>
                  </span>
                  <span className="ml-3 inline-flex items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                      Disabled
                    </span>
                    {showPricingSection ? (
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </span>
                </button>

                {!showPricingSection ? null : (
                  <>
                    {/* Currency Selector Tabs - Organized by Region */}
                <div className="space-y-3 mb-4 mt-4 opacity-60 pointer-events-none">
                  {/* Asia */}
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">🌏 Asia</p>
                    <div className="flex flex-wrap gap-2">
                      {currencies.filter(c => c.region === 'Asia').map((currency) => (
                        <button
                          key={currency.code}
                          type="button"
                          onClick={() => setSelectedCurrency(currency.code as any)}
                          className={`inline-flex min-w-[116px] justify-center items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${
                            selectedCurrency === currency.code
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <span className="text-lg">{currency.flag}</span>
                          <span>{currency.symbol}</span>
                          <span className="text-xs uppercase font-bold">{currency.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Americas */}
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">🌎 Americas</p>
                    <div className="flex flex-wrap gap-2">
                      {currencies.filter(c => c.region === 'Americas').map((currency) => (
                        <button
                          key={currency.code}
                          type="button"
                          onClick={() => setSelectedCurrency(currency.code as any)}
                          className={`inline-flex min-w-[116px] justify-center items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${
                            selectedCurrency === currency.code
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <span className="text-lg">{currency.flag}</span>
                          <span>{currency.symbol}</span>
                          <span className="text-xs uppercase font-bold">{currency.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Europe */}
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">🌍 Europe</p>
                    <div className="flex flex-wrap gap-2">
                      {currencies.filter(c => c.region === 'Europe').map((currency) => (
                        <button
                          key={currency.code}
                          type="button"
                          onClick={() => setSelectedCurrency(currency.code as any)}
                          className={`inline-flex min-w-[116px] justify-center items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${
                            selectedCurrency === currency.code
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <span className="text-lg">{currency.flag}</span>
                          <span>{currency.symbol}</span>
                          <span className="text-xs uppercase font-bold">{currency.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Middle East */}
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">🕌 Middle East</p>
                    <div className="flex flex-wrap gap-2">
                      {currencies.filter(c => c.region === 'Middle East').map((currency) => (
                        <button
                          key={currency.code}
                          type="button"
                          onClick={() => setSelectedCurrency(currency.code as any)}
                          className={`inline-flex min-w-[116px] justify-center items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${
                            selectedCurrency === currency.code
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <span className="text-lg">{currency.flag}</span>
                          <span className="text-sm">{currency.symbol}</span>
                          <span className="text-xs uppercase font-bold">{currency.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selected Currency Input */}
                {currencies.map((currency) => (
                  selectedCurrency === currency.code && (
                    <div key={currency.code} className="space-y-3 mt-2 opacity-60 pointer-events-none">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          id={`enable-${currency.code}`}
                          checked={pricing[currency.code as keyof typeof pricing].enabled}
                          onChange={(e) => setPricing({
                            ...pricing,
                            [currency.code]: { ...pricing[currency.code as keyof typeof pricing], enabled: e.target.checked }
                          })}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor={`enable-${currency.code}`} className="text-sm font-medium text-slate-700">
                          Enable {currency.name} pricing
                        </label>
                      </div>
                      
                      {pricing[currency.code as keyof typeof pricing].enabled && (
                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                          <span className="text-2xl text-slate-700">{currency.symbol}</span>
                          <input
                            type="number"
                            step="0.01"
                            value={pricing[currency.code as keyof typeof pricing].amount}
                            onChange={(e) => setPricing({
                              ...pricing,
                              [currency.code]: { ...pricing[currency.code as keyof typeof pricing], amount: parseFloat(e.target.value) || 0 }
                            })}
                            placeholder={`Enter price in ${currency.name}`}
                            className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-semibold"
                          />
                          <span className="text-sm text-slate-600 font-medium">{currency.code.toUpperCase()}</span>
                        </div>
                      )}
                      
                      {/* Display all enabled prices */}
                      <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                        <p className="text-xs font-semibold text-slate-600 mb-2">Active Prices:</p>
                        <p className="text-xs text-slate-500 mb-2">Use × to remove a currency; turn it on again with the regional tabs if needed.</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(pricing).map(([code, data]) => {
                            const curr = currencies.find(c => c.code === code);
                            return data.enabled && data.amount > 0 && curr ? (
                              <span
                                key={code}
                                className="group inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium"
                              >
                                <span className="flex items-center gap-1">
                                  <span>{curr.flag}</span>
                                  <span>{curr.symbol}{data.amount.toFixed(2)}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeActiveCurrency(code as keyof typeof pricing)}
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-emerald-700/80 hover:bg-emerald-200/80 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  title={`Remove ${curr.name} price`}
                                  aria-label={`Remove ${curr.name} price`}
                                >
                                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                                </button>
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  )
                ))}
                  </>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Inventory & Media</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <label className={fieldLabelClass}>MOQ (Minimum Order Quantity)</label>
                    <input
                      type="text"
                      value={formData.moq}
                      onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                      className={fieldInputClass}
                      placeholder="e.g., 100 units"
                    />
                  </div>

                  <div className="flex items-center pt-7">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="is_featured" className="text-sm font-medium text-slate-700">
                      Featured Product
                    </label>
                  </div>
                </div>

                <div>
                  <label className={fieldLabelClass}>Product Photos</label>
                <p className="text-xs text-slate-500 mb-2">
                  Add up to {MAX_PRODUCT_PHOTOS} photos. You can select multiple files at once or choose again to replace.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setImageFiles(files.slice(0, MAX_PRODUCT_PHOTOS));
                    e.target.value = '';
                  }}
                  className={`${fieldInputClass} file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100`}
                />
                {/* Current product images when editing */}
                {editingProduct && (editingProduct.image_url || (Array.isArray(editingProduct.gallery_images) && editingProduct.gallery_images.length > 0)) && imageFiles.length === 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 mb-1">Current photos:</p>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(editingProduct.gallery_images) && editingProduct.gallery_images.length > 0
                        ? editingProduct.gallery_images
                        : editingProduct.image_url ? [editingProduct.image_url] : []
                      ).map((url: string, i: number) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                          <img
                            src={resolveMediaUrl(url)}
                            alt={`Current ${i + 1}`}
                            className="w-full h-full object-cover"
                            width={96}
                            height={96}
                            loading="lazy"
                          />
                          <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                            {i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* New upload previews */}
                {imageFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 mb-1">New photos ({imageFiles.length}/{MAX_PRODUCT_PHOTOS}):</p>
                    <div className="flex flex-wrap gap-2">
                      {imageFiles.map((file, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-full object-cover"
                            width={96}
                            height={96}
                            loading="lazy"
                          />
                          <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                            Photo {i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                            aria-label="Remove photo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </section>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 bg-white sticky bottom-0 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitError(null);
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving…' : editingProduct ? 'Update' : 'Create'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}