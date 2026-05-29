import type { Locale } from './messages';

type Localized<T> = Record<Locale, T>;

export const corporateCopy: Localized<{
  services: { title: string; description: string }[];
  industries: { name: string; description: string }[];
  banner: { title: string; subtitle: string };
}> = {
  en: {
    services: [
      { title: 'Custom Logo Printing', description: 'High-quality, eco-friendly printing with your brand identity' },
      { title: 'Co-branded Gifting Programs', description: 'Collaborative designs that elevate your brand story' },
      { title: 'White-label Export Support', description: 'Complete documentation and compliance for global delivery' },
      { title: 'ESG Sustainability Reports', description: 'Detailed impact reports for your corporate sustainability goals' },
    ],
    industries: [
      { name: 'Retail & Fashion', description: 'Branded bags for stores, events, and customer appreciation' },
      { name: 'Hospitality & Events', description: 'Premium welcome gifts and conference merchandise' },
      { name: 'Tech & Startups', description: 'Modern designs for onboarding kits and swag boxes' },
      { name: 'NGOs & CSR Programs', description: 'Ethical products that align with social impact initiatives' },
    ],
    banner: { title: 'Corporate Solutions', subtitle: 'Custom branding for global teams' },
  },
  de: {
    services: [
      { title: 'Individueller Logo-Druck', description: 'Hochwertiger, umweltfreundlicher Druck mit Ihrer Markenidentität' },
      { title: 'Co-Branding-Geschenkprogramme', description: 'Gemeinsame Designs, die Ihre Markenstory stärken' },
      { title: 'White-Label-Export-Support', description: 'Vollständige Dokumentation und Compliance für weltweite Lieferung' },
      { title: 'ESG-Nachhaltigkeitsberichte', description: 'Detaillierte Wirkungsberichte für Ihre Nachhaltigkeitsziele' },
    ],
    industries: [
      { name: 'Einzelhandel & Mode', description: 'Gebrandete Taschen für Stores, Events und Kundenbindung' },
      { name: 'Hotellerie & Events', description: 'Premium-Willkommensgeschenke und Konferenz-Merchandise' },
      { name: 'Tech & Start-ups', description: 'Moderne Designs für Onboarding-Kits und Swag-Boxen' },
      { name: 'NGOs & CSR-Programme', description: 'Ethische Produkte im Einklang mit sozialen Initiativen' },
    ],
    banner: { title: 'Unternehmenslösungen', subtitle: 'Individuelles Branding für globale Teams' },
  },
};

export const sustainabilityCopy: Localized<{
  materials: { title: string; description: string }[];
  impacts: { metric: string; label: string; description: string }[];
  supplyChain: { title: string; description: string }[];
}> = {
  en: {
    materials: [
      { title: '100% GOTS-Certified Cotton', description: 'Organically grown without harmful pesticides or chemicals' },
      { title: 'Recycled Stitching Threads', description: 'Post-consumer recycled materials for all stitching' },
      { title: 'Biodegradable Packaging', description: 'FSC-certified materials that return to nature' },
      { title: 'Water-Based Inks', description: 'Non-toxic, eco-friendly printing solutions' },
    ],
    impacts: [
      { metric: '60%', label: 'Reduced Carbon Footprint', description: 'Compared to conventional cotton production' },
      { metric: '100%', label: 'Ethical Labor', description: 'Fair wages and safe working conditions' },
      { metric: '500+', label: 'Trees Saved', description: 'Through plastic-free packaging annually' },
      { metric: '90%', label: 'Water Conservation', description: 'Compared to traditional dyeing methods' },
    ],
    supplyChain: [
      {
        title: 'Organic Cotton Farms',
        description:
          'From farm to finished product, every step in our supply chain is documented and verified. We believe in complete transparency, so you can trust that your tote bags are truly sustainable.',
      },
      {
        title: 'Ethical Manufacturing',
        description:
          'Our production partners in India follow fair-trade practices with safe working conditions and fair wages for every artisan involved.',
      },
      {
        title: 'Quality & Export',
        description:
          'Rigorous quality checks and export-ready packaging ensure your order meets international standards before it leaves our facility.',
      },
    ],
  },
  de: {
    materials: [
      { title: '100 % GOTS-zertifizierte Baumwolle', description: 'Bioanbau ohne schädliche Pestizide oder Chemikalien' },
      { title: 'Recycelte Nähfäden', description: 'Post-Consumer-Materialien für alle Nähte' },
      { title: 'Biologisch abbaubare Verpackung', description: 'FSC-zertifizierte Materialien, die zur Natur zurückkehren' },
      { title: 'Wasserbasierte Farben', description: 'Ungiftige, umweltfreundliche Drucklösungen' },
    ],
    impacts: [
      { metric: '60 %', label: 'Reduzierter CO₂-Fußabdruck', description: 'Im Vergleich zur konventionellen Baumwollproduktion' },
      { metric: '100 %', label: 'Ethische Arbeit', description: 'Faire Löhne und sichere Arbeitsbedingungen' },
      { metric: '500+', label: 'Bäume geschützt', description: 'Durch plastikfreie Verpackung jährlich' },
      { metric: '90 %', label: 'Wassereinsparung', description: 'Im Vergleich zu herkömmlichen Färbeverfahren' },
    ],
    supplyChain: [
      {
        title: 'Bio-Baumwollfarmen',
        description:
          'Vom Feld bis zum fertigen Produkt ist jeder Schritt dokumentiert und verifiziert. Volle Transparenz — damit Sie sich auf echte Nachhaltigkeit verlassen können.',
      },
      {
        title: 'Ethische Fertigung',
        description:
          'Unsere Partner in Indien arbeiten nach Fair-Trade-Prinzipien mit sicheren Arbeitsbedingungen und fairen Löhnen.',
      },
      {
        title: 'Qualität & Export',
        description:
          'Strenge Qualitätsprüfungen und exportfähige Verpackung — Ihre Bestellung erfüllt internationale Standards vor dem Versand.',
      },
    ],
  },
};

