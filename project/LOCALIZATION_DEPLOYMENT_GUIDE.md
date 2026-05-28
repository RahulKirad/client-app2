# Cottonunique Localization + Compliance Guide

## 1) Code Changes Included

- Locale/currency context: `src/contexts/I18nContext.tsx`
- Translation dictionary (EN/DE): `src/i18n/messages.ts`
- Header localization controls (EN/DE, currency, cookie settings): `src/components/Header.tsx`
- Footer legal/compliance links: `src/components/Footer.tsx`
- Legal pages (Impressum, Datenschutz, Cookies, Widerruf, AGB, Shipping): `src/pages/LegalPage.tsx`
- Routes for legal pages: `src/pages/HomePage.tsx`
- GDPR consent capture in sample request flow: `src/components/SampleRequestModal.tsx`
- Product page compliance block (VAT/shipping/delivery/returns/stock): `src/pages/ProductDetailPage.tsx`
- hreflang + locale SEO tags: `src/components/PageSeo.tsx`
- Shipping zone architecture: `src/lib/commerceConfig.ts`

## 2) Translation JSON Example

```json
{
  "nav.home": "Startseite",
  "ecom.addToCart": "In den Warenkorb",
  "ecom.checkout": "Zur Kasse",
  "ecom.relatedProducts": "Ähnliche Produkte",
  "legal.privacy": "Datenschutzerklärung",
  "legal.terms": "AGB",
  "gdpr.privacyAccept": "Ich habe die Datenschutzerklärung gelesen und akzeptiere sie (erforderlich)."
}
```

## 3) GDPR Checkout Implementation

- Required checkbox: Privacy Policy acceptance.
- Optional checkbox: Newsletter opt-in (unchecked by default).
- Consent is captured and sent with sample request payload in the message block.
- If you want database-grade consent logging, add dedicated DB columns in backend and persist booleans separately.

## 4) Hostinger Deployment Notes

1. Deploy frontend build as usual.
2. Ensure domain mapping:
   - `cottonunique.com` (EN)
   - `cottonunique.de` (DE)
3. Set `VITE_SITE_URL` per environment/domain.
4. Verify TLS certificate active for both domains.

## 5) .htaccess (Apache) Example

```apache
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Keep .de and .com on same app entry
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 6) Nginx Example

```nginx
server {
  listen 80;
  server_name cottonunique.com www.cottonunique.com cottonunique.de www.cottonunique.de;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name cottonunique.com www.cottonunique.com cottonunique.de www.cottonunique.de;

  root /var/www/cottonunique;
  index index.html;

  location / {
    try_files $uri /index.html;
  }
}
```

## 7) German SEO Checklist

- [ ] `hreflang` links present (`en`, `de`, `x-default`)
- [ ] German meta title/description for DE pages
- [ ] Product JSON-LD present
- [ ] Canonical URLs correct per domain
- [ ] German-friendly slugs where applicable

## 8) German Localization Checklist

- [ ] Core ecommerce labels translated (cart, checkout, shipping, returns, wishlist)
- [ ] Legal pages available in German
- [ ] Currency defaults to EUR for DE locale
- [ ] Delivery estimates shown for DE/EU/International
- [ ] VAT wording present on product pages

## 9) Cookie Consent Guide

Current release provides a cookie policy route and settings link in header/footer.

Recommended next step:
- Add a cookie banner with:
  - Necessary cookies (always on)
  - Analytics cookies (opt-in)
  - Marketing cookies (opt-in)
- Store consent in localStorage (or backend for logged-in users)
- Respect consent before loading analytics scripts.

