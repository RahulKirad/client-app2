import { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import { apiClient, Product, resolveMediaUrl } from '../lib/api';
import { useI18n } from '../contexts/I18nContext';

type Props = {
  product: Product | null;
  onClose: () => void;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SampleRequestModal({ product, onClose }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [message, setMessage] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  useEffect(() => {
    if (!product) return;
    setName('');
    setCompany('');
    setEmail('');
    setRegion('');
    setMessage(`I'd like to request a sample of "${product.name}". `);
    setEmailTouched(false);
    setError('');
    setDone(false);
    setLoading(false);
    setPrivacyAccepted(false);
    setNewsletterOptIn(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [product, onClose]);

  if (!product) return null;

  const isEmailValid = emailRegex.test(email.trim());
  const canSubmit =
    !loading &&
    name.trim().length > 0 &&
    isEmailValid &&
    message.trim().length >= 10;
    
  const canSubmitWithConsent = canSubmit && privacyAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!isEmailValid) {
      setError('Please enter a valid email address.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Please add a bit more detail (at least 10 characters).');
      return;
    }
    if (!privacyAccepted) {
      setError('Please accept the Privacy Policy to continue.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.submitSampleRequest({
        product_id: product.id,
        product_name: product.name,
        name: name.trim(),
        company: company.trim() || undefined,
        email: email.trim(),
        region: region.trim() || undefined,
        message: `${message.trim()}\n\n[Consent]\nprivacy_policy_accepted=${privacyAccepted ? 'yes' : 'no'}\nnewsletter_opt_in=${newsletterOptIn ? 'yes' : 'no'}\nconsent_timestamp=${new Date().toISOString()}\nconsent_policy_version=2026-05-28`,
      });
      setDone(true);
    } catch {
      setError('Could not send your request. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sample-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 py-4 border-b border-stone-200"
          style={{ background: 'linear-gradient(to bottom, #FDF8F0, #fff)' }}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">Request a sample</p>
            <h2 id="sample-modal-title" className="text-lg font-bold text-stone-900 truncate pr-2">
              {product.name}
            </h2>
            <p className="text-sm text-stone-600 mt-0.5">{product.category}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex gap-4 mb-6">
            <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
              <img
                src={resolveMediaUrl(product.image_url)}
                alt=""
                className="w-full h-full object-cover"
                width={800}
                height={800}
                loading="lazy"
              />
            </div>
            <p className="text-sm text-stone-600 leading-relaxed pt-1">
              Tell us how we can help with a sample of this product. We will email you using the same inbox as our general inquiries.
            </p>
          </div>

          {done ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mb-4">
                <Package className="w-7 h-7" />
              </div>
              <p className="font-semibold text-stone-900 mb-1">Request sent</p>
              <p className="text-sm text-stone-600 mb-6">Thank you — we will get back to you soon.</p>
              <button type="button" onClick={onClose} className="btn-cta-primary px-8 py-2.5 rounded-full">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="sr-name" className="block text-sm font-bold mb-1.5" style={{ color: '#78350F' }}>
                  Full name *
                </label>
                <input
                  id="sr-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-600/30 focus:border-amber-700"
                />
              </div>
              <div>
                <label htmlFor="sr-company" className="block text-sm font-bold mb-1.5" style={{ color: '#78350F' }}>
                  Company
                </label>
                <input
                  id="sr-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-600/30 focus:border-amber-700"
                />
              </div>
              <div>
                <label htmlFor="sr-email" className="block text-sm font-bold mb-1.5" style={{ color: '#78350F' }}>
                  Email *
                </label>
                <input
                  id="sr-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (!emailTouched) setEmailTouched(true);
                  }}
                  onBlur={() => setEmailTouched(true)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-600/30 focus:border-amber-700"
                />
                {emailTouched && email.trim() && !isEmailValid ? (
                  <p className="mt-1 text-xs text-red-700 font-medium">Please enter a valid email address.</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="sr-region" className="block text-sm font-bold mb-1.5" style={{ color: '#78350F' }}>
                  Region
                </label>
                <select
                  id="sr-region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-600/30 focus:border-amber-700 bg-white"
                >
                  <option value="">Select region</option>
                  <option value="EU">European Union</option>
                  <option value="US">United States</option>
                  <option value="APAC">Asia Pacific</option>
                  <option value="ME">Middle East</option>
                  <option value="India">India</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="sr-message" className="block text-sm font-bold mb-1.5" style={{ color: '#78350F' }}>
                  Message *
                </label>
                <textarea
                  id="sr-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-600/30 focus:border-amber-700 resize-y min-h-[100px]"
                />
              </div>
              <div className="space-y-2 rounded-lg border border-stone-200 p-3 bg-stone-50">
                <label className="flex items-start gap-2 text-sm text-stone-800">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1"
                  />
                  <span>{t('gdpr.privacyAccept')}</span>
                </label>
                <label className="flex items-start gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={newsletterOptIn}
                    onChange={(e) => setNewsletterOptIn(e.target.checked)}
                    className="mt-1"
                  />
                  <span>{t('gdpr.newsletter')}</span>
                </label>
              </div>
              {error ? (
                <div className="text-sm font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              ) : null}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmitWithConsent}
                  className="px-5 py-2.5 rounded-lg font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: 'var(--beige-700)' }}
                >
                  {loading ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
