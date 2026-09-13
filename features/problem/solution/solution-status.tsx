import { Badge } from '@/shared/components/ui/badge';
import type { SolutionReviewStatus } from '@/shared/types/problem';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  status: SolutionReviewStatus | undefined;
  /** Backend label used when the status has no local translation yet. */
  fallbackLabel?: string;
};

/** Statuses with a localized label under `solution.status`. */
const localizedStatuses: readonly (SolutionReviewStatus | undefined)[] = [
  -1, 0, 1, 2, 3,
];

export default function SolutionStatus({ status, fallbackLabel }: Props) {
  const t = useTranslations('solution.status');
  const label = localizedStatuses.includes(status)
    ? t(String(status))
    : (fallbackLabel ?? t('unknown'));
  return (
    <Badge
      variant={
        status !== undefined && status < 1
          ? 'destructive'
          : status === 1
            ? 'secondary'
            : 'outline'
      }
      className="max-w-full whitespace-normal"
      data-llm-text={label}
    >
      {status === 3 && <Star className="size-3 shrink-0 text-amber-500" />}
      {label}
    </Badge>
  );
}
