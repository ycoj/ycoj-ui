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
      <h2 className="inline-flex items-center gap-2 text-base font-medium">
        <Award className="size-4 text-muted-foreground" />
        <span data-llm-text={t('awards')}>{t('awards')}</span>
      </h2>

      {!records.length ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
          <p
            className="text-sm text-muted-foreground"
            data-llm-text={t('noCertifiedAwards')}
          >
            {t('noCertifiedAwards')}
          </p>
          <Button asChild size="sm">
            <Link href="/home/award" data-llm-text={t('awardCertification')}>
              {t('awardCertification')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('awardContest')}</TableHead>
                <TableHead>{t('award')}</TableHead>
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
                  <TableCell className="font-medium whitespace-nowrap">
                    {record.contestName}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {record.award}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {record.score ?? '-'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {record.rank}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {record.school}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {record.province}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
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
