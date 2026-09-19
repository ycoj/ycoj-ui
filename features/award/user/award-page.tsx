'use client';

import AwardRecords from './award-records';
import ClientApis from '@/api/client/method';
import Pagination from '@/shared/components/pagination';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import type { AwardPageData } from '@/shared/types/award';
import { Award, LoaderCircle, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AwardPage({ data }: { data: AwardPageData }) {
  const t = useTranslations('award');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState<number | null>(null);
  const bind = async (id: number) => {
    setSubmitting(id);
    try {
      await ClientApis.Award.bindAward(id).send();
      toast.success(t('bound'));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('failed'));
    } finally {
      setSubmitting(null);
    }
  };
  if (!data.verified)
    return (
      <Alert variant="destructive">
        <ShieldAlert />
        <AlertTitle>{t('title')}</AlertTitle>
        <AlertDescription>
          {t('requiresRealname')}{' '}
          <Link className="underline" href="/home/realname">
            {t('realname')}
          </Link>
        </AlertDescription>
      </Alert>
    );
  if (data.bound)
    return (
      <div className="space-y-4">
        <header>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Award className="size-5" />
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('boundDescription')}
          </p>
        </header>
        <div className="rounded-lg border">
          <div className="p-4 text-sm">
            {t('level')}: <strong>{data.bound.ccfLevel}</strong> ·{' '}
            {t('schools')}: {data.bound.schools.join(' / ')} ·{' '}
            {t('latestSchool')}: {data.bound.latestSchool}
          </div>
          <AwardRecords records={data.records} />
        </div>
      </div>
    );
  const contestants = data.oiers ?? [];
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Award className="size-5" />
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('matching', {
            name: data.realName ?? '',
            school: data.school || t('yourSchool'),
          })}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={data.showingOthers ?? false}
            onCheckedChange={(checked) => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete('page');
              if (checked === true) params.set('others', '1');
              else params.delete('others');
              router.push(`${pathname}?${params.toString()}`);
            }}
          />
          {t('showOthers')}
        </label>
      </header>
      <div className="rounded-lg border overflow-x-auto">
        {contestants.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('latestSchool')}</TableHead>
                <TableHead>{t('schools')}</TableHead>
                <TableHead>{t('level')}</TableHead>
                <TableHead>{t('awards')}</TableHead>
                <TableHead>{t('contests')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contestants.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.latestSchool}</TableCell>
                  <TableCell>{row.schools.join(' / ')}</TableCell>
                  <TableCell>{row.ccfLevel}</TableCell>
                  <TableCell>{row.recordCount}</TableCell>
                  <TableCell>
                    {(data.previews?.[row._id] ?? [])
                      .slice(0, 3)
                      .map((record) => `${record.contestName} ${record.award}`)
                      .join(' · ') || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.uid ? (
                      <span className="text-sm text-muted-foreground">
                        {t('alreadyCertified')}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        disabled={submitting !== null}
                        onClick={() => bind(row._id)}
                      >
                        {submitting === row._id && (
                          <LoaderCircle className="animate-spin" />
                        )}
                        {t('bind')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">{t('noMatches')}</p>
        )}
      </div>
      <Pagination page={data.page} totalPages={data.numPages} />
    </div>
  );
}
