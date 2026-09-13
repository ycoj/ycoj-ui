import { Badge } from '@/shared/components/ui/badge';
import type { SolutionReviewStatus } from '@/shared/types/problem';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = { status: SolutionReviewStatus };

export default function SolutionStatus({ status }: Props) {
  const t = useTranslations('solution.status');
  return (
    <Badge
      variant={
        status < 1 ? 'destructive' : status === 1 ? 'secondary' : 'outline'
      }
      className="max-w-full whitespace-normal"
      data-llm-text={t(String(status))}
    >
      {status === 3 && <Star className="size-3 shrink-0 text-amber-500" />}
      {t(String(status))}
    </Badge>
  );
}
