import type { HomeworkDetailTdoc } from '@/api/server/method/homework/detail';
import ProblemStatus from '@/features/problem/problem-status';
import { Empty, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import type {
  HomeworkProblemStatusDict,
  HomeworkStatus,
} from '@/shared/types/homework';
import type {
  ProblemDict,
  ProblemStatus as ProblemStatusDoc,
} from '@/shared/types/problem';
import Link from 'next/link';

type Props = {
  tid: string;
  homework: HomeworkDetailTdoc;
  homeworkStatus?: HomeworkStatus | null;
  pdict?: ProblemDict;
  psdict?: HomeworkProblemStatusDict;
};

function buildStatusDoc(
  pid: number,
  status: NonNullable<HomeworkProblemStatusDict[number]> | undefined,
  domainId: string
) {
  if (!status || status.status === undefined || status.status === null) {
    return null;
  }

  const recordId = status.rid ?? '';

  const doc: ProblemStatusDoc = {
    _id: recordId,
    docId: pid,
    docType: 10,
    domainId,
    status: status.status,
    rid: status.rid,
  };

  return doc;
}

function ProblemStatusCell({
  pid,
  status,
  domainId,
}: {
  pid: number;
  status?: HomeworkProblemStatusDict[number];
  domainId: string;
}) {
  if (!status) {
    return <span className="text-muted-foreground">未提交</span>;
  }

  const statusDoc = buildStatusDoc(pid, status, domainId);

  if (statusDoc) {
    return <ProblemStatus status={statusDoc} />;
  }

  if (status.rid) {
    return <Link href={`/record/${status.rid}`}>已提交</Link>;
  }

  return <span className="text-muted-foreground">已提交</span>;
}

export default function HomeworkProblemList({
  tid,
  homework,
  homeworkStatus,
  pdict,
  psdict,
}: Props) {
  const orderedPids = homework.pids ?? [];
  const allowTidParam = Boolean(
    homeworkStatus?.attend && homeworkStatus?.startAt
  );

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
        <col className="w-24" />
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
        {orderedPids.map((pid) => {
          const problem = pdict?.[pid];
          const status = psdict?.[pid];
          const problemId = problem?.pid ?? problem?.docId ?? pid;
          const problemHref = allowTidParam
            ? `/problem/${problemId}?tid=${tid}`
            : `/problem/${problemId}`;

          return (
            <TableRow key={pid}>
              <TableCell
                className="tabular-nums"
                data-llm-text={String(problem?.pid ?? pid)}
              >
                {problem?.pid ?? pid}
              </TableCell>
              <TableCell>
                {problem ? (
                  <Link
                    className="hover:text-primary hover:underline"
                    href={problemHref}
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
                  <ProblemStatusCell
                    pid={pid}
                    status={status}
                    domainId={homework.domainId}
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
