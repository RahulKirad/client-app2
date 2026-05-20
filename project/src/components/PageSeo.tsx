import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { BRAND_NAME, DEFAULT_OG_IMAGE, SITE_URL, absoluteUrl } from '../lib/seo';

export interface PageSeoProps {
  title: string;
  description: string;
  keywords?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** LCP image URL(s) to preload (e.g. hero banner). */
  linkPreload?: string | string[];
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
  linkPreload,
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
  const jsonLdItems = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const preloadHrefs = linkPreload
    ? Array.isArray(linkPreload)
      ? linkPreload
      : [linkPreload]
    : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <link rel="canonical" href={canonical} />
      {preloadHrefs.map((href) => (
        <link key={href} rel="preload" as="image" href={href} />
      ))}
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
      {jsonLdItems.map((schema, index) => (
        <script key={`jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
