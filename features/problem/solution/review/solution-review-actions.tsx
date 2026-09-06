'use client';

import { solutionErrorMessage } from '../solution-error';
import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import type { SolutionReviewStatus } from '@/shared/types/problem';
import { Ban, Check, RefreshCw, Star, Unlock, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type Props = {
  target:
    | { kind: 'solution'; psid: string; revision: number }
    | { kind: 'author'; uid: number }
    | null;
};

export default function SolutionReviewActions({ target }: Props) {
  const t = useTranslations('solution.review');
  const solutionT = useTranslations('solution');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [needsReload, setNeedsReload] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [error, setError] = useState('');
  const busy = submitting || refreshing;
  const disabled = busy || needsReload || completed;

  const reload = () => startTransition(() => router.refresh());
  const submit = async (status?: Exclude<SolutionReviewStatus, 1>) => {
    if (!target || disabled) return;
    setSubmitting(true);
    setError('');
    try {
      const result =
        target.kind === 'author'
          ? await ClientApis.Problem.unblockSolutionAuthor(target.uid).send()
          : status !== undefined
            ? await ClientApis.Problem.reviewProblemSolution(
                target.psid,
                target.revision,
                status
              ).send()
            : null;
      if (!result) return;
      if ('error' in result) {
        setError(
          solutionErrorMessage(result.error, (key) =>
            solutionT(`errors.${key}`)
          )
        );
        if (result.error.name === 'SolutionReviewConflictError')
          setNeedsReload(true);
        setConfirmBlock(false);
        return;
      }
      setCompleted(true);
      setConfirmBlock(false);
      reload();
    } catch (error) {
      setError(
        error instanceof Error && error.message
          ? error.message
          : t('actionFailed')
      );
      setConfirmBlock(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3" data-llm-visible="true" aria-busy={busy}>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {target?.kind === 'solution' && (
        <div className="flex flex-col gap-2">
          <Button disabled={disabled} onClick={() => submit(3)}>
            <Star />
            {t('feature')}
          </Button>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => submit(2)}
          >
            <Check />
            {t('approve')}
          </Button>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => submit(0)}
          >
            <X />
            {t('reject')}
          </Button>
          <Popover open={confirmBlock} onOpenChange={setConfirmBlock}>
            <PopoverTrigger asChild>
              <Button variant="destructive" disabled={disabled}>
                <Ban />
                {t('block')}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="max-w-[calc(100vw-2rem)]">
              <PopoverHeader>
                <PopoverTitle>{t('blockConfirm')}</PopoverTitle>
              </PopoverHeader>
              <p className="text-sm text-muted-foreground">
                {t('blockConsequences')}
              </p>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setConfirmBlock(false)}
                >
                  {solutionT('cancel')}
                </Button>
                <Button
                  variant="destructive"
                  disabled={disabled}
                  onClick={() => submit(-1)}
                >
                  <Ban />
                  {t('confirmBlock')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      {target?.kind === 'author' && (
        <Button className="w-full" disabled={disabled} onClick={() => submit()}>
          <Unlock />
          {t('unblock')}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        disabled={busy}
        onClick={reload}
        aria-label={t('reload')}
        title={t('reload')}
      >
        <RefreshCw className={refreshing ? 'animate-spin' : undefined} />
      </Button>
    </div>
  );
}
