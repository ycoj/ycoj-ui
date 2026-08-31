import { formatProblemPid } from '@/features/problem/lib/format-problem-pid';
import { Button } from '@/shared/components/ui/button';
import {
  ContestListProjectionProblem,
  PublicProjectionProblem,
} from '@/shared/types/problem';
import { useTranslations } from 'next-intl';
import Link, { type LinkProps } from 'next/link';

export type Props = {
  problem: ContestListProjectionProblem;
  tid?: string;
  openInNewTab?: boolean;
  showId?: boolean;
  prefetch?: LinkProps['prefetch'];
};

export default function ProblemLink({
  problem,
  tid,
  openInNewTab,
  showId,
  prefetch = false,
}: Props) {
  const t = useTranslations('misc');
  const hrefPid = problem.pid || problem.docId;
  const displayPid = formatProblemPid(problem);
  const href = tid ? `/problem/${hrefPid}?tid=${tid}` : `/problem/${hrefPid}`;

  return (
    <Button className="h-6 px-0" variant="link" asChild>
      <Link
        href={href}
        prefetch={prefetch}
        {...(openInNewTab && {
          target: '_blank',
          rel: 'noopener noreferrer',
        })}
      >
        <span className="space-x-1">
          <span
            data-llm-text={
              showId ? `${displayPid}. ${problem.title}` : problem.title
            }
          >
            {showId && `${displayPid}. `}
            {problem.title}
          </span>
          {(problem as PublicProjectionProblem).hidden && (
            <span className="text-primary" data-llm-text={t('hidden')}>
              {t('hidden')}
            </span>
          )}
        </span>
      </Link>
    </Button>
  );
}
