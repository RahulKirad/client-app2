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
          <p className="text-sm text-[var(--text-color)] mb-8" style={{ fontFamily: 'var(--body-font)' }}>
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-lg max-w-none space-y-6" style={{ fontFamily: 'var(--body-font)', color: '#3a2f1f' }}>
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-3" style={{ color: '#78350F' }}>Who we are</h2>
              <p>
                Cottonunique (“we”, “our”) provides premium GOTS-certified sustainable tote bags for businesses and exporters.
                This policy describes how we collect, use, and protect your information when you use our website or contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-3" style={{ color: '#78350F' }}>Information we collect</h2>
              <p>
                When you submit an inquiry or contact form, we may collect your name, company name, email address, region,
                order type, and message. We use this only to respond to your request and do not sell your data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-3" style={{ color: '#78350F' }}>How we use your information</h2>
              <p>
                We use the information you provide to process inquiries, send quotes, and communicate about orders and services.
                With your consent, we may send occasional updates about our products and sustainability initiatives. You can opt out at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-3" style={{ color: '#78350F' }}>Cookies and analytics</h2>
              <p>
                We may use cookies and similar technologies to improve site performance and, if enabled, analytics to understand how visitors use our site.
                You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-3" style={{ color: '#78350F' }}>Data security</h2>
              <p>
                We take reasonable steps to protect your personal information. Our site is served over HTTPS. We do not store payment card data on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-3" style={{ color: '#78350F' }}>Your rights</h2>
              <p>
                You may request access to, correction of, or deletion of your personal data by contacting us at info@cottonunique.com.
                We will respond within a reasonable time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mt-8 mb-3" style={{ color: '#78350F' }}>Contact</h2>
              <p>
                For privacy-related questions, email us at <a href="mailto:info@cottonunique.com" className="underline font-medium" style={{ color: '#78350F' }}>info@cottonunique.com</a>.
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
