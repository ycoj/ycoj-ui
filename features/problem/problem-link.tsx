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
  idColor?: string;
};

export default function ProblemLink({
  problem,
  tid,
  openInNewTab,
  showId,
  prefetch = false,
  idColor,
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
        {/* Separators must be real spaces inside one inline flow: margins or
            flex gaps are not painted by text-decoration, so the link underline
            would break between pid and title. */}
        <span>
          {showId && (
            <span
              className="dark:brightness-150"
              style={idColor ? { color: idColor } : undefined}
              data-llm-text={`${displayPid}.`}
            >
              {displayPid}.{' '}
            </span>
          )}
          <span data-llm-text={problem.title}>{problem.title}</span>
          {(problem as PublicProjectionProblem).hidden && (
            <span className="text-primary" data-llm-text={t('hidden')}>
              {' '}
              {t('hidden')}
            </span>
          )}
        </span>
      </Link>
    </Button>
  );
}
