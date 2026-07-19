'use client';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { STATUS_TEXT_KEYS } from '@/shared/configs/status';
import { Activity, Award, Code2, Search, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

const buildStatusOptions = () =>
  Object.entries(STATUS_TEXT_KEYS)
    .map(([value, key]) => ({
      value,
      key,
    }))
    .sort((a, b) => Number(a.value) - Number(b.value));

export default function RecordFilter() {
  const t = useTranslations('record');
  const common = useTranslations('common');
  const statusT = useTranslations('judgeStatus.label');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      uidOrName: searchParams.get('uidOrName') || '',
      pid: searchParams.get('pid') || '',
      tid: searchParams.get('tid') || '',
      status: searchParams.get('status') || '',
    },
  });
  const statusOptions = useMemo(() => buildStatusOptions(), []);

  const onSubmit = handleSubmit((values) => {
    const params = new URLSearchParams(searchParams.toString());

    const syncParam = (key: string, value: string) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    };

    syncParam('uidOrName', values.uidOrName.trim());
    syncParam('pid', values.pid.trim());
    syncParam('tid', values.tid.trim());
    syncParam('status', values.status.trim());
    params.delete('page');
    router.push(`?${params.toString()}`);
  });

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-56 min-w-[200px]">
          <Input
            type="text"
            placeholder={t('submitterPlaceholder')}
            className="pl-9 pr-3 text-sm"
            {...register('uidOrName')}
          />
          <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="relative w-40 min-w-[160px]">
          <Input
            type="text"
            placeholder={common('problemId')}
            className="pl-9 pr-3 text-sm"
            {...register('pid')}
          />
          <Code2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="relative w-40 min-w-[160px]">
          <Input
            type="text"
            placeholder={common('contestId')}
            className="pl-9 pr-3 text-sm"
            {...register('tid')}
          />
          <Award className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              value={field.value || undefined}
              onValueChange={(value) =>
                field.onChange(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-40 min-w-[160px]">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-muted-foreground" />
                  <SelectValue placeholder={common('status')} />
                </div>
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {statusT(option.key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        <Button type="submit" variant="secondary" className="ml-auto gap-2">
          <Search strokeWidth={2} />
          {common('filter')}
        </Button>
      </div>
    </form>
  );
}
