import { useState, useEffect, useMemo, useCallback } from 'react';
import { Mail, Building2, MapPin, Clock, Trash2, Inbox, Filter, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL, resolveMediaUrl, type SampleRequestRow } from '../../lib/api';
import { htmlToPlainText, sanitizeProductDescriptionHtml } from '../../lib/productDescriptionHtml';

const STATUS_ORDER = ['new', 'contacted', 'completed'] as const;
type StatusKey = (typeof STATUS_ORDER)[number] | 'all';

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  new: { label: 'New', className: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80', dot: 'bg-sky-500' },
  contacted: { label: 'Contacted', className: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80', dot: 'bg-amber-500' },
  completed: { label: 'Done', className: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80', dot: 'bg-emerald-500' },
  default: { label: 'Other', className: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200', dot: 'bg-slate-400' },
};

function getStatusStyle(status: string) {
  return statusConfig[status] ?? statusConfig.default;
}

function parseGalleryUrls(raw: SampleRequestRow['product_gallery_images']): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const j = JSON.parse(raw) as unknown;
      return Array.isArray(j) ? j.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function productImageUrls(row: SampleRequestRow): string[] {
  const main = row.product_image_url ? String(row.product_image_url) : '';
  const gallery = parseGalleryUrls(row.product_gallery_images);
  const combined = [main, ...gallery].filter(Boolean);
  return [...new Set(combined)];
}

function productDescriptionAsString(row: SampleRequestRow): string {
  const v = row.product_description as unknown;
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && 'type' in v && (v as { type?: string }).type === 'Buffer') {
    const data = (v as { data?: number[] }).data;
    if (Array.isArray(data)) {
      try {
        return new TextDecoder().decode(Uint8Array.from(data));
      } catch {
        return '';
      }
    }
  }
  return String(v);
}

function parseSpecs(raw: SampleRequestRow['product_specifications']): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const o = JSON.parse(raw) as unknown;
      return typeof o === 'object' && o !== null && !Array.isArray(o) ? (o as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return {};
}

export default function RequestedSamplesManager() {
  const { token } = useAuth();
  const [rows, setRows] = useState<SampleRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalRequest, setModalRequest] = useState<SampleRequestRow | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);

  const authHeaders = () => {
    const t = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null);
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  useEffect(() => {
    const t = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null);
    if (t) fetchRows();
    else setLoading(false);
  }, [token]);

  const fetchRows = async () => {
    setListMessage(null);
    try {
      const res = await axios.get<SampleRequestRow[]>(`${API_BASE_URL}/admin/sample-requests`, { headers: authHeaders() });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = useCallback((r: SampleRequestRow) => {
    setModalRequest(r);
    setActiveImageIndex(0);
  }, []);

  const closeModal = useCallback(() => {
    setModalRequest(null);
  }, []);

  useEffect(() => {
    if (!modalRequest) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [modalRequest, closeModal]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/sample-requests/${encodeURIComponent(id)}`, { status }, { headers: authHeaders() });
      await fetchRows();
      setModalRequest((cur) => (cur && cur.id === id ? { ...cur, status } : cur));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteRow = async (id: string) => {
    if (!window.confirm('Delete this sample request permanently?')) return;
    setDeletingId(id);
    setListMessage(null);
    try {
      await axios.post(
        `${API_BASE_URL}/admin/sample-requests/${encodeURIComponent(id)}/delete`,
        {},
        { headers: authHeaders() }
      );
      if (modalRequest?.id === id) closeModal();
      await fetchRows();
      setListMessage('Removed from list.');
    } catch (error: unknown) {
      const ax = error && typeof error === 'object' && 'response' in error ? (error as { response?: { data?: { error?: string } } }).response : null;
      const msg = ax?.data && typeof ax.data === 'object' && 'error' in ax.data ? String((ax.data as { error?: string }).error) : '';
      setListMessage(msg || 'Could not delete.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(
    () => rows.filter((r) => statusFilter === 'all' || r.status === statusFilter),
    [rows, statusFilter]
  );

  const counts = useMemo(() => {
    const c = { all: rows.length, new: 0, contacted: 0, completed: 0 };
    for (const r of rows) {
      if (r.status === 'new') c.new += 1;
      else if (r.status === 'contacted') c.contacted += 1;
      else if (r.status === 'completed') c.completed += 1;
    }
    return c;
  }, [rows]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const modalImages = modalRequest ? productImageUrls(modalRequest) : [];
  const modalSpecs = modalRequest ? parseSpecs(modalRequest.product_specifications) : {};
  const specEntries = Object.entries(modalSpecs).filter(([k]) => k !== 'pricing' && k !== 'pricing_json');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 md:px-0">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-amber-50/30 p-6 sm:p-8 mb-8 shadow-sm">
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-800/90 mb-1">Samples</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Requested samples</h1>
          <p className="text-slate-600 mt-2 max-w-xl">
            Click a row to view product images, catalog details, and the customer message. Same notification email as contact inquiries.
          </p>
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
                  statusFilter === key ? 'bg-amber-700 text-white shadow' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter className="h-3.5 w-3.5 opacity-70" />
                {label}
                <span className="tabular-nums opacity-80">{count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {listMessage ? <p className="text-sm text-emerald-800 mb-4">{listMessage}</p> : null}

      <div className="flex max-h-[min(75vh,720px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:max-h-[75vh]">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 text-slate-700 font-medium text-sm">
          <Inbox className="h-4 w-4 text-amber-600" />
          {filtered.length} request{filtered.length !== 1 ? 's' : ''}
        </div>
        <ul className="overflow-y-auto flex-1 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <li className="p-8 text-center text-slate-500 text-sm">No sample requests in this view.</li>
          ) : (
            filtered.map((r) => {
              const st = getStatusStyle(r.status);
              const open = modalRequest?.id === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => openModal(r)}
                    className={`w-full text-left px-4 py-3 transition-colors ${open ? 'bg-amber-50/90' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        <img
                          src={resolveMediaUrl(r.product_image_url)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{r.product_name}</p>
                            <p className="text-xs text-slate-500 truncate">{r.name} · {r.email}</p>
                          </div>
                          <span className={`shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${st.className}`}>{st.label}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(r.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {modalRequest ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sample-detail-title"
        >
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={closeModal} />
          <div
            className="relative z-10 flex max-h-[min(100dvh,900px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl md:max-w-4xl lg:max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
              <div className="min-w-0 flex-1 pr-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800/90 sm:text-xs">Sample request</p>
                <h2
                  id="sample-detail-title"
                  className="text-base font-bold leading-snug text-slate-900 line-clamp-2 sm:line-clamp-none sm:text-lg md:text-xl"
                >
                  {modalRequest.product_name}
                </h2>
                <p className="mt-0.5 break-all text-[10px] text-slate-500 font-mono sm:text-xs">
                  <span className="text-slate-400">Request ID: </span>
                  {modalRequest.id}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-800 touch-manipulation"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
              <div className="grid grid-cols-1 gap-5 p-3 sm:gap-6 sm:p-5 md:grid-cols-2 md:gap-8 md:p-6 lg:gap-10">
                <div className="min-w-0 space-y-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Product images</p>
                  <div className="mx-auto aspect-square w-full max-h-[min(70vw,280px)] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:max-h-[320px] md:max-h-[380px] md:mx-0">
                    {modalImages.length > 0 ? (
                      <img
                        src={resolveMediaUrl(modalImages[Math.min(activeImageIndex, modalImages.length - 1)])}
                        alt=""
                        className="h-full w-full object-contain object-center"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">No images on file</div>
                    )}
                  </div>
                  {modalImages.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      {modalImages.map((url, i) => (
                        <button
                          key={`${url}-${i}`}
                          type="button"
                          onClick={() => setActiveImageIndex(i)}
                          className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition touch-manipulation sm:h-14 sm:w-14 ${
                            i === activeImageIndex ? 'border-amber-600 ring-2 ring-amber-200' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img src={resolveMediaUrl(url)} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="min-w-0 space-y-4 text-sm">
                  <p className="text-xs font-bold uppercase text-slate-500">Catalog details</p>
                  {modalRequest.product_category ? (
                    <p>
                      <span className="font-semibold text-slate-700">Category: </span>
                      <span className="text-slate-600">{modalRequest.product_category}</span>
                    </p>
                  ) : null}
                  {modalRequest.product_price != null && modalRequest.product_price !== '' ? (
                    <p>
                      <span className="font-semibold text-slate-700">Price: </span>
                      <span className="text-slate-600">
                        {typeof modalRequest.product_price === 'number'
                          ? modalRequest.product_price.toFixed(2)
                          : String(modalRequest.product_price)}
                      </span>
                    </p>
                  ) : null}
                  {modalRequest.product_material ? (
                    <p>
                      <span className="font-semibold text-slate-700">Material: </span>
                      <span className="text-slate-600">{modalRequest.product_material}</span>
                    </p>
                  ) : null}
                  {modalRequest.product_print_type ? (
                    <p>
                      <span className="font-semibold text-slate-700">Print: </span>
                      <span className="text-slate-600">{modalRequest.product_print_type}</span>
                    </p>
                  ) : null}
                  {modalRequest.product_packaging ? (
                    <p>
                      <span className="font-semibold text-slate-700">Packaging: </span>
                      <span className="text-slate-600">{modalRequest.product_packaging}</span>
                    </p>
                  ) : null}
                  {modalRequest.product_moq ? (
                    <p>
                      <span className="font-semibold text-slate-700">MOQ: </span>
                      <span className="text-slate-600">{modalRequest.product_moq}</span>
                    </p>
                  ) : null}
                  <p className="font-semibold text-slate-700">Description</p>
                  {(() => {
                    const rawDesc = productDescriptionAsString(modalRequest);
                    const safeHtml = rawDesc.trim() ? sanitizeProductDescriptionHtml(rawDesc) : '';
                    const plain = htmlToPlainText(rawDesc);
                    if (safeHtml.trim()) {
                      return (
                        <div
                          className="max-h-40 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700 leading-relaxed sm:max-h-56 [&_a]:text-emerald-700 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                          dangerouslySetInnerHTML={{ __html: safeHtml }}
                        />
                      );
                    }
                    if (plain) {
                      return (
                        <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 text-slate-600 leading-relaxed sm:max-h-56">
                          {plain}
                        </p>
                      );
                    }
                    return (
                      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-500">
                        No catalog description (product may have been removed or the join did not match).
                      </p>
                    );
                  })()}
                  {specEntries.length > 0 ? (
                    <div>
                      <p className="mb-2 font-semibold text-slate-700">Specifications</p>
                      <ul className="space-y-1 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                        {specEntries.map(([key, val]) => (
                          <li key={key} className="flex justify-between gap-2 border-b border-slate-100/80 py-1 last:border-0">
                            <span className="font-medium capitalize text-slate-600">{key.replace(/_/g, ' ')}</span>
                            <span className="text-right text-slate-700">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <p className="break-all text-xs text-slate-400 font-mono">
                    <span className="text-slate-500">Product ID: </span>
                    {modalRequest.product_id}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-amber-50/40 px-3 py-4 sm:px-6 sm:py-5">
                <p className="mb-3 text-xs font-bold uppercase text-amber-900/80">Request from customer</p>
                <div className="mb-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                  {STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateStatus(modalRequest.id, s)}
                      className={`min-h-[40px] touch-manipulation text-center text-[10px] font-semibold uppercase px-2 py-2 rounded-full ring-1 transition sm:text-xs sm:px-3 sm:py-1.5 ${
                        modalRequest.status === s ? 'bg-amber-700 text-white ring-amber-800' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {getStatusStyle(s).label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-100 bg-white p-3 text-sm sm:grid-cols-2 sm:p-4">
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <Mail className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                    <a href={`mailto:${modalRequest.email}`} className="text-emerald-800 font-medium break-all">
                      {modalRequest.email}
                    </a>
                  </div>
                  <p className="font-medium text-slate-900">{modalRequest.name}</p>
                  {modalRequest.company ? (
                    <p className="flex items-start gap-2 text-slate-600">
                      <Building2 className="h-4 w-4 shrink-0 mt-0.5" />
                      {modalRequest.company}
                    </p>
                  ) : null}
                  {modalRequest.region ? (
                    <p className="flex items-start gap-2 text-slate-600 sm:col-span-2">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                      {modalRequest.region}
                    </p>
                  ) : null}
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-xs font-bold uppercase text-slate-500">Message</p>
                    <p className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 text-slate-800 leading-relaxed sm:max-h-none">
                      {modalRequest.message}
                    </p>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-slate-500 sm:col-span-2">
                    <Clock className="h-3.5 w-3.5" />
                    Submitted {formatDate(modalRequest.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={closeModal}
                className="w-full touch-manipulation rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto sm:py-2.5"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => deleteRow(modalRequest.id)}
                disabled={deletingId === modalRequest.id}
                className="inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50 sm:w-auto sm:py-2.5"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                {deletingId === modalRequest.id ? 'Deleting…' : 'Delete request'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