export const exportCopy: Localized<{
  regions: { name: string }[];
  services: { title: string; description: string }[];
  documents: string[];
  certifications: { name: string; description: string }[];
}> = {
  en: {
    regions: [
      { name: 'European Union', code: 'EU', flag: '🇪🇺' },
      { name: 'United States', code: 'US', flag: '🇺🇸' },
      { name: 'Asia Pacific', code: 'APAC', flag: '🌏' },
      { name: 'Middle East', code: 'ME', flag: '🌍' },
    ],
    services: [
      { title: 'HS Codes & Documentation', description: 'Complete customs documentation with accurate harmonized system codes' },
      { title: 'Compliance Markings', description: 'CE markings and region-specific compliance certifications' },
      { title: 'Localized Labeling', description: 'Multi-language product labels and packaging materials' },
      { title: 'GST & MSME Support', description: 'Full tax compliance for Indian export businesses' },
    ],
    documents: [
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin',
      'Bill of Lading',
      'Export License',
      'GOTS Certificate',
      'FSC Certificate',
      'Quality Test Reports',
    ],
    certifications: [
      { name: 'GOTS', description: 'Global Organic Textile Standard' },
      { name: 'FSC', description: 'Forest Stewardship Council' },
      { name: 'MSME', description: 'Export Compliance Certified' },
      { name: 'ISO', description: 'International quality standards' },
    ],
  },
  de: {
    regions: [
      { name: 'Europäische Union', code: 'EU', flag: '🇪🇺' },
      { name: 'Vereinigte Staaten', code: 'US', flag: '🇺🇸' },
      { name: 'Asien-Pazifik', code: 'APAC', flag: '🌏' },
      { name: 'Naher Osten', code: 'ME', flag: '🌍' },
    ],
    services: [
      { title: 'HS-Codes & Dokumentation', description: 'Vollständige Zolldokumentation mit korrekten HS-Codes' },
      { title: 'Compliance-Kennzeichnung', description: 'CE-Kennzeichnung und regionsspezifische Zertifizierungen' },
      { title: 'Lokalisierte Etikettierung', description: 'Mehrsprachige Produktetiketten und Verpackungsmaterialien' },
      { title: 'GST- & MSME-Support', description: 'Vollständige Steuer-Compliance für indische Exporteure' },
    ],
    documents: [
      'Handelsrechnung',
      'Packliste',
      'Ursprungszeugnis',
      'Konnossement',
      'Exportlizenz',
      'GOTS-Zertifikat',
      'FSC-Zertifikat',
      'Qualitätsprüfberichte',
    ],
    certifications: [
      { name: 'GOTS', description: 'Global Organic Textile Standard' },
      { name: 'FSC', description: 'Forest Stewardship Council' },
      { name: 'MSME', description: 'Kleine und mittlere Unternehmen (Indien)' },
      { name: 'ISO', description: 'Internationale Qualitätsstandards' },
    ],
  },
};

export function pickLocalized<T>(locale: Locale, copy: Localized<T>): T {
  return copy[locale] ?? copy.en;
}
