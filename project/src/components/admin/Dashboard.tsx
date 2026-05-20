import { type ReactNode, useMemo, useState, useEffect } from 'react';
import {
  Package,
  MessageSquare,
  FileText,
  Star,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  BarChart3,
  Activity,
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  category: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  status: string;
  region?: string;
  created_at: string;
}

interface ContentSection {
  id: string;
  section_key: string;
  title: string;
  is_active: boolean;
  updated_at: string;
}

interface StatsSnapshot {
  totalProducts: number;
  activeProducts: number;
  totalInquiries: number;
  pendingInquiries: number;
  contactedInquiries: number;
  completedInquiries: number;
  featuredProducts: number;
  totalContentSections: number;
  activeContentSections: number;
}

interface LayeredCardProps {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  accentClassName?: string;
}

function LayeredCard({
  children,
  className = '',
  bodyClassName = 'p-6',
  accentClassName = 'from-slate-200 to-slate-100',
}: LayeredCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className={`h-1 rounded-t-2xl bg-gradient-to-r ${accentClassName}`} />
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<StatsSnapshot | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const authHeaders = () => {
    const t = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null);
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  useEffect(() => {
    const t = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null);
    if (t) fetchDashboardData();
    else setLoading(false);
  }, [token]);

  const fetchDashboardData = async () => {
    setError(null);
    try {
      const [productsRes, inquiriesRes, contentRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/products`, { headers: authHeaders() }),
        axios.get(`${API_BASE_URL}/admin/inquiries`, { headers: authHeaders() }),
        axios.get(`${API_BASE_URL}/admin/content`, { headers: authHeaders() }),
      ]);

      const productsList = (productsRes.data || []) as Product[];
      const inquiriesList = (inquiriesRes.data || []) as Inquiry[];
      const sectionsList = (contentRes.data || []) as ContentSection[];

      setProducts(productsList);
      setInquiries(inquiriesList);
      setContentSections(sectionsList);

      setStats({
        totalProducts: productsList.length,
        activeProducts: productsList.filter((p) => p.is_active !== false).length,
        totalInquiries: inquiriesList.length,
        pendingInquiries: inquiriesList.filter((i) => i.status === 'new').length,
        contactedInquiries: inquiriesList.filter((i) => i.status === 'contacted').length,
        completedInquiries: inquiriesList.filter((i) => i.status === 'completed').length,
        featuredProducts: productsList.filter((p) => p.is_featured).length,
        totalContentSections: sectionsList.length,
        activeContentSections: sectionsList.filter((s) => s.is_active).length,
      });
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshDashboard = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const inquiryResolutionRate = useMemo(() => {
    if (!stats) return 0;
    if (stats.totalInquiries === 0) return 0;
    return Math.round((stats.completedInquiries / stats.totalInquiries) * 100);
  }, [stats]);

  const featuredCoverage = useMemo(() => {
    if (!stats) return 0;
    if (stats.totalProducts === 0) return 0;
    return Math.round((stats.featuredProducts / stats.totalProducts) * 100);
  }, [stats]);

  const latestInquiries = useMemo(() => {
    return [...inquiries]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [inquiries]);

  const newestProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [products]);

  const recentlyUpdatedSections = useMemo(() => {
    return [...contentSections]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [contentSections]);

  const statCards = stats ? [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      subtitle: `${stats.activeProducts} active`,
      accentClass: 'from-blue-400 to-cyan-400',
    },
    {
      title: 'Total Inquiries',
      value: stats.totalInquiries,
      icon: MessageSquare,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      subtitle: `${stats.pendingInquiries} pending`,
      accentClass: 'from-emerald-400 to-teal-400',
    },
    {
      title: 'Resolution Rate',
      value: `${inquiryResolutionRate}%`,
      icon: CheckCircle2,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      subtitle: `${stats.completedInquiries} completed`,
      accentClass: 'from-amber-400 to-yellow-300',
    },
    {
      title: 'Content Coverage',
      value: `${stats.activeContentSections}/${stats.totalContentSections}`,
      icon: FileText,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      subtitle: 'Active sections',
      accentClass: 'from-purple-400 to-fuchsia-400',
    },
  ] : [];

  const statusPill = (status: string) => {
    if (status === 'new') return 'bg-blue-100 text-blue-700';
    if (status === 'contacted') return 'bg-amber-100 text-amber-700';
    if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-700';
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Command center for products, inquiries, and content operations.</p>
          {lastSyncedAt && (
            <p className="mt-1 text-xs text-slate-500">Last synced: {lastSyncedAt.toLocaleTimeString()}</p>
          )}
        </div>
        <button
          type="button"
          onClick={refreshDashboard}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh data'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {!stats ? (
        <LayeredCard bodyClassName="p-8" accentClassName="from-slate-300 to-slate-200">
          <div className="text-center">
            <p className="text-slate-800 font-semibold">No live dashboard data available yet.</p>
            <p className="text-slate-500 text-sm mt-1">Click refresh after backend/API is reachable.</p>
          </div>
        </LayeredCard>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <LayeredCard key={index} bodyClassName="p-6" accentClassName={card.accentClass}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">{card.title}</p>
                      <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
                    </div>
                    <div className={`${card.bgColor} p-3 rounded-lg`}>
                      <Icon className={card.textColor} size={24} />
                    </div>
                  </div>
                </LayeredCard>
              );
            })}
          </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <LayeredCard className="xl:col-span-2" bodyClassName="p-6" accentClassName="from-emerald-400 to-cyan-400">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-emerald-600" />
              Inquiry Pipeline
            </h2>
            <Link to="/admin/inquiries" className="text-sm text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1">
              Open inquiries
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">New</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.pendingInquiries}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Contacted</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{stats.contactedInquiries}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Completed</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.completedInquiries}</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm mb-2">
              <p className="text-slate-600">Resolution progress</p>
              <p className="font-semibold text-slate-800">{inquiryResolutionRate}%</p>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${inquiryResolutionRate}%` }} />
            </div>
          </div>
        </LayeredCard>

        <LayeredCard bodyClassName="p-6" accentClassName="from-purple-400 to-indigo-400">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-600" />
            Content Health
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Active sections</span>
              <span className="font-semibold text-slate-900">{stats.activeContentSections}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Inactive sections</span>
              <span className="font-semibold text-slate-900">
                {Math.max(0, stats.totalContentSections - stats.activeContentSections)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Featured product ratio</span>
              <span className="font-semibold text-slate-900">{featuredCoverage}%</span>
            </div>
          </div>
          <div className="mt-5 h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${featuredCoverage}%` }} />
          </div>
          <Link
            to="/admin/content"
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-purple-700 hover:text-purple-900"
          >
            Manage content
            <ArrowUpRight size={14} />
          </Link>
        </LayeredCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <LayeredCard className="xl:col-span-2" bodyClassName="p-6" accentClassName="from-blue-400 to-indigo-400">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Latest Inquiries</h2>
            <Link to="/admin/inquiries" className="text-sm text-blue-700 hover:text-blue-900 inline-flex items-center gap-1">
              View all
              <ArrowUpRight size={14} />
            </Link>
          </div>
          {latestInquiries.length === 0 ? (
            <p className="text-slate-500 text-sm">No inquiries available yet.</p>
          ) : (
            <div className="space-y-3">
              {latestInquiries.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.name}</p>
                    <p className="text-sm text-slate-500 truncate">{item.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusPill(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                      <Clock3 size={12} />
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </LayeredCard>

        <LayeredCard bodyClassName="p-6" accentClassName="from-slate-400 to-slate-300">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Content Updates</h2>
          {recentlyUpdatedSections.length === 0 ? (
            <p className="text-slate-500 text-sm">No content sections found.</p>
          ) : (
            <div className="space-y-3">
              {recentlyUpdatedSections.map((section) => (
                <div key={section.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="font-medium text-slate-900">{section.title}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{section.section_key}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${section.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {section.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </LayeredCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <LayeredCard className="xl:col-span-2" bodyClassName="p-6" accentClassName="from-emerald-400 to-lime-400">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Latest Products</h2>
            <Link to="/admin/products" className="text-sm text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1">
              Manage products
              <ArrowUpRight size={14} />
            </Link>
          </div>
          {newestProducts.length === 0 ? (
            <p className="text-slate-500 text-sm">No products available yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {newestProducts.map((product) => (
                <div key={product.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{product.category}</p>
                    </div>
                    {product.is_featured && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                        <Star size={12} />
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-3">Created {formatDate(product.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </LayeredCard>

        <LayeredCard bodyClassName="p-6" accentClassName="from-rose-300 to-orange-300">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/admin/products" className="block rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-4 py-3 transition-colors">
              <p className="font-medium text-slate-900">Manage Products</p>
              <p className="text-sm text-slate-600">Create, edit, and feature products.</p>
            </Link>
            <Link to="/admin/inquiries" className="block rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-100 px-4 py-3 transition-colors">
              <p className="font-medium text-slate-900">Respond to Inquiries</p>
              <p className="text-sm text-slate-600">Prioritize new customer messages.</p>
            </Link>
            <Link to="/admin/content" className="block rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-100 px-4 py-3 transition-colors">
              <p className="font-medium text-slate-900">Update Website Content</p>
              <p className="text-sm text-slate-600">Keep hero/about sections up to date.</p>
            </Link>
          </div>
        </LayeredCard>
      </div>
        </>
      )}
    </div>
  );
}