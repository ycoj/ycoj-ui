'use client';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';

export default function ExpirationFilter({ query }: { query: string }) {
  const t = useTranslations('accountExpiration');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim();
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set('q', q);
    else params.delete('q');
    params.delete('page');
    router.push(params.size ? `${pathname}?${params}` : pathname);
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <Input
        key={query}
        name="q"
        type="search"
        defaultValue={query}
        aria-label={t('searchPlaceholder')}
        placeholder={t('searchPlaceholder')}
        className="w-64 max-w-full"
      />
      <Button type="submit" variant="secondary">
        <Search aria-hidden="true" />
        {t('search')}
      </Button>
    </form>
  );
}
