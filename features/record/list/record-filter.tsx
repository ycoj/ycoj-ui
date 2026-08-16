'use client';

import ProblemAutoComplete from '@/features/problem/problem-auto-complete';
import UserAutoComplete from '@/features/user/user-auto-complete';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { STATUS_TEXT_KEYS } from '@/shared/configs/status';
import { Activity, Code2, Search, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

type Props = {
  domainId: string;
};

type FormValues = {
  uidOrName: string;
  pid: string;
  status: string;
};

const buildStatusOptions = () =>
  Object.entries(STATUS_TEXT_KEYS)
    .map(([value, key]) => ({
      value,
      key,
    }))
    .sort((a, b) => Number(a.value) - Number(b.value));

export default function RecordFilter({ domainId }: Props) {
  const t = useTranslations('record');
  const common = useTranslations('common');
  const statusT = useTranslations('judgeStatus.label');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleSubmit, control } = useForm<FormValues>({
    defaultValues: {
      uidOrName: searchParams.get('uidOrName') || '',
      pid: searchParams.get('pid') || '',
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
    syncParam('status', values.status.trim());
    params.delete('page');
    router.push(`?${params.toString()}`);
  });

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-56 min-w-[200px]">
          <Controller
            control={control}
            name="uidOrName"
            render={({ field }) => (
              <UserAutoComplete
                domainId={domainId}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={t('submitterPlaceholder')}
                ariaLabel={t('submitterPlaceholder')}
                inputClassName="pl-9 text-sm"
              />
            )}
          />
          <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2" />
        </div>

        <div className="relative w-72 min-w-[240px] sm:w-80">
          <Controller
            control={control}
            name="pid"
            render={({ field }) => (
              <ProblemAutoComplete
                domainId={domainId}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={common('problemId')}
                ariaLabel={common('problemId')}
                inputClassName="pl-9 text-sm"
              />
            )}
          />
          <Code2 className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2" />
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
