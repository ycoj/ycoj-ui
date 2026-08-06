'use client';

import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Separator } from '@/shared/components/ui/separator';
import dayjs from 'dayjs';
import { Ban, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

const LATEST_VALUE = 'latest';

type Props = {
  allRevs: Record<string, string>;
  selectedRev?: string;
  allowRejudge: boolean;
  onRejudge: () => Promise<void>;
  onCancel: () => Promise<void>;
};

export default function RecordSidebar({
  allRevs,
  selectedRev,
  allowRejudge,
  onRejudge,
  onCancel,
}: Props) {
  const t = useTranslations('record');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState('');

  const isHistorical = !!selectedRev;
  const showActions = allowRejudge && !isHistorical;

  const versions = useMemo(
    () =>
      Object.entries(allRevs ?? {})
        .map(([rev, judgedAt]) => ({ rev, judgedAt }))
        .sort(
          (a, b) => dayjs(b.judgedAt).valueOf() - dayjs(a.judgedAt).valueOf()
        ),
    [allRevs]
  );

  const runAction = async (action: () => Promise<void>) => {
    if (pending) return;
    setPending(true);
    setActionError('');
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setPending(false);
    }
  };

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === LATEST_VALUE) {
      params.delete('rev');
    } else {
      params.set('rev', value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="w-full space-y-4" data-llm-visible="true">
      {showActions && (
        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full cursor-pointer justify-start gap-3 px-4"
            disabled={pending}
            onClick={() => runAction(onRejudge)}
          >
            <RotateCcw strokeWidth={2} />
            <span data-llm-text={t('rejudge')}>{t('rejudge')}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full cursor-pointer justify-start gap-3 px-4"
            disabled={pending}
            onClick={() => runAction(onCancel)}
          >
            <Ban strokeWidth={2} />
            <span data-llm-text={t('cancelResult')}>{t('cancelResult')}</span>
          </Button>
          {actionError && (
            <p className="text-destructive text-xs" data-llm-text={actionError}>
              {actionError}
            </p>
          )}
        </div>
      )}

      {showActions && versions.length > 0 && <Separator />}

      {versions.length > 0 && (
        <div className="space-y-2">
          <p
            className="text-muted-foreground px-1 text-sm"
            data-llm-text={t('judgeVersion')}
          >
            {t('judgeVersion')}
          </p>
          <Select
            value={selectedRev ?? LATEST_VALUE}
            onValueChange={handleSelect}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LATEST_VALUE}>{t('latestVersion')}</SelectItem>
              <SelectGroup>
                <SelectLabel>{t('historicalVersion')}</SelectLabel>
                {versions.map(({ rev, judgedAt }) => {
                  const time = dayjs(judgedAt).isValid()
                    ? dayjs(judgedAt).format('MM-DD HH:mm:ss')
                    : '-';
                  return (
                    <SelectItem key={rev} value={rev}>
                      {t('judgedAt', { time })}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
