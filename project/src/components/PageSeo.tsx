import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { BRAND_NAME, DEFAULT_OG_IMAGE, SITE_URL, absoluteUrl } from '../lib/seo';

export interface PageSeoProps {
  title: string;
  description: string;
  keywords?: string;
  jsonLd?: Record<string, unknown>;
  ogType?: 'website' | 'product' | 'article';
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export default function PageSeo({
  title,
  description,
  keywords,
  jsonLd,
  ogType = 'website',
  ogImage,
  ogTitle,
  ogDescription,
}: PageSeoProps) {
  const { pathname } = useLocation();
  const canonical = `${SITE_URL}${pathname}`;
  const resolvedOgImage = ogImage
    ? absoluteUrl(ogImage)
    : absoluteUrl(DEFAULT_OG_IMAGE);
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDescription} />
      <meta property="og:image" content={resolvedOgImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={BRAND_NAME} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDescription} />
      <meta name="twitter:image" content={resolvedOgImage} />
      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
}
