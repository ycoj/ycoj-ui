import type { ContestProblemsData } from '@/api/server/method/contests/problems';
import { ContestProblemStatus } from '@/api/server/method/contests/problems';
import ProblemStatus from '@/features/problem/problem-status';
import { Empty, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import Link from 'next/link';

type Props = {
  tid: string;
  data: ContestProblemsData;
};

function ProblemStatusCell({ psdoc }: { psdoc?: ContestProblemStatus }) {
  if (!psdoc) {
    return <span className="text-muted-foreground">未提交</span>;
  }

  if ('status' in psdoc) {
    return <ProblemStatus status={psdoc} />;
  }

  return <Link href={`/record/${psdoc.rid}`}>已提交</Link>;
}

export default function ContestProblemList({ tid, data }: Props) {
  const orderedPids = data.tdoc.pids ?? [];

  if (!orderedPids.length) {
    return (
      <Empty data-llm-visible="true">
        <EmptyHeader>
          <EmptyTitle data-llm-text="暂无题目">暂无题目</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table className="table-fixed" data-llm-visible="true">
      <colgroup>
        <col className="w-14" />
        <col />
        <col className="w-24" />
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableCell>#</TableCell>
          <TableCell>题目</TableCell>
          <TableCell className="text-right">状态</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orderedPids.map((pid, index) => {
          const problem = data.pdict[pid];

          return (
            <TableRow key={pid}>
              <TableCell className="tabular-nums">
                {String.fromCharCode(65 + index)}
              </TableCell>
              <TableCell>
                {problem ? (
                  <Link
                    className="hover:text-primary hover:underline"
                    href={`/problem/${problem.pid ?? problem.docId}?tid=${tid}`}
                    data-llm-text={problem.title}
                  >
                    {problem.title}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex">
                  <ProblemStatusCell psdoc={data.psdict[pid]} />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
