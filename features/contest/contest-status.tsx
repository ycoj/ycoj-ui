import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';

export type ContestStatus = 'running' | 'pending' | 'ended';

type Props = {
  status: ContestStatus;
  className?: string;
};

export function getContestStatusTextClassName(status: ContestStatus) {
  return cn(
    status === 'running' && 'text-pink-600',
    status === 'pending' && 'text-blue-500',
    status === 'ended' && 'text-foreground'
  );
}

export function getContestStatusBadgeClassName(status: ContestStatus) {
  return cn(
    'bg-muted text-muted-foreground',
    status === 'running' && 'bg-pink-100 text-pink-700',
    status === 'pending' && 'bg-blue-100 text-blue-600'
  );
}

export default function ContestStatus({ status, className }: Props) {
  const t = useTranslations('contest.status');
  const label = t(status);

  return (
    <Badge
      variant="secondary"
      className={cn(getContestStatusBadgeClassName(status), className)}
    >
      <span data-llm-text={label}>{label}</span>
    </Badge>
  );
}
