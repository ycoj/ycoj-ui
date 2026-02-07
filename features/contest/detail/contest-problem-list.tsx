import type { ContestProblemsResponse } from '@/api/server/method/contests/problems';
import { Badge } from '@/shared/components/ui/badge';
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
  data: ContestProblemsResponse;
};

function ProblemStatusCell({ rid }: { rid?: string }) {
  if (!rid) {
    return <span className="text-muted-foreground">未提交</span>;
  }

  return (
    <Badge asChild variant="secondary">
      <Link href={`/record/${rid}`}>
        <span data-llm-text="已提交">已提交</span>
      </Link>
    </Badge>
  );
}

export default function ContestProblemList({ tid, data }: Props) {
  const orderedPids = data.tdoc.pids ?? [];

  if (!orderedPids.length) {
    return (
      <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
        <span data-llm-text="暂无题目">暂无题目</span>
      </div>
    );
  }

  return (
    <Table className="table-fixed" data-llm-visible="true">
      <colgroup>
        <col className="w-14" />
        <col className="w-24" />
        <col />
        <col className="w-24" />
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableCell>#</TableCell>
          <TableCell>题目 ID</TableCell>
          <TableCell>题目</TableCell>
          <TableCell className="text-right">状态</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orderedPids.map((pid, index) => {
          const problem = data.pdict[pid];
          const submit = data.psdict[pid];

          return (
            <TableRow key={pid}>
              <TableCell className="tabular-nums">{index + 1}</TableCell>
              <TableCell className="tabular-nums" data-llm-text={String(pid)}>
                {pid}
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
                  <ProblemStatusCell rid={submit?.rid} />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
