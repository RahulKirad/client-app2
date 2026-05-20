import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Package, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { apiClient, Product, resolveMediaUrl } from '../lib/api';
import PageSeo from '../components/PageSeo';
import { buildTitle, productPath, productSeoFromRecord, truncateMeta } from '../lib/seo';
import ExpandableRichProductDescription from '../components/ExpandableRichProductDescription';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SampleRequestModal from '../components/SampleRequestModal';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageFrame, setShowImageFrame] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomCursor, setZoomCursor] = useState<'default' | 'in' | 'out'>('default');
  const viewerImageWrapRef = useRef<HTMLDivElement | null>(null);
  const thumbBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const modalThumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [viewerImageNatural, setViewerImageNatural] = useState({ w: 0, h: 0 });
  const [scan, setScan] = useState<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const [sampleModalOpen, setSampleModalOpen] = useState(false);

  useEffect(() => {
    if (!slug) {
      setError('Invalid product');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiClient
      .getProduct(slug)
      .then((data) => {
        if (!cancelled) {
          setProduct(data);
          setError(null);
          setSelectedImageIndex(0);
          if (data.slug && slug !== data.slug) {
            navigate(productPath(data), { replace: true });
          }
          return apiClient.getRelatedProducts(data.id);
        }
        return [];
      })
      .then((related) => {
        if (!cancelled && Array.isArray(related)) {
          setRelatedProducts(related);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load product');
          setProduct(null);
          setRelatedProducts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  const imageList = useMemo(() => {
    if (!product) return [];
    const gallery = Array.isArray(product.gallery_images) && product.gallery_images.length > 0
      ? product.gallery_images
      : product.image_url
        ? [product.image_url]
        : [];
    return gallery.length > 0 ? gallery : ['/images/placeholder-product.jpg'];
  }, [product]);

  const mainImageUrl = resolveMediaUrl(imageList[selectedImageIndex] || imageList[0] || '');

  const SCAN_LENS_SIZE_PX = 140;
  const SCAN_ZOOM = 2.5;

  useEffect(() => {
    if (!showImageFrame) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowImageFrame(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showImageFrame]);

  useEffect(() => {
    thumbBtnRefs.current[selectedImageIndex]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [selectedImageIndex]);

  useEffect(() => {
    if (!showImageFrame) return;
    modalThumbRefs.current[selectedImageIndex]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [selectedImageIndex, showImageFrame]);

  const notFoundTitle = buildTitle('Product Not Found');
  const notFoundDescription = truncateMeta(
    'This Cottonunique product could not be found. Browse our GOTS-certified sustainable tote bags catalog or contact us for samples.',
    160
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <PageSeo
          title={buildTitle('Product Details')}
          description={truncateMeta(
            'Loading Cottonunique sustainable tote bag details. GOTS-certified export-ready bags for corporate and wholesale orders.',
            160
          )}
        />
        <Header />
        <main className="pt-20 min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent" style={{ borderColor: 'var(--beige-600)' }} />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <PageSeo title={notFoundTitle} description={notFoundDescription} />
        <Header />
        <main className="pt-20 min-h-[60vh] flex flex-col items-center justify-center px-4">
          <Package className="mb-4 text-slate-400" size={64} />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Product Not Found</h1>
          <p className="text-slate-600 mb-6">{error || 'This product may no longer be available.'}</p>
          <Link
            to="/products#products-list"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--beige-600)' }}
          >
            <ArrowLeft size={18} />
            Back to products
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const specs = product.specifications && typeof product.specifications === 'object' ? product.specifications : {};
  const specEntries = Object.entries(specs).filter(([k, v]) => k !== 'pricing' && v != null && String(v).trim() !== '');
  const seo = productSeoFromRecord(product);

  return (
    <div className="min-h-screen bg-white">
      <PageSeo
        title={seo.title}
        description={seo.description}
        ogType={seo.ogType}
        ogImage={seo.ogImage}
        ogTitle={seo.title}
        ogDescription={seo.description}
      />
      <Header />
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/products#products-list"
            className="inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors hover:opacity-80"
            style={{ color: 'var(--beige-700)' }}
          >
            <ArrowLeft size={18} />
            Back to products
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start gap-10 lg:gap-14">
            {/* Main image + horizontal thumbnail carousel below */}
            <div className="flex flex-col gap-5 w-full max-w-xl sm:max-w-2xl lg:max-w-none mx-auto lg:mx-0 self-start">
              <div className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-gray-100 aspect-square min-h-[min(100vw-2rem,340px)] max-h-[min(720px,92vw)] sm:min-h-[400px] sm:max-h-[720px] group">
                {/* Main image (hover scan) — fixed aspect; height does not track description column */}
                <div
                  ref={viewerImageWrapRef}
                  className="absolute inset-0 bg-gray-100 overflow-hidden cursor-pointer"
                  onMouseEnter={() => setScan((s) => ({ ...s, active: true }))}
                  onMouseLeave={() => setScan((s) => ({ ...s, active: false }))}
                  onMouseMove={(e) => {
                    const wrap = viewerImageWrapRef.current;
                    if (!wrap) return;
                    const rect = wrap.getBoundingClientRect();
                    const cx = e.clientX - rect.left;
                    const cy = e.clientY - rect.top;
                    const naturalW = viewerImageNatural.w;
                    const naturalH = viewerImageNatural.h;
                    if (!naturalW || !naturalH) return;

                    const containerW = rect.width;
                    const containerH = rect.height;
                    const imgRatio = naturalW / naturalH;
                    const containerRatio = containerW / containerH;

                    let dispW = containerW;
                    let dispH = containerH;
                    let dispLeft = 0;
                    let dispTop = 0;
                    if (imgRatio > containerRatio) {
                      dispW = containerW;
                      dispH = containerW / imgRatio;
                      dispTop = (containerH - dispH) / 2;
                    } else {
                      dispH = containerH;
                      dispW = containerH * imgRatio;
                      dispLeft = (containerW - dispW) / 2;
                    }

                    const xInImg = Math.min(Math.max(cx - dispLeft, 0), dispW);
                    const yInImg = Math.min(Math.max(cy - dispTop, 0), dispH);
                    setScan({ active: true, x: xInImg, y: yInImg });
                  }}
                  onClick={() => {
                    setZoom(1);
                    setZoomCursor('default');
                    setShowImageFrame(true);
                  }}
                  title="Click to open image viewer"
                >
                  <img
                    src={mainImageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    draggable={false}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      setViewerImageNatural({ w: img.naturalWidth || 0, h: img.naturalHeight || 0 });
                    }}
                  />
                  {/* Lens */}
                  {scan.active && viewerImageNatural.w > 0 && viewerImageNatural.h > 0 ? (
                    (() => {
                      const wrap = viewerImageWrapRef.current;
                      if (!wrap) return null;
                      const rect = wrap.getBoundingClientRect();
                      const containerW = rect.width;
                      const containerH = rect.height;
                      const imgRatio = viewerImageNatural.w / viewerImageNatural.h;
                      const containerRatio = containerW / containerH;
                      let dispW = containerW;
                      let dispH = containerH;
                      let dispLeft = 0;
                      let dispTop = 0;
                      if (imgRatio > containerRatio) {
                        dispW = containerW;
                        dispH = containerW / imgRatio;
                        dispTop = (containerH - dispH) / 2;
                      } else {
                        dispH = containerH;
                        dispW = containerH * imgRatio;
                        dispLeft = (containerW - dispW) / 2;
                      }

                      const lensHalf = SCAN_LENS_SIZE_PX / 2;
                      const lensLeft = Math.min(
                        Math.max(dispLeft + scan.x - lensHalf, dispLeft),
                        dispLeft + dispW - SCAN_LENS_SIZE_PX
                      );
                      const lensTop = Math.min(
                        Math.max(dispTop + scan.y - lensHalf, dispTop),
                        dispTop + dispH - SCAN_LENS_SIZE_PX
                      );
                      return (
                        <div
                          className="absolute rounded border border-white/70 bg-white/15 shadow-[0_0_0_1px_rgba(0,0,0,0.25)] pointer-events-none"
                          style={{
                            width: SCAN_LENS_SIZE_PX,
                            height: SCAN_LENS_SIZE_PX,
                            left: lensLeft,
                            top: lensTop,
                            backdropFilter: 'blur(1px)',
                          }}
                        />
                      );
                    })()
                  ) : null}
                </div>
              </div>

              {imageList.length > 1 ? (
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex((i) => (i <= 0 ? imageList.length - 1 : i - 1))
                    }
                    className="flex-shrink-0 inline-flex h-11 w-11 sm:h-12 sm:w-12 touch-manipulation items-center justify-center rounded-full border-2 bg-white shadow-md text-slate-800 transition hover:bg-slate-50"
                    style={{ borderColor: 'var(--beige-400)' }}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
                  </button>
                  <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:thin]">
                    <div className="flex flex-row gap-2 sm:gap-3 justify-center sm:justify-start min-w-min px-1">
                      {imageList.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          ref={(el) => {
                            thumbBtnRefs.current[i] = el;
                          }}
                          onClick={() => setSelectedImageIndex(i)}
                          className={`h-[4.5rem] w-[4.5rem] sm:h-24 sm:w-24 flex-shrink-0 rounded-xl overflow-hidden border-2 bg-gray-100 transition-all ${
                            selectedImageIndex === i
                              ? 'border-slate-800 ring-2 ring-slate-400 ring-offset-2 scale-[1.02]'
                              : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <img
                            src={resolveMediaUrl(url)}
                            alt={`${product.name} view ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex((i) => (i >= imageList.length - 1 ? 0 : i + 1))
                    }
                    className="flex-shrink-0 inline-flex h-11 w-11 sm:h-12 sm:w-12 touch-manipulation items-center justify-center rounded-full border-2 bg-white shadow-md text-slate-800 transition hover:bg-slate-50"
                    style={{ borderColor: 'var(--beige-400)' }}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" strokeWidth={2.25} />
                  </button>
                </div>
              ) : null}
            </div>

            {/* Details */}
            <div>
              {scan.active && viewerImageNatural.w > 0 && viewerImageNatural.h > 0 && viewerImageWrapRef.current ? (
                <div className="hidden lg:block w-full rounded-2xl overflow-hidden shadow-lg bg-black/90 border border-black/10">
                  <div className="relative h-[720px] w-full">
                    {(() => {
                      const wrap = viewerImageWrapRef.current!;
                      const rect = wrap.getBoundingClientRect();
                      const containerW = rect.width;
                      const containerH = rect.height;
                      const imgRatio = viewerImageNatural.w / viewerImageNatural.h;
                      const containerRatio = containerW / containerH;
                      let dispW = containerW;
                      let dispH = containerH;
                      let dispLeft = 0;
                      let dispTop = 0;
                      if (imgRatio > containerRatio) {
                        dispW = containerW;
                        dispH = containerW / imgRatio;
                        dispTop = (containerH - dispH) / 2;
                      } else {
                        dispH = containerH;
                        dispW = containerH * imgRatio;
                        dispLeft = (containerW - dispW) / 2;
                      }

                      // Map cursor position to percentage inside displayed image bounds.
                      const px = dispW > 0 ? (scan.x / dispW) * 100 : 50;
                      const py = dispH > 0 ? (scan.y / dispH) * 100 : 50;

                      return (
                        <div className="absolute inset-0">
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: `url(${mainImageUrl})`,
                              backgroundRepeat: 'no-repeat',
                              // Fill the entire hover panel with the zoomed image (no letterboxing).
                              backgroundSize: `${SCAN_ZOOM * 100}% ${SCAN_ZOOM * 100}%`,
                              backgroundPosition: `${px}% ${py}%`,
                            }}
                          />
                          <div className="absolute inset-0 pointer-events-none" />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : null}

              <div className={scan.active ? 'lg:hidden' : ''}>
              <p className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--beige-600)' }}>
                {product.category}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'var(--heading-font)' }}>
                {product.name}
              </h1>

              {product.moq && (
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                    MOQ: {product.moq}
                  </span>
                </div>
              )}

              {/* Full description (clamp + Read more when long) */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Description</h2>
                <ExpandableRichProductDescription description={product.description} />
              </div>

              {/* Attributes */}
              <div className="space-y-3 mb-8">
                {product.material && (
                  <p className="text-slate-700">
                    <span className="font-semibold text-slate-900">Material:</span> {product.material}
                  </p>
                )}
                {product.print_type && (
                  <p className="text-slate-700">
                    <span className="font-semibold text-slate-900">Print type:</span> {product.print_type}
                  </p>
                )}
                {product.packaging && (
                  <p className="text-slate-700">
                    <span className="font-semibold text-slate-900">Packaging:</span> {product.packaging}
                  </p>
                )}
              </div>

              {/* Specifications */}
              {specEntries.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3">Specifications</h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {specEntries.map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4 py-2 border-b border-slate-100">
                        <dt className="font-medium text-slate-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="text-slate-600 text-right">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSampleModalOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: 'var(--beige-600)' }}
              >
                <ShoppingBag size={20} />
                Request Sample
              </button>
              </div>
            </div>
          </div>

          {relatedProducts.length > 0 ? (
            <section className="mt-16 pt-12 border-t border-slate-200" aria-labelledby="related-products-heading">
              <h2 id="related-products-heading" className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'var(--heading-font)' }}>
                Related Products
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((related) => (
                  <li key={related.id}>
                    <Link
                      to={productPath(related)}
                      className="group block rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <img
                        src={resolveMediaUrl(related.image_url)}
                        alt={related.name}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-900 line-clamp-2" style={{ fontFamily: 'var(--heading-font)' }}>
                          {related.name}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--beige-700)' }}>
                          {related.category}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </main>
      {showImageFrame && (
        <div className="fixed inset-0 z-50 flex min-h-0 flex-col bg-black/90 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
          {/* Toolbar: stacks on narrow phones, zoom row can scroll horizontally */}
          <div className="flex shrink-0 flex-col gap-2 border-b border-white/10 bg-black/70 px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3">
            <div className="min-w-0 text-sm font-medium text-white/95 sm:text-base">
              <span className="line-clamp-2 sm:line-clamp-1">{product.name}</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] sm:flex-none sm:gap-2 sm:pb-0 sm:overflow-visible">
              <button
                type="button"
                onClick={() => {
                  setZoomCursor('out');
                  setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100));
                }}
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 sm:px-3"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-white/85 sm:text-sm min-w-[2.75rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => {
                  setZoomCursor('in');
                  setZoom((z) => Math.min(4, Math.round((z + 0.25) * 100) / 100));
                }}
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 sm:px-3"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setZoomCursor('default');
                }}
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/20 sm:px-3 sm:text-xs"
                aria-label="Reset view"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomCursor('default');
                  setShowImageFrame(false);
                }}
                className="ml-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 sm:ml-1 sm:h-8 sm:w-8"
                aria-label="Close image view"
              >
                <X className="h-4 w-4 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="mx-auto flex w-full min-h-0 max-w-7xl flex-1 flex-col items-center gap-2 px-2 py-2 sm:gap-4 sm:px-4 sm:py-3 md:px-6">
              {/* Main zoom image — height uses dynamic viewport so mobile browser chrome is handled */}
              <div className="flex min-h-0 w-full flex-1 items-center justify-center">
                <div
                  className={`flex max-h-[min(72dvh,calc(100dvh-9.5rem))] w-full max-w-6xl items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-black/80 max-lg:landscape:!max-h-[min(56dvh,calc(100dvh-8.75rem))] sm:max-h-[min(78dvh,calc(100dvh-10.5rem))] sm:rounded-xl md:max-h-[min(82dvh,calc(100dvh-11rem))] ${
                    zoomCursor === 'in' ? 'cursor-zoom-in' : zoomCursor === 'out' ? 'cursor-zoom-out' : 'cursor-default'
                  }`}
                  role="application"
                  aria-label="Image viewer"
                  onClick={() => {
                    if (zoomCursor === 'in') {
                      setZoom((z) => Math.min(4, Math.round((z + 0.25) * 100) / 100));
                    } else if (zoomCursor === 'out') {
                      setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100));
                    }
                  }}
                >
                  <img
                    src={mainImageUrl}
                    alt={product.name}
                    className="max-h-[min(72dvh,calc(100dvh-9.5rem))] max-w-full object-contain select-none max-lg:landscape:!max-h-[min(56dvh,calc(100dvh-8.75rem))] sm:max-h-[min(78dvh,calc(100dvh-10.5rem))] md:max-h-[min(82dvh,calc(100dvh-11rem))]"
                    draggable={false}
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center center',
                      transition: 'transform 120ms ease-out',
                    }}
                  />
                </div>
              </div>

              {/* Thumbnail carousel */}
              {imageList.length > 1 ? (
                <div className="flex w-full max-w-4xl shrink-0 items-center gap-1.5 pb-1 sm:gap-2 sm:pb-2 md:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex((i) => (i <= 0 ? imageList.length - 1 : i - 1));
                      setZoom(1);
                      setZoomCursor('default');
                    }}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-md transition active:bg-white/25 sm:h-10 sm:w-10 md:h-11 md:w-11 touch-manipulation"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.25} />
                  </button>
                  <div className="min-h-[3.5rem] min-w-0 flex-1 overflow-x-auto overscroll-x-contain py-0.5 [scrollbar-width:thin] sm:min-h-[4.5rem] sm:py-1">
                    <div className="flex min-h-[3.25rem] min-w-min flex-row items-center justify-start gap-1.5 px-0.5 sm:min-h-[4rem] sm:gap-2 sm:px-1 md:gap-3">
                      {imageList.map((url, i) => {
                        const active = i === selectedImageIndex;
                        return (
                          <button
                            key={i}
                            type="button"
                            ref={(el) => {
                              modalThumbRefs.current[i] = el;
                            }}
                            onClick={() => {
                              setSelectedImageIndex(i);
                              setZoom(1);
                              setZoomCursor('default');
                            }}
                            className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md border sm:h-16 sm:w-16 sm:rounded-lg md:h-20 md:w-20 touch-manipulation ${
                              active ? 'border-white ring-2 ring-white/50' : 'border-white/25 hover:border-white/50'
                            }`}
                            aria-label={`View image ${i + 1}`}
                          >
                            <img
                              src={resolveMediaUrl(url)}
                              alt={`${product.name} thumbnail ${i + 1}`}
                              className="h-full w-full object-cover"
                            />
                            {active ? (
                              <span className="absolute inset-x-0 bottom-0 bg-black/75 py-0.5 text-center text-[9px] font-semibold text-white sm:text-[10px]">
                                Viewing
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex((i) => (i >= imageList.length - 1 ? 0 : i + 1));
                      setZoom(1);
                      setZoomCursor('default');
                    }}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-md transition active:bg-white/25 sm:h-10 sm:w-10 md:h-11 md:w-11 touch-manipulation"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.25} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {sampleModalOpen && product ? (
        <SampleRequestModal product={product} onClose={() => setSampleModalOpen(false)} />
      ) : null}
      <Footer />
    </div>
  );
}
