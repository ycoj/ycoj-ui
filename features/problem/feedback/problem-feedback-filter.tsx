'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  PROBLEM_FEEDBACK_STATUSES,
  type ProblemFeedbackFilterStatus,
} from '@/shared/types/problem-feedback';
import { ListFilter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Props = {
  value: ProblemFeedbackFilterStatus;
};

const statuses: ProblemFeedbackFilterStatus[] = [
  ...PROBLEM_FEEDBACK_STATUSES,
  'all',
];

export default function ProblemFeedbackFilter({ value }: Props) {
  const t = useTranslations('problemFeedback.manage');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (status: ProblemFeedbackFilterStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', status);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-48" aria-label={t('filterLabel')}>
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
