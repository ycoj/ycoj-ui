'use client';

import ProblemStatus from '@/features/problem/problem-status';
import type {
  ScratchpadLanguageOption,
  ScratchpadRecord,
} from '@/features/problem/scratchpad/scratchpad-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { formatMemory, formatTime } from '@/shared/lib/format-units';
import oid2ts from '@/shared/lib/oid2ts';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = {
  records: ScratchpadRecord[];
  languages: ScratchpadLanguageOption[];
  loading: boolean;
  unavailable: boolean;
};

export default function ScratchpadRecords({
  records,
  languages,
  loading,
  unavailable,
}: Props) {
  const t = useTranslations('problem.scratchpad');
  const common = useTranslations('common');

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        {common('loading')}
      </div>
    );
  }
  if (unavailable) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        <span data-llm-text={t('recordsUnavailable')}>
          {t('recordsUnavailable')}
        </span>
      </div>
    );
  }
  if (!records.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <span data-llm-text={t('noRecords')}>{t('noRecords')}</span>
      </div>
    );
  }

  const languageName = (name: string) =>
    languages.find((language) => language.name === name)?.display ?? name;

  return (
    <div className="h-full overflow-auto">
      <Table data-llm-visible="true">
        <TableHeader>
          <TableRow>
            <TableCell>{common('status')}</TableCell>
            <TableCell>{common('score')}</TableCell>
            <TableCell>{common('time')}</TableCell>
            <TableCell>{common('memory')}</TableCell>
            <TableCell>{common('languageLabel')}</TableCell>
            <TableCell>{common('submitTime')}</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const submittedAt = oid2ts(record._id);
            return (
              <TableRow key={record._id}>
                <TableCell>
                  <ProblemStatus
                    status={{
                      _id: record._id,
                      docId: record.pid,
                      docType: 10,
                      domainId: record.domainId,
                      rid: record._id,
                      status: record.status,
                    }}
                    progress={record.progress}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/record/${record._id}`}
                    className="hover:underline"
                  >
                    {record.score}
                  </Link>
                </TableCell>
                <TableCell>{formatTime(record.time)}</TableCell>
                <TableCell>{formatMemory(record.memory)}</TableCell>
                <TableCell>{languageName(record.lang)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {Number.isFinite(submittedAt)
                    ? dayjs(submittedAt).format('MM-DD HH:mm:ss')
                    : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
