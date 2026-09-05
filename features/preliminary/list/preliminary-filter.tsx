'use client';

import type { PreliminaryListView } from '@/api/server/method/preliminary/list';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';

type Props = {
  view: PreliminaryListView;
  canCreate: boolean;
  showAttemptsTab: boolean;
};

export default function PreliminaryFilter({
  view,
  canCreate,
  showAttemptsTab,
}: Props) {
  const t = useTranslations('preliminary');
  const common = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get('q') ?? '').trim();
    const params = new URLSearchParams(searchParams.toString());

    if (q) {
      params.set('q', q);
    } else {
      params.delete('q');
    }
    params.delete('page');

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const handleViewChange = (nextView: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextView === 'attempts') {
      params.set('view', 'attempts');
    } else {
      params.delete('view');
    }
    params.delete('q');
    params.delete('page');
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="space-y-3">
      {showAttemptsTab && (
        <Tabs value={view} onValueChange={handleViewChange}>
          <TabsList className="h-12 w-full md:h-9 md:w-fit">
            <TabsTrigger className="min-h-11 flex-1 md:min-h-0" value="papers">
              {t('papers')}
            </TabsTrigger>
            <TabsTrigger
              className="min-h-11 flex-1 md:min-h-0"
              value="attempts"
            >
              {t('myAttempts')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      {view === 'papers' && (
        <form onSubmit={onSubmit}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full min-w-0 md:w-auto md:min-w-[240px] md:flex-1">
              <Input
                name="q"
                defaultValue={searchParams.get('q') || ''}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="h-11 pr-3 pl-9 text-base md:h-8 md:text-sm"
              />
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            <Button
              type="submit"
              variant="secondary"
              className="h-11 flex-1 gap-2 md:ml-auto md:h-8 md:flex-none"
            >
              <Search strokeWidth={2} />
              {common('filter')}
            </Button>
            {canCreate && (
              <Button asChild className="h-11 flex-1 md:h-8 md:flex-none">
                <Link href="/preliminary/create">
                  <Plus />
                  {t('newPaper')}
                </Link>
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
