import { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Mail,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  Send,
  Inbox,
  Trash2,
  Filter,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../lib/api';

interface Inquiry {
  id: string;
  name: string;
  company: string;
  email: string;
  region: string;
  order_type: string;
  message: string;
  status: string;
  created_at: string;
}

const STATUS_ORDER = ['new', 'contacted', 'completed'] as const;
type StatusKey = (typeof STATUS_ORDER)[number] | 'all';

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  new: {
    label: 'New',
    className: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80',
    dot: 'bg-sky-500',
  },
  contacted: {
    label: 'Contacted',
    className: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80',
    dot: 'bg-amber-500',
  },
  completed: {
    label: 'Done',
    className: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  default: {
    label: 'Other',
    className: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
    dot: 'bg-slate-400',
  },
};

function getStatusStyle(status: string) {
  return statusConfig[status] ?? statusConfig.default;
}

export default function InquiriesManager() {
  const { token } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);

  const authHeaders = () => {
    const t = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null);
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  useEffect(() => {
    const t = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null);
    if (t) fetchInquiries();
    else setLoading(false);
  }, [token]);

  const fetchInquiries = async () => {
    setListMessage(null);
    try {
      const response = await axios.get<Inquiry[]>(`${API_BASE_URL}/admin/inquiries`, { headers: authHeaders() });
      setInquiries(response.data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/inquiries/${id}`, { status }, { headers: authHeaders() });
      await fetchInquiries();
      if (selectedInquiry?.id === id) {
        setSelectedInquiry((cur) => (cur ? { ...cur, status } : null));
      }
    } catch (error) {
      console.error('Error updating inquiry status:', error);
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!window.confirm('Delete this inquiry permanently? This cannot be undone.')) {
      return;
    }
    setDeletingId(id);
    setListMessage(null);
    try {
      await axios.post(
        `${API_BASE_URL}/admin/inquiries/${encodeURIComponent(id)}/delete`,
        {},
        { headers: authHeaders() }
      );
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
      await fetchInquiries();
      setListMessage('Inquiry removed from your list.');
    } catch (error: unknown) {
      console.error('Error deleting inquiry:', error);
      const ax = error && typeof error === 'object' && 'response' in error ? (error as { response?: { data?: { error?: string }; status?: number } }).response : null;
      const serverMsg = ax?.data && typeof ax.data === 'object' && 'error' in ax.data ? String((ax.data as { error?: string }).error) : '';
      setListMessage(serverMsg ? `Could not delete: ${serverMsg}` : 'Could not delete. Try again or check that the API allows POST /admin/inquiries/:id/delete.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredInquiries = useMemo(
    () => inquiries.filter((q) => statusFilter === 'all' || q.status === statusFilter),
    [inquiries, statusFilter]
  );

  const counts = useMemo(() => {
    const c = { all: inquiries.length, new: 0, contacted: 0, completed: 0 };
    for (const i of inquiries) {
      if (i.status === 'new') c.new += 1;
      else if (i.status === 'contacted') c.contacted += 1;
      else if (i.status === 'completed') c.completed += 1;
    }
    return c;
  }, [inquiries]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-emerald-50/30 p-6 sm:p-8 mb-8 shadow-sm">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-200/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700/90 mb-1">Lead inbox</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Inquiries</h1>
              <p className="text-slate-600 mt-2 max-w-xl">
                Review and respond to contact form submissions. Update status as you work through each lead, or remove entries you no longer need.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200/60">
                <Inbox className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-slate-900">{counts.all}</span>
                <span className="text-slate-500">total</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(
              [
                { key: 'all' as const, label: 'All', count: counts.all },
                { key: 'new', label: 'New', count: counts.new },
                { key: 'contacted', label: 'Contacted', count: counts.contacted },
                { key: 'completed', label: 'Done', count: counts.completed },
              ] as const
            ).map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                  statusFilter === key
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {label}
                <span
                  className={
                    statusFilter === key
                      ? 'rounded-full bg-white/20 px-1.5 text-xs'
                      : 'rounded-full bg-slate-100 px-1.5 text-xs text-slate-500'
                  }
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {listMessage && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/90 px-4 py-2.5 text-sm text-emerald-900">
          {listMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Filter className="h-4 w-4" />
            <span>
              Showing <strong className="text-slate-800">{filteredInquiries.length}</strong>
              {statusFilter === 'all' ? ' inquiries' : ` · ${getStatusStyle(statusFilter).label}`}
            </span>
          </div>

          {filteredInquiries.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-3 font-medium text-slate-800">No inquiries in this view</p>
              <p className="text-sm text-slate-500 mt-1">Try another filter, or new submissions will show up here.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredInquiries.map((inquiry) => {
                const st = getStatusStyle(inquiry.status);
                const isSelected = selectedInquiry?.id === inquiry.id;
                const initial = (inquiry.name || '?').charAt(0).toUpperCase();
                return (
                  <li key={inquiry.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedInquiry(inquiry)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedInquiry(inquiry)}
                      className={`group relative overflow-hidden rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-300 bg-white shadow-md ring-2 ring-emerald-200/50'
                          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div
                        className={`absolute left-0 top-0 h-full w-1 ${isSelected ? 'bg-emerald-500' : 'bg-slate-200 group-hover:bg-emerald-400/50'}`}
                      />
                      <div className="pl-4 pr-3 py-4 sm:pl-5 sm:pr-4 sm:py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 flex-1 gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-sm">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-slate-900 truncate">{inquiry.name}</h3>
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.className}`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                  {st.label}
                                </span>
                              </div>
                              {inquiry.company ? (
                                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                                  <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                  <span className="truncate">{inquiry.company}</span>
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 sm:ml-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteInquiry(inquiry.id);
                              }}
                              disabled={deletingId === inquiry.id}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title="Delete inquiry"
                              aria-label="Delete inquiry"
                            >
                              {deletingId === inquiry.id ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 text-sm text-slate-600">
                          <a
                            href={`mailto:${inquiry.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50/80 px-2 py-1.5 text-slate-800 ring-1 ring-slate-100 transition hover:bg-emerald-50/80 hover:ring-emerald-100"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span className="truncate text-emerald-800">{inquiry.email}</span>
                          </a>
                          {inquiry.region ? (
                            <div className="flex items-center gap-2 text-slate-600">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              {inquiry.region}
                            </div>
                          ) : null}
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
                          {inquiry.message}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(inquiry.created_at)}
                          </span>
                          {inquiry.order_type ? (
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                              {inquiry.order_type}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selectedInquiry ? (
            <div className="sticky top-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Selected inquiry</h2>
                <p className="mt-1 text-lg font-semibold text-slate-900">{selectedInquiry.name}</p>
              </div>
              <div className="space-y-5 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-slate-500">Status</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(selectedInquiry.status).className}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${getStatusStyle(selectedInquiry.status).dot}`} />
                    {getStatusStyle(selectedInquiry.status).label}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="flex items-center gap-3 rounded-xl bg-emerald-50/60 p-3 ring-1 ring-emerald-100/80 transition hover:bg-emerald-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Mail className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500">Email</p>
                      <p className="font-medium text-emerald-900 truncate">{selectedInquiry.email}</p>
                    </div>
                  </a>
                  {selectedInquiry.company ? (
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                      <Building2 className="mt-0.5 h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-xs font-medium text-slate-500">Company</p>
                        <p className="text-slate-800">{selectedInquiry.company}</p>
                      </div>
                    </div>
                  ) : null}
                  {selectedInquiry.region ? (
                    <div className="flex items-center gap-3 text-slate-700">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Region</p>
                        <p>{selectedInquiry.region}</p>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-3 text-slate-600">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Received</p>
                      <p>{formatDate(selectedInquiry.created_at)}</p>
                    </div>
                  </div>
                </div>

                {selectedInquiry.order_type ? (
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 mb-1.5">Order type</p>
                    <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800">
                      {selectedInquiry.order_type}
                    </span>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Message</p>
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {selectedInquiry.message}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Update status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ORDER.map((status) => {
                      const s = getStatusStyle(status);
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateStatus(selectedInquiry.id, status)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                            selectedInquiry.status === status
                              ? s.className + ' shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {status === 'new' && <Inbox className="h-3.5 w-3.5" />}
                          {status === 'contacted' && <Send className="h-3.5 w-3.5" />}
                          {status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => deleteInquiry(selectedInquiry.id)}
                    disabled={deletingId === selectedInquiry.id}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingId === selectedInquiry.id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete this inquiry
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <MessageSquare className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-4 font-medium text-slate-800">Select a conversation</p>
              <p className="text-sm text-slate-500 mt-1">Click an inquiry on the left to read the full message and change status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
