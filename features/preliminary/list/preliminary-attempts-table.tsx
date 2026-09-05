import type { PreliminaryListResponse } from '@/api/server/method/preliminary/list';
import { PreliminaryListEmpty } from '@/features/preliminary/list/preliminary-list-shell';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { History } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = {
  data: Extract<PreliminaryListResponse, { view: 'attempts' }>;
};

export default function PreliminaryAttemptsTable({ data }: Props) {
  const t = useTranslations('preliminary');
  const format = useFormatter();

  if (!data.attempts.length) {
    return (
      <PreliminaryListEmpty
        icon={History}
        title={t('noAttempts')}
        description={t('noAttemptsDescription')}
      />
    );
  }

  return (
    <div
      className="overflow-hidden rounded-xl border bg-card/40"
      data-llm-visible="true"
    >
      <div className="divide-y md:hidden">
        {data.attempts.map((attempt) => (
          <Link
            key={attempt.docId}
            href={`/preliminary/${attempt.paperId}/attempt/${attempt.docId}`}
            prefetch={false}
            className="block space-y-2 p-4 active:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div className="font-medium break-words">{attempt.title}</div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="tabular-nums">
                {t('score')}:{' '}
                <strong>
                  {attempt.score} / {attempt.totalScore}
                </strong>
              </span>
              <span className="text-xs text-muted-foreground">
                {t('revision')}: {attempt.revision}
              </span>
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {format.dateTime(new Date(attempt.submittedAt), {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </div>
          </Link>
        ))}
      </div>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>{t('paper')}</TableCell>
              <TableCell>{t('score')}</TableCell>
              <TableCell>{t('revision')}</TableCell>
              <TableCell>{t('submittedAt')}</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.attempts.map((attempt) => (
              <TableRow key={attempt.docId}>
                <TableCell>
                  <Link
                    href={`/preliminary/${attempt.paperId}/attempt/${attempt.docId}`}
                    prefetch={false}
                    className="font-medium hover:text-primary hover:underline"
                    data-llm-text={attempt.title}
                  >
                    {attempt.title}
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">
                  <strong>{attempt.score}</strong> / {attempt.totalScore}
                </TableCell>
                <TableCell className="tabular-nums">
                  {attempt.revision}
                </TableCell>
                <TableCell className="tabular-nums">
                  {format.dateTime(new Date(attempt.submittedAt), {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
