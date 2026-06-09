import { useI18n } from '../contexts/I18nContext';

type LanguageToggleProps = {
  className?: string;
};

export default function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { effectiveLocale, setLocale } = useI18n();

  return (
    <div
      className={`inline-flex items-center p-1 rounded-lg border-2 border-[var(--beige-500)] bg-white/80 shadow-md ring-1 ring-[var(--beige-300)] ${className}`}
      role="group"
      aria-label="Language"
    >
      {(['en', 'de'] as const).map((lang) => {
        const active = effectiveLocale === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => setLocale(lang)}
            className={`min-w-[2rem] sm:min-w-[2.5rem] px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-md transition-all duration-200 ${
              active
                ? 'bg-[var(--beige-700)] text-white shadow-sm scale-[1.02]'
                : 'text-[var(--text-color)] hover:bg-[var(--beige-200)] hover:text-[var(--beige-800)]'
            }`}
            aria-pressed={active}
          >
            {lang}
          </button>
        );
      })}
    </div>
  );
}
