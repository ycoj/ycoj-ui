'use client';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type { RealnameFilterStatus } from '@/shared/types/realname';
import { ListFilter, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';

type Props = {
  value: RealnameFilterStatus;
  username: string;
};

const statuses: RealnameFilterStatus[] = [
  'pending',
  'approved',
  'rejected',
  'all',
];

export default function RealnameReviewFilter({ value, username }: Props) {
  const t = useTranslations('realname.manage');
  const common = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (status: RealnameFilterStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', status);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const uname = String(formData.get('uname') ?? '').trim();
    const params = new URLSearchParams(searchParams.toString());
    if (uname) {
      params.set('uname', uname);
    } else {
      params.delete('uname');
    }
    params.delete('page');
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
        <div className="relative w-56">
          <Input
            name="uname"
            type="search"
            defaultValue={username}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchLabel')}
            autoComplete="off"
            className="pl-9"
          />
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Button type="submit" variant="secondary">
          <Search />
          {common('search')}
        </Button>
      </form>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-44" aria-label={t('filterLabel')}>
          <ListFilter className="size-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {t(`filter.${status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
