/**
 * Defaults for `ecotote_duopack` CMS section (homepage EcoTote DuoPack block).
 * Used by the public page, admin ContentManager preview/edit merge, and kept in sync with backend seed/migration.
 */
export const ecototeDuopackDefaults = {
  heading: 'ECOTOTE',
  subheading: 'Our Competitive Edge',
  description:
    "We provide lower than industry standard MOQ's to help test markets and refine products at competitive prices.",
  cta: 'Request Quote for EcoTote DuoPack',
  image: '/images/banner/d.png',
  outer_bag: {
    title: 'Outer Bag',
    material: '100% cotton, 180 GSM',
    size: 'available in customized size',
    printing: 'Water-based (1–3 colors)',
    certification: 'GOTS compliant',
  },
  inner_bag: {
    title: 'Inner Bag',
    material: 'PLA/PBAT blend',
    size: 'available in customized size',
    finish: 'Transparent or frosted',
    certification: 'ISO/IEC17025, ASTM D6866',
  },
};

function mergeStringRecord<T extends Record<string, string>>(defaults: T, current: unknown): T {
  const partial =
    current && typeof current === 'object' && !Array.isArray(current)
      ? (current as Partial<T>)
      : {};
  return { ...defaults, ...partial };
}

/** Deep-merge bag specs onto defaults so API payloads missing nested keys still render and edit correctly. */
export function mergeEcototeContent(raw: unknown): typeof ecototeDuopackDefaults {
  const obj = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    heading: String(obj.heading ?? ecototeDuopackDefaults.heading),
    subheading: String(obj.subheading ?? ecototeDuopackDefaults.subheading),
    description: String(obj.description ?? ecototeDuopackDefaults.description),
    cta: String(obj.cta ?? ecototeDuopackDefaults.cta),
    image: String(obj.image ?? ecototeDuopackDefaults.image),
    outer_bag: mergeStringRecord(ecototeDuopackDefaults.outer_bag, obj.outer_bag),
    inner_bag: mergeStringRecord(ecototeDuopackDefaults.inner_bag, obj.inner_bag),
  };
}
