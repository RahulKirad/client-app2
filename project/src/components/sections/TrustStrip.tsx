import { Award, ShieldCheck, Leaf, Globe } from 'lucide-react';
import { useLocalizedSectionContent } from '../../hooks/useLocalizedSectionContent';

const items = [
  { icon: Leaf, label: 'GOTS Certified' },
  { icon: ShieldCheck, label: 'FSC Compliant' },
  { icon: Award, label: 'MSME Registered' },
  { icon: Globe, label: 'Export Ready' },
];

const trustFallback = {
  headline: 'Certified sustainable · Trusted by businesses worldwide',
  items: ['GOTS Certified', 'FSC Compliant', 'MSME Registered', 'Export Ready'],
};

export default function TrustStrip() {
  const { content: trustContent } = useLocalizedSectionContent('trust_strip', trustFallback);
  const labels =
    Array.isArray(trustContent.items) && trustContent.items.length > 0
      ? trustContent.items.map((item) => String(item))
      : trustFallback.items;

  return (
    <section
      className="py-8 border-y border-[var(--beige-300)]"
      style={{ backgroundColor: 'var(--beige-100)' }}
      aria-label="Certifications and trust"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold mb-6 uppercase tracking-wide" style={{ color: 'var(--heading-color)', fontFamily: 'var(--heading-font)' }}>
          {String(trustContent.headline || trustFallback.headline)}
        </p>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 sm:gap-x-14">
          {labels.map((label, idx) => {
            const Icon = items[idx % items.length].icon;
            return (
            <div key={label} className="flex items-center gap-2">
              <Icon size={20} style={{ color: 'var(--beige-700)' }} aria-hidden />
              <span className="text-sm font-medium" style={{ color: 'var(--text-color)', fontFamily: 'var(--body-font)' }}>
                {label}
              </span>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
