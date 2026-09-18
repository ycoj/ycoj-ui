'use client';

import ClientApis from '@/api/client/method';
import UserSpan from '@/features/user/user-span';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import type { AwardManageData } from '@/shared/types/award';
import { LoaderCircle, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AwardManage({ data }: { data: AwardManageData }) {
  const t = useTranslations('award');
  const common = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<number | null>(null);
  const remove = async (uid: number) => {
    if (!window.confirm(t('confirmRemove'))) return;
    setPending(uid);
    try {
      await ClientApis.Award.unbindAward(uid).send();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('failed'));
    } finally {
      setPending(null);
    }
  };
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t('manageTitle')}</h1>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value =
              new FormData(event.currentTarget)
                .get('uname')
                ?.toString()
                .trim() ?? '';
            const params = new URLSearchParams(searchParams.toString());
            params.delete('page');
            if (value) params.set('uname', value);
            else params.delete('uname');
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          <Input
            name="uname"
            defaultValue={data.filterUname}
            placeholder={t('username')}
          />
          <Button type="submit" variant="secondary">
            <Search />
            {common('search')}
          </Button>
        </form>
      </header>
      <div className="overflow-x-auto rounded-lg border">
        {data.odocs.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('username')}</TableHead>
                <TableHead>{t('realName')}</TableHead>
                <TableHead>{t('latestSchool')}</TableHead>
                <TableHead>{t('level')}</TableHead>
                <TableHead>{t('awards')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.odocs.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>
                    {data.udict[row.uid] ? (
                      <UserSpan user={data.udict[row.uid]} />
                    ) : (
                      `UID ${row.uid}`
                    )}
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.latestSchool}</TableCell>
                  <TableCell>{row.ccfLevel}</TableCell>
                  <TableCell>{row.recordCount}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={pending !== null}
                      onClick={() => remove(row.uid)}
                    >
                      {pending === row.uid && (
                        <LoaderCircle className="animate-spin" />
                      )}
                      {t('remove')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">
            {t('noCertified')}
          </p>
        )}
      </div>
    </div>
  );
}
