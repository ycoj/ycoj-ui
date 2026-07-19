export const locales = ['zh', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';

export function normalizeLocale(value: string | undefined | null): Locale {
  const language = value?.toLowerCase().split('-')[0];
  return language === 'en' ? 'en' : defaultLocale;
}

export function normalizeAcceptLanguage(
  value: string | undefined | null
): Locale {
  const preferences = value
    ?.split(',')
    .map((preference, index) => {
      const [languageTag, ...parameters] = preference.trim().split(';');
      const qualityParameter = parameters.find((parameter) =>
        /^\s*q\s*=/i.test(parameter)
      );
      const quality = qualityParameter
        ? Number(qualityParameter.split('=')[1]?.trim())
        : 1;

      return { index, languageTag, quality };
    })
    .filter(
      (preference) =>
        preference.languageTag &&
        Number.isFinite(preference.quality) &&
        preference.quality > 0 &&
        preference.quality <= 1
    )
    .sort(
      (first, second) =>
        second.quality - first.quality || first.index - second.index
    );

  for (const preference of preferences ?? []) {
    const language = preference.languageTag.toLowerCase().split('-')[0];
    if (isLocale(language)) return language;
  }

  return defaultLocale;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'zh' || value === 'en';
}
