import type { PreliminaryListResponse } from '@/api/server/method/preliminary/list';
import { PreliminaryListEmpty } from '@/features/preliminary/list/preliminary-list-shell';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import type { PreliminaryPaperSummary } from '@/shared/types/preliminary';
import { Code2, FileText, History, Search } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Fragment } from 'react';

function PreliminaryItem({ paper }: { paper: PreliminaryPaperSummary }) {
  const t = useTranslations('preliminary');
  const format = useFormatter();
  const paperHref = `/preliminary/${paper.docId}`;
  const description = paper.content?.trim();

  return (
    <div data-llm-visible="true" className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={paperHref}
          prefetch={false}
          data-llm-text={paper.title}
          className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline md:text-lg"
        >
          {paper.title}
        </Link>
        {!paper.published && (
          <Badge variant="secondary" className="shrink-0">
            <span data-llm-text={t('draft')}>{t('draft')}</span>
          </Badge>
        )}
      </div>

      {description && (
        <p
          className="line-clamp-1 text-xs text-muted-foreground md:text-sm"
          data-llm-text={description}
        >
          {description}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-muted-foreground">
          <Badge variant="secondary" title={t('questions')}>
            <FileText data-icon="inline-start" />
            <span
              data-llm-text={String(paper.questionCount)}
              className="tabular-nums"
            >
              {t('questionCount', { count: paper.questionCount })}
            </span>
          </Badge>
          <Badge variant="secondary" title={t('points')}>
            <Code2 data-icon="inline-start" />
            <span
              data-llm-text={String(paper.totalScore)}
              className="tabular-nums"
            >
              {t('totalScore', { count: paper.totalScore })}
            </span>
          </Badge>
          <Badge variant="secondary" title={t('attempts')}>
            <History data-icon="inline-start" />
            <span
              data-llm-text={String(paper.nAttempt)}
              className="tabular-nums"
            >
              {t('attemptCount', { count: paper.nAttempt })}
            </span>
          </Badge>
          <span className="tabular-nums">
            {format.dateTime(new Date(paper.updatedAt), {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

type Props = {
  data: Extract<PreliminaryListResponse, { view: 'papers' }>;
};

export default function PreliminaryList({ data }: Props) {
  const t = useTranslations('preliminary');
  if (!data.papers.length) {
    return (
      <PreliminaryListEmpty
        icon={Search}
        title={t('noPapers')}
        description={t('noPapersDescription')}
      />
    );
  }

  return (
    <div
      className="overflow-hidden rounded-xl border bg-card/40"
      data-llm-visible="true"
    >
      {data.papers.map((paper, index) => (
        <Fragment key={paper.docId}>
          <div className="px-4 py-4 transition-colors hover:bg-accent/30 sm:px-5">
            <PreliminaryItem paper={paper} />
          </div>
          {index < data.papers.length - 1 && <Separator />}
        </Fragment>
      ))}
    </div>
  );
}
