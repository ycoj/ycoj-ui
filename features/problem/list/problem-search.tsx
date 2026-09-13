'use client';

import ProblemCreateOrImportDialog from './problem-create-or-import-dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ListChecks, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';

type Props = {
  canCreate: boolean;
  canReview?: boolean;
};

export default function ProblemSearch({ canCreate, canReview = false }: Props) {
  const t = useTranslations('problem');
  const reviewT = useTranslations('solution.review');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-stretch gap-2">
      <form onSubmit={handleSubmit} className="min-w-0 flex-1">
        <div className="relative">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="pl-10 pr-4 text-sm"
          />
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        </div>
      </form>

      {canCreate && <ProblemCreateOrImportDialog />}
      {canReview && (
        <Button
          asChild
          variant="outline"
          size="icon"
          aria-label={reviewT('title')}
          title={reviewT('title')}
        >
          <Link href="/problem/solution-review" prefetch={false}>
            <ListChecks />
          </Link>
        </Button>
      )}
    </div>
  );
}
