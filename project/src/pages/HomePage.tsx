import { Routes, Route } from 'react-router-dom';
import PageSeo from '../components/PageSeo';
import { SITE_URL, truncateMeta } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../components/sections/Hero';
import About from '../components/sections/About';
import EcoToteDuoPack from '../components/sections/EcoToteDuoPack';
import Products from '../components/sections/Products';
import Corporate from '../components/sections/Corporate';
import Sustainability from '../components/sections/Sustainability';
import Export from '../components/sections/Export';
import TrustStrip from '../components/sections/TrustStrip';
import Contact from '../components/sections/Contact';
import ProductsPage from './ProductsPage';
import ProductDetailPage from './ProductDetailPage';
import PrivacyPolicyPage from './PrivacyPolicyPage';

const HOME_TITLE =
  'Cotton Tote Bags Manufacturer India | GOTS Certified | Cottonunique';
const HOME_DESCRIPTION = truncateMeta(
  "Cottonunique — India's leading GOTS-certified organic cotton tote bag manufacturer & exporter. Custom printed, bulk orders, export-ready. Trusted by corporates & NGOs worldwide.",
  160
);
const HOME_KEYWORDS =
  'cotton tote bags India, GOTS certified tote bags, sustainable tote bag manufacturer, custom tote bags bulk, eco tote bag exporter India, organic cotton bags, canvas tote bag wholesale';
const HOME_H1 = 'Organic Cotton Tote Bag Manufacturer & Exporter — India';

const HERO_LCP_PRELOAD = `${SITE_URL}/images/banner/baner5.png`;

const HOME_ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cottonunique',
  description: 'GOTS-certified organic cotton tote bag manufacturer and exporter from India',
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo/logo.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    availableLanguage: 'English',
  },
  keywords:
    'cotton tote bags, GOTS certified, tote bag manufacturer India, organic cotton bags',
};

function MainPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <PageSeo
        title={HOME_TITLE}
        description={HOME_DESCRIPTION}
        keywords={HOME_KEYWORDS}
        jsonLd={HOME_ORG_JSON_LD}
        linkPreload={HERO_LCP_PRELOAD}
      />
      <Header />
      <main>
        <div className="relative">
          <h1
            className="pointer-events-none absolute inset-x-0 top-20 z-[25] px-4 text-center text-xs font-bold text-white drop-shadow-lg sm:text-sm"
            style={{ fontFamily: 'var(--heading-font)' }}
          >
            {HOME_H1}
          </h1>
          <Hero />
        </div>
        <About />
        {/* Section divider to prevent visual merging */}
        <div className="bg-white py-4 sm:py-6">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="h-px w-full bg-[var(--beige-300)] opacity-70" />
          </div>
        </div>
        <EcoToteDuoPack />
        <Products />
        <Corporate />
        <Sustainability />
        <Export />
        <TrustStrip />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:slug" element={<ProductDetailPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
    </Routes>
  );
}