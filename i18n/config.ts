export const locales = ['zh', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';

export function normalizeLocale(value: string | undefined | null): Locale {
  const language = value?.toLowerCase().split('-')[0];
  return language === 'en' ? 'en' : defaultLocale;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'zh' || value === 'en';
}
