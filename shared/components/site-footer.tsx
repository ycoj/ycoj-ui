'use client';

import { locales, type Locale } from '@/i18n/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function SiteFooter() {
  const locale = useLocale() as Locale;
  const t = useTranslations('common');
  const router = useRouter();

  const changeLocale = (value: string) => {
    if (!locales.includes(value as Locale)) return;
    document.cookie = `NEXT_LOCALE=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <footer
      className="flex justify-end px-1 py-1 text-xs text-muted-foreground"
      data-llm-visible="true"
    >
      <Select value={locale} onValueChange={changeLocale}>
        <SelectTrigger
          className="size-8 rounded-full border-0 p-0 shadow-none hover:bg-muted/60"
          aria-label={t('language')}
          title={t('language')}
        >
          <Languages className="size-4" aria-hidden="true" />
          <SelectValue className="sr-only" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="zh">{t('chinese')}</SelectItem>
          <SelectItem value="en">{t('english')}</SelectItem>
        </SelectContent>
      </Select>
    </footer>
  );
}
