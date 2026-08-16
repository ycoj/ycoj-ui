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
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = {
  data: RecordListResponse;
  languages: Record<string, LanguageFamily>;
};

export default function RecordList({ data, languages }: Props) {
  const common = useTranslations('common');
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
        <col className="w-20 md:w-34" />
        <col className="w-14" />
        <col />
        <col className="w-28 md:w-48" />
        <col className="hidden w-14 md:table-column" />
        <col className="hidden w-14 md:table-column" />
        <col className="hidden w-24 md:table-column" />
        <col className="hidden w-32 md:table-column" />
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableCell>{common('status')}</TableCell>
          <TableCell>{common('score')}</TableCell>
          <TableCell>{common('problem')}</TableCell>
          <TableCell className="text-right">{common('submitter')}</TableCell>
          <TableCell className="hidden md:table-cell text-center">
            {common('time')}
          </TableCell>
          <TableCell className="hidden md:table-cell text-center">
            {common('memory')}
          </TableCell>
          <TableCell className="hidden md:table-cell text-center">
            {common('languageLabel')}
          </TableCell>
          <TableCell className="hidden md:table-cell text-center">
            {common('submitTime')}
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
                <Link
                  href={`/record/${record._id}`}
                  className="hover:underline"
                  data-llm-visible="true"
                >
                  <span
                    style={{ color: scoreColor }}
                    data-llm-text={String(record.score)}
                  >
                    {record.score}
                  </span>
                </Link>
              </TableCell>
              <TableCell>
                {pdoc ? <ProblemLink problem={pdoc} showId /> : record.pid}
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
