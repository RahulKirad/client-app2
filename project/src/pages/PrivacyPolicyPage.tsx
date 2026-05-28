import { Link } from 'react-router-dom';
import PageSeo from '../components/PageSeo';
import { buildTitle, truncateMeta } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PRIVACY_TITLE = buildTitle('Privacy Policy & Data Protection');
const PRIVACY_DESCRIPTION = truncateMeta(
  'Read how Cottonunique collects, uses, and protects your personal information when you use our website, submit inquiries, or request product samples.',
  160
);

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <PageSeo title={PRIVACY_TITLE} description={PRIVACY_DESCRIPTION} />
      <Header />
      <main className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: 'var(--heading-color)', fontFamily: 'var(--heading-font)' }}
          >
            Privacy Policy
          </h1>
          <p className="text-sm text-[var(--text-color)] mb-6" style={{ fontFamily: 'var(--body-font)' }}>
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="rounded-xl border border-[var(--beige-300)] bg-[var(--beige-100)]/40 p-4 mb-8">
            <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--body-font)', color: '#3a2f1f' }}>
              This policy explains how Cottonunique collects, uses, stores, and protects personal data when you use this website,
              submit inquiries, or request product samples. We process data only for legitimate business communication and service delivery.
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-6" style={{ fontFamily: 'var(--body-font)', color: '#3a2f1f' }}>
            <section className="rounded-lg border border-stone-200 p-5 sm:p-6 bg-white">
              <h2 className="text-2xl font-bold mt-0 mb-3" style={{ color: '#78350F' }}>1. Data Controller</h2>
              <p>
                Cottonunique (“we”, “our”) provides premium GOTS-certified sustainable tote bags for businesses and exporters.
                For privacy questions, please contact us at{' '}
                <a href="mailto:info@cottonunique.com" className="underline font-medium" style={{ color: '#78350F' }}>
                  info@cottonunique.com
                </a>.
              </p>
            </section>

            <section className="rounded-lg border border-stone-200 p-5 sm:p-6 bg-white">
              <h2 className="text-2xl font-bold mt-0 mb-3" style={{ color: '#78350F' }}>2. Personal Data We Collect</h2>
              <p>
                We may collect the following information when you contact us:
              </p>
              <ul>
                <li>Identity and contact details (name, company name, email address)</li>
                <li>Business context (region, order type, product interest)</li>
                <li>Communication data (message content, inquiry details, sample request details)</li>
              </ul>
            </section>

            <section className="rounded-lg border border-stone-200 p-5 sm:p-6 bg-white">
              <h2 className="text-2xl font-bold mt-0 mb-3" style={{ color: '#78350F' }}>3. Why We Use Your Data</h2>
              <p>
                We use personal data to:
              </p>
              <ul>
                <li>Respond to inquiries and sample requests</li>
                <li>Prepare quotations and communicate about products/services</li>
                <li>Maintain records of business communication</li>
                <li>Send optional updates where consent has been provided</li>
              </ul>
            </section>

            <section className="rounded-lg border border-stone-200 p-5 sm:p-6 bg-white">
              <h2 className="text-2xl font-bold mt-0 mb-3" style={{ color: '#78350F' }}>4. Legal Basis for Processing</h2>
              <p>
                Depending on context, we process your data on one or more of these bases:
              </p>
              <ul>
                <li>Legitimate interest (responding to B2B inquiries and maintaining communication)</li>
                <li>Pre-contractual steps (when you request quotes or product discussions)</li>
                <li>Consent (for optional marketing or newsletter communication)</li>
                <li>Legal compliance obligations where applicable</li>
              </ul>
            </section>

            <section className="rounded-lg border border-stone-200 p-5 sm:p-6 bg-white">
              <h2 className="text-2xl font-bold mt-0 mb-3" style={{ color: '#78350F' }}>5. Cookies and Similar Technologies</h2>
              <p>
                We may use cookies to ensure core site functionality and improve performance. If analytics tools are enabled,
                they help us understand aggregate usage trends. You can manage cookies through your browser settings.
              </p>
            </section>

            <section className="rounded-lg border border-stone-200 p-5 sm:p-6 bg-white">
              <h2 className="text-2xl font-bold mt-0 mb-3" style={{ color: '#78350F' }}>6. Data Retention</h2>
              <p>
                We retain personal data only as long as necessary for business communication, quote handling, and legal obligations.
                Data is periodically reviewed and removed when no longer needed.
              </p>
            </section>

            <section className="rounded-lg border border-stone-200 p-5 sm:p-6 bg-white">
              <h2 className="text-2xl font-bold mt-0 mb-3" style={{ color: '#78350F' }}>7. Data Sharing and Transfers</h2>
              <p>
                We do not sell personal data. Information may be shared with trusted service providers (for hosting, email delivery,
                and website operations) only where required to provide services and with appropriate safeguards.
              </p>
            </section>

            <section className="rounded-lg border border-stone-200 p-5 sm:p-6 bg-white">
              <h2 className="text-2xl font-bold mt-0 mb-3" style={{ color: '#78350F' }}>8. Data Security</h2>
              <p>
                We apply reasonable technical and organizational measures to protect personal data against unauthorized access,
                misuse, or disclosure. This includes HTTPS transport and controlled access to systems.
              </p>
            </section>

            <section className="rounded-lg border border-stone-200 p-5 sm:p-6 bg-white">
              <h2 className="text-2xl font-bold mt-0 mb-3" style={{ color: '#78350F' }}>9. Your Rights</h2>
              <p>
                Subject to applicable law, you may request access, correction, deletion, restriction, or portability of your personal data,
                and you may object to certain processing. You may also withdraw consent for optional communications at any time.
              </p>
            </section>

            <section className="rounded-lg border border-stone-200 p-5 sm:p-6 bg-white">
              <h2 className="text-2xl font-bold mt-0 mb-3" style={{ color: '#78350F' }}>10. Policy Updates</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect legal, operational, or technical changes.
                The updated version will be posted on this page with a revised “Last updated” date.
              </p>
            </section>

            <section className="rounded-lg border border-stone-200 p-5 sm:p-6 bg-white">
              <h2 className="text-2xl font-bold mt-0 mb-3" style={{ color: '#78350F' }}>11. Contact Us</h2>
              <p>
                For privacy-related requests, contact us at{' '}
                <a href="mailto:info@cottonunique.com" className="underline font-medium" style={{ color: '#78350F' }}>
                  info@cottonunique.com
                </a>.
              </p>
            </section>
          </div>

          <p className="mt-12">
            <Link to="/" className="font-medium underline" style={{ color: '#78350F' }}>← Back to home</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
