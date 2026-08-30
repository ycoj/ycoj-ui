'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type { RealnameFilterStatus } from '@/shared/types/realname';
import { ListFilter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Props = {
  value: RealnameFilterStatus;
};

const statuses: RealnameFilterStatus[] = [
  'pending',
  'approved',
  'rejected',
  'all',
];

export default function RealnameReviewFilter({ value }: Props) {
  const t = useTranslations('realname.manage');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (status: RealnameFilterStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', status);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
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
  );
}
