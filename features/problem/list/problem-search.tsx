'use client';

import ProblemCreateOrImportDialog from './problem-create-or-import-dialog';
import { Input } from '@/shared/components/ui/input';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';

type Props = {
  canCreate: boolean;
};

export default function ProblemSearch({ canCreate }: Props) {
  const t = useTranslations('problem');
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
    </div>
  );
}
