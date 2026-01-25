import type { LanguageFamily } from '@/api/server/method/ui/languages';
import ProblemLink from '@/features/problem/problem-link';
import ProblemStatus from '@/features/problem/problem-status';
import UserSpan from '@/features/user/user-span';
import { Button } from '@/shared/components/ui/button';
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
import { cn } from '@/shared/lib/utils';
import type {
  ProblemDoc,
  ProblemStatus as ProblemStatusDoc,
} from '@/shared/types/problem';
import type { RecordDoc } from '@/shared/types/record';
import type { User } from '@/shared/types/user';
import dayjs from 'dayjs';

type Props = {
  rdoc: RecordDoc;
  pdoc: ProblemDoc;
  udoc: User;
  languages: Record<string, LanguageFamily>;
  allowRejudge: boolean;
};

export default function RecordDetail({
  rdoc,
  pdoc,
  udoc,
  languages,
  allowRejudge,
}: Props) {
  const submittedAtMs = oid2ts(rdoc._id);
  const submittedAt = Number.isFinite(submittedAtMs)
    ? dayjs(submittedAtMs).format('MM-DD HH:mm:ss')
    : '';
  const judgedAt = dayjs(rdoc.judgeAt).isValid()
    ? dayjs(rdoc.judgeAt).format('MM-DD HH:mm:ss')
    : '';

  const statusDoc: ProblemStatusDoc = {
    _id: rdoc._id,
    docId: rdoc.pid,
    docType: 10,
    domainId: rdoc.domainId,
    status: rdoc.status,
  };

  const scoreColor =
    STATUS_BACKGROUND_COLOR[
      rdoc.status as keyof typeof STATUS_BACKGROUND_COLOR
    ] || '#6b7280';

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
        <col className={cn(allowRejudge ? 'w-28 md:w-56' : 'w-20 md:w-28')} />
        <col className="w-14" />
        <col />
        <col className="w-28 md:w-48" />
        <col className="w-24" />
        <col className="w-16" />
        <col className="w-14" />
        <col className="w-14" />
        <col className="w-32" />
        <col className="w-32" />
      </colgroup>

      <TableHeader>
        <TableRow>
          <TableCell>状态</TableCell>
          <TableCell>得分</TableCell>
          <TableCell>题目</TableCell>
          <TableCell className="text-right">提交者</TableCell>
          <TableCell className="text-center">语言</TableCell>
          <TableCell className="text-center">代码长度</TableCell>
          <TableCell className="text-center">用时</TableCell>
          <TableCell className="text-center">内存</TableCell>
          <TableCell className="text-center">提交时间</TableCell>
          <TableCell className="text-right">评测时间</TableCell>
        </TableRow>
      </TableHeader>

      <TableBody>
        <TableRow>
          <TableCell>
            <div className="flex items-center gap-2">
              <ProblemStatus status={statusDoc} />
              {allowRejudge && (
                <div className="flex items-center gap-2">
                  <Button size="xs">重测</Button>
                  <Button size="xs">取消成绩</Button>
                </div>
              )}
            </div>
          </TableCell>
          <TableCell className="tabular-nums">
            <span
              style={{ color: scoreColor }}
              data-llm-text={String(rdoc.score)}
            >
              {rdoc.score}
            </span>
          </TableCell>
          <TableCell>
            <ProblemLink problem={pdoc} />
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end">
              <UserSpan user={udoc} showAvatar />
            </div>
          </TableCell>
          <TableCell className="text-center">
            {getLanguageDisplayName(rdoc.lang)}
          </TableCell>
          <TableCell className="text-center tabular-nums">
            {formatMemory(rdoc.code.length)}
          </TableCell>
          <TableCell className="text-center tabular-nums">
            {formatTime(rdoc.time)}
          </TableCell>
          <TableCell className="text-center tabular-nums">
            {formatMemory(rdoc.memory)}
          </TableCell>
          <TableCell className="text-center tabular-nums">
            {submittedAt || '-'}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {judgedAt || '-'}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
