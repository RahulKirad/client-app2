import { useMemo } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { localizeSection } from '../i18n/localizeContent';
import {
  useManagedSectionContent,
  type ManagedSectionContentResult,
} from './useManagedSectionContent';

/**
 * CMS section content with German overlays when the active locale is de.
 */
export function useLocalizedSectionContent<T extends Record<string, unknown>>(
  sectionKey: string,
  fallback: T
): ManagedSectionContentResult<T> {
  const { effectiveLocale } = useI18n();
  const { content, version } = useManagedSectionContent(sectionKey, fallback);

  const localized = useMemo(
    () => localizeSection(sectionKey, content, effectiveLocale),
    [sectionKey, content, effectiveLocale]
  );

  return { content: localized, version };
}
