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
import type {
  ProblemDoc,
  ProblemStatus as ProblemStatusDoc,
} from '@/shared/types/problem';
import type { RecordDoc } from '@/shared/types/record';
import type { User } from '@/shared/types/user';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

type Props = {
  rdoc: RecordDoc;
  pdoc: ProblemDoc;
  udoc: User;
  languages: Record<string, LanguageFamily>;
};

export default function RecordDetail({ rdoc, pdoc, udoc, languages }: Props) {
  const t = useTranslations('record');
  const common = useTranslations('common');
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
        <col className="w-20 md:w-32" />
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
          <TableCell>{common('status')}</TableCell>
          <TableCell>{common('score')}</TableCell>
          <TableCell>{common('problem')}</TableCell>
          <TableCell className="text-right">{common('submitter')}</TableCell>
          <TableCell className="text-center">
            {common('languageLabel')}
          </TableCell>
          <TableCell className="text-center">{t('codeLength')}</TableCell>
          <TableCell className="text-center">{common('time')}</TableCell>
          <TableCell className="text-center">{common('memory')}</TableCell>
          <TableCell className="text-center">{common('submitTime')}</TableCell>
          <TableCell className="text-right">{common('judgeTime')}</TableCell>
        </TableRow>
      </TableHeader>

      <TableBody>
        <TableRow>
          <TableCell>
            <ProblemStatus status={statusDoc} progress={rdoc.progress} />
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
            {rdoc.code ? formatMemory(rdoc.code.length) : '-'}
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
