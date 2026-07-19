import { getContestProblemLabel } from './contest-utils';
import type { ContestProblemsData } from '@/api/server/method/contests/problems';
import { ContestProblemStatus } from '@/api/server/method/contests/problems';
import ProblemLink from '@/features/problem/problem-link';
import ProblemStatus from '@/features/problem/problem-status';
import { Empty, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = {
  tid: string;
  data: ContestProblemsData;
};

function ProblemStatusCell({ psdoc }: { psdoc?: ContestProblemStatus }) {
  const t = useTranslations('problem');
  if (!psdoc) {
    return <span className="text-muted-foreground">{t('notSubmitted')}</span>;
  }

  if ('status' in psdoc) {
    return <ProblemStatus status={psdoc} />;
  }

  return <Link href={`/record/${psdoc.rid}`}>{t('submitted')}</Link>;
}

export default function ContestProblemList({ tid, data }: Props) {
  const t = useTranslations('problem');
  const common = useTranslations('common');
  const orderedPids = data.tdoc.pids ?? [];

  if (!orderedPids.length) {
    return (
      <Empty data-llm-visible="true">
        <EmptyHeader>
          <EmptyTitle data-llm-text={t('none')}>{t('none')}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table className="table-fixed" data-llm-visible="true">
      <colgroup>
        <col className="w-24" />
        <col className="w-8" />
        <col />
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableCell>{common('status')}</TableCell>
          <TableCell>#</TableCell>
          <TableCell>{common('problem')}</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orderedPids.map((pid, index) => {
          const problem = data.pdict[pid];

          return (
            <TableRow key={pid}>
              <TableCell>
                <div className="inline-flex">
                  <ProblemStatusCell psdoc={data.psdict[pid]} />
                </div>
              </TableCell>
              <TableCell className="tabular-nums">
                {getContestProblemLabel(index)}
              </TableCell>
              <TableCell>
                {problem ? (
                  <ProblemLink problem={problem} tid={tid} />
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
