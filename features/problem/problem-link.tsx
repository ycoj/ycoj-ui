import { Button } from '@/shared/components/ui/button';
import {
  ContestListProjectionProblem,
  PublicProjectionProblem,
} from '@/shared/types/problem';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export type Props = {
  problem: ContestListProjectionProblem;
  tid?: string;
  openInNewTab?: boolean;
};

export default function ProblemLink({ problem, tid, openInNewTab }: Props) {
  const t = useTranslations('misc');
  const problemId = problem.pid ?? problem.docId;
  const href = tid
    ? `/problem/${problemId}?tid=${tid}`
    : `/problem/${problemId}`;

  return (
    <Button className="h-6 px-0" variant="link" asChild>
      <Link
        href={href}
        {...(openInNewTab && {
          target: '_blank',
          rel: 'noopener noreferrer',
        })}
      >
        <span className="space-x-1">
          <span data-llm-text={problem.title}>{problem.title}</span>
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
