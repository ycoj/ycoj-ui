import type { RecordListResponse } from '@/api/server/method/record/list';
import type { LanguageFamily } from '@/api/server/method/ui/languages';
import ProblemLink from '@/features/problem/problem-link';
import ProblemStatus from '@/features/problem/problem-status';
import UserSpan from '@/features/user/user-span';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { STATUS_BACKGROUND_COLOR } from '@/shared/configs/status';
import { formatMemory, formatTime } from '@/shared/lib/format-units';
import oid2ts from '@/shared/lib/oid2ts';
import type { ProblemStatus as ProblemStatusDoc } from '@/shared/types/problem';
import dayjs from 'dayjs';

type Props = {
  data: RecordListResponse;
  languages: Record<string, LanguageFamily>;
};

export default function RecordList({ data, languages }: Props) {
  // Get language display name
  const getLanguageDisplayName = (lang: string): string => {
    for (const family of Object.values(languages)) {
      const version = family.versions.find((v) => v.name === lang);
      if (version) {
        return version.display;
      }
    }
    return lang;
  };
  return (
    <Table className="table-fixed" data-llm-visible="true">
      <colgroup>
        <col className="w-20 md:w-28" />
        <col className="w-14" />
        <col />
        <col className="w-28 md:w-48" />
        <col className="hidden md:table-cell w-14" />
        <col className="hidden md:table-cell w-14" />
        <col className="hidden md:table-cell w-24" />
        <col className="hidden md:table-cell w-32" />
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableCell>状态</TableCell>
          <TableCell>得分</TableCell>
          <TableCell>题目</TableCell>
          <TableCell className="text-right">提交者</TableCell>
          <TableCell className="hidden md:table-cell text-center">
            用时
          </TableCell>
          <TableCell className="hidden md:table-cell text-center">
            内存
          </TableCell>
          <TableCell className="hidden md:table-cell text-center">
            语言
          </TableCell>
          <TableCell className="hidden md:table-cell text-center">
            提交时间
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.rdocs.map((record) => {
          const pdoc = data.pdict[record.pid];
          const udoc = data.udict[record.uid];
          const statusDoc: ProblemStatusDoc = {
            _id: record._id,
            docId: record.pid,
            docType: 10,
            domainId: record.domainId,
            status: record.status,
            rid: record._id,
          };
          const scoreColor =
            STATUS_BACKGROUND_COLOR[
              record.status as keyof typeof STATUS_BACKGROUND_COLOR
            ] || '#6b7280';
          const submittedAtMs = oid2ts(record._id);
          const submittedAt = Number.isFinite(submittedAtMs)
            ? dayjs(submittedAtMs).format('MM-DD HH:mm:ss')
            : '';

          return (
            <TableRow key={record._id}>
              <TableCell>
                <ProblemStatus status={statusDoc} />
              </TableCell>
              <TableCell className="tabular-nums">
                <span
                  style={{ color: scoreColor }}
                  data-llm-text={String(record.score)}
                >
                  {record.score}
                </span>
              </TableCell>
              <TableCell>
                {pdoc ? <ProblemLink problem={pdoc} /> : record.pid}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  {udoc ? <UserSpan user={udoc} showAvatar /> : record.uid}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-center tabular-nums">
                {formatTime(record.time)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-center tabular-nums">
                {formatMemory(record.memory)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-center">
                {getLanguageDisplayName(record.lang)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-center tabular-nums">
                {submittedAt || '-'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
