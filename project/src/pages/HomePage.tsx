import { Routes, Route } from 'react-router-dom';
import PageSeo from '../components/PageSeo';
import {
  HERO_LCP_IMAGE_PATH,
  absoluteUrl,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  truncateMeta,
} from '../lib/seo';
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

const HERO_LCP_PRELOAD = absoluteUrl(HERO_LCP_IMAGE_PATH);

function MainPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <PageSeo
        title={HOME_TITLE}
        description={HOME_DESCRIPTION}
        keywords={HOME_KEYWORDS}
        jsonLd={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]}
        linkPreload={HERO_LCP_PRELOAD}
      />
      <Header />
      <main>
        <div className="relative">
          <h1 className="sr-only">{HOME_H1}</h1>
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