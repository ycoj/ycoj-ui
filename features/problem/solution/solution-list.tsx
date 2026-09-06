import SolutionItem from './solution-item';
import type { ProblemSolutionResponse } from '@/api/server/method/problems/solution';
import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import { Separator } from '@/shared/components/ui/separator';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Fragment } from 'react';

type Props = {
  data: ProblemSolutionResponse;
  viewerId?: number;
  allowEditAny: boolean;
  allowEditSelf: boolean;
  allowDeleteAny: boolean;
  allowDeleteSelf: boolean;
};

export default function SolutionList({
  data,
  viewerId,
  allowEditAny,
  allowEditSelf,
  allowDeleteAny,
  allowDeleteSelf,
}: Props) {
  const t = useTranslations('solution');
  const pid = data.pdoc.pid ?? data.pdoc.docId;
  const approved = data.psdocs.filter((solution) => solution.reviewStatus >= 2);
  const unapproved = data.psdocs.filter(
    (solution) => solution.reviewStatus < 2
  );

  if (!data.psdocs.length) {
    return (
      <Empty data-llm-visible="true">
        <EmptyMedia variant="icon">
          <Lightbulb strokeWidth={2} />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle data-llm-text={t('none')}>{t('none')}</EmptyTitle>
          <EmptyDescription data-llm-text={t('noneDescription')}>
            {t('noneDescription')}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="secondary">
            <Link href={`/problem/${pid}/solution`}>
              <RefreshCw
                strokeWidth={2}
                className="size-4"
                data-icon="inline-start"
              />
              <span data-llm-text={t('refresh')}>{t('refresh')}</span>
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const renderSolutions = (solutions: typeof data.psdocs) => (
    <div className="space-y-6">
      {solutions.map((solution, index) => (
        <Fragment key={solution.docId}>
          <SolutionItem
            solution={solution}
            udict={data.udict}
            pssdict={data.pssdict}
            pid={pid}
            viewerId={viewerId}
            allowEditAny={allowEditAny}
            allowEditSelf={allowEditSelf}
            allowDeleteAny={allowDeleteAny}
            allowDeleteSelf={allowDeleteSelf}
          />
          {index < solutions.length - 1 && <Separator className="mt-6" />}
        </Fragment>
      ))}
    </div>
  );

  return (
    <div className="space-y-6" data-llm-visible="true">
      {approved.length > 0 && renderSolutions(approved)}
      {unapproved.length > 0 && (
        <details className="border-t pt-4">
          <summary className="cursor-pointer text-sm font-medium">
            {t('unapproved', { count: unapproved.length })}
          </summary>
          <div className="mt-6">{renderSolutions(unapproved)}</div>
        </details>
      )}
    </div>
  );
}
