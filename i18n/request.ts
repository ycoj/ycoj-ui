import {
  defaultLocale,
  isLocale,
  normalizeAcceptLanguage,
  normalizeLocale,
  type Locale,
} from './config';
import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get('NEXT_LOCALE')?.value;
  const acceptLanguage = (await headers()).get('accept-language');
  const locale: Locale = isLocale(cookieLocale)
    ? cookieLocale
    : cookieLocale
      ? normalizeLocale(cookieLocale)
      : normalizeAcceptLanguage(acceptLanguage);

  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale: locale || defaultLocale, messages };
});
