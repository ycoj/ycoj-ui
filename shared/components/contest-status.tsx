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
    status === 'pending' && 'text-sky-700 dark:text-sky-300',
    status === 'ended' && 'text-foreground'
  );
}

export function getContestStatusHoverTextClassName(status: ContestStatus) {
  return cn(
    status === 'running' && 'hover:text-pink-600',
    status === 'pending' && 'hover:text-sky-700 dark:hover:text-sky-300',
    status === 'ended' && 'hover:text-primary'
  );
}

export function getContestStatusBadgeClassName(status: ContestStatus) {
  return cn(
    'bg-muted text-muted-foreground',
    status === 'running' && 'bg-pink-100 text-pink-700',
    status === 'pending' &&
      'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
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
