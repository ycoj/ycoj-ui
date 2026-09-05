'use client';

import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  tid: string;
  sid: string;
};

export default function ContestSolutionDeleteButton({ tid, sid }: Props) {
  const t = useTranslations('contestSolution');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const result = await ClientApis.Contest.deleteContestSolution(tid, sid);
      if ('error' in result) {
        setError(result.error.message);
        return;
      }
      setOpen(false);
      router.push(`/contest/${tid}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('deleteFailed');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="icon-xs"
          aria-label={t('delete')}
          title={t('delete')}
        >
          <Trash2 strokeWidth={2} />
          <span className="sr-only" data-llm-text={t('delete')}>
            {t('delete')}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" data-llm-visible="true">
        <PopoverHeader>
          <PopoverTitle data-llm-text={t('confirmDelete')}>
            {t('confirmDelete')}
          </PopoverTitle>
        </PopoverHeader>
        {error && (
          <p
            role="alert"
            className="text-destructive text-xs"
            data-llm-text={error}
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            <span data-llm-text={t('cancel')}>{t('cancel')}</span>
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="xs"
            onClick={handleDelete}
            disabled={submitting}
          >
            <span data-llm-text={submitting ? t('deleting') : t('confirm')}>
              {submitting ? t('deleting') : t('confirm')}
            </span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
