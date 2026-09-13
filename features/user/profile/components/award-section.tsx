import type { UserProfileProps } from './shared';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function AwardSection({ data }: UserProfileProps) {
  const t = useTranslations('user');
  const records = data.awardRecords;

  if (!records.length && !data.isSelfProfile) return null;

  return (
    <section className="space-y-3" data-llm-visible="true">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-base font-medium">
          <Award className="size-4 text-muted-foreground" />
          <span data-llm-text={t('awards')}>{t('awards')}</span>
        </h2>
        {data.isSelfProfile && (
          <Button asChild size="sm" variant="outline">
            <Link href="/home/award" data-llm-text={t('awardCertification')}>
              {t('awardCertification')}
            </Link>
          </Button>
        )}
      </div>

      {!records.length ? (
        <p
          className="text-sm text-muted-foreground"
          data-llm-text={t('noCertifiedAwards')}
        >
          {t('noCertifiedAwards')}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('awardContest')}</TableHead>
                <TableHead>{t('awardLevel')}</TableHead>
                <TableHead className="text-right">{t('awardScore')}</TableHead>
                <TableHead className="text-right">{t('awardRank')}</TableHead>
                <TableHead>{t('awardSchool')}</TableHead>
                <TableHead>{t('awardProvince')}</TableHead>
                <TableHead>{t('awardGrade')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record._id}>
                  <TableCell
                    className="font-medium whitespace-nowrap"
                    data-llm-text={record.contestName}
                  >
                    {record.contestName}
                  </TableCell>
                  <TableCell
                    className="whitespace-nowrap"
                    data-llm-text={record.award}
                  >
                    {record.award}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    data-llm-text={String(record.score ?? '-')}
                  >
                    {record.score ?? '-'}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    data-llm-text={String(record.rank)}
                  >
                    {record.rank}
                  </TableCell>
                  <TableCell
                    className="whitespace-nowrap"
                    data-llm-text={record.school}
                  >
                    {record.school}
                  </TableCell>
                  <TableCell
                    className="whitespace-nowrap"
                    data-llm-text={record.province}
                  >
                    {record.province}
                  </TableCell>
                  <TableCell
                    className="whitespace-nowrap"
                    data-llm-text={record.grade}
                  >
                    {record.grade}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
