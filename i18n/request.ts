import {
  defaultLocale,
  isLocale,
  normalizeLocale,
  type Locale,
} from './config';
import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get('NEXT_LOCALE')?.value;
  const headerLocale = (await headers()).get('accept-language')?.split(',')[0];
  const locale: Locale = isLocale(cookieLocale)
    ? cookieLocale
    : cookieLocale
      ? normalizeLocale(cookieLocale)
      : normalizeLocale(headerLocale);

  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale: locale || defaultLocale, messages };
});
