'use client';

import ClientApis from '@/api/client/method';
import { clearDraft } from '@/features/preliminary/detail/draft-storage';
import { usePreliminaryAnswers } from '@/features/preliminary/detail/preliminary-answer-provider';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Eraser, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  paperId: string;
  revision: number;
  draftId: string;
  canSubmit: boolean;
  navigation?: ReactNode;
};

export default function PreliminarySubmitBar({
  paperId,
  revision,
  draftId,
  canSubmit,
  navigation,
}: Props) {
  const t = useTranslations('preliminary');
  const router = useRouter();
  const {
    answers,
    answeredCount,
    totalCount,
    clearAnswers,
    isReady,
    draftError,
  } = usePreliminaryAnswers();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const barRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState(112);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const observer = new ResizeObserver(() => {
      setBarHeight(bar.getBoundingClientRect().height);
    });
    observer.observe(bar);
    return () => observer.disconnect();
  }, [canSubmit, navigation]);

  if (!canSubmit && !navigation) return null;

  const handleClear = async () => {
    if (!window.confirm(t('clearConfirm'))) return;
    await clearAnswers();
  };

  const handleSubmit = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await ClientApis.Preliminary.submitPreliminary(
        paperId,
        revision,
        answers
      ).send();
      if (!response || 'error' in response) {
        setError(t('submitFailed'));
        return;
      }
      if (response?.url) {
        try {
          // Best-effort bypass of the provider on purpose: a successful
          // submit navigates away, so clearing in-memory answers state would
          // only add a render (and a saveDraft({}) round-trip) before
          // unmount. Dropping the stored draft is enough to prevent a stale
          // resume; failures are ignored because the attempt was recorded.
          await clearDraft(draftId);
        } catch {
          // Draft cleanup is best-effort; the attempt was recorded.
        }
        router.push(response.url);
        return;
      }
      setError(t('submitFailed'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('submitFailed'));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="md:hidden"
        style={{ height: barHeight }}
      />
      <div
        ref={barRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 space-y-2 border-t bg-background px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:sticky md:inset-x-auto md:bottom-4 md:border-0 md:bg-transparent md:p-0',
          !canSubmit && 'md:hidden'
        )}
      >
        {isReady && draftError && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {t('draftError')}
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 md:rounded-xl md:border md:bg-card/95 md:p-3 md:shadow-lg md:backdrop-blur">
          {navigation}
          {canSubmit && (
            <>
              <Button
                onClick={handleSubmit}
                disabled={!isReady || pending}
                className="h-11 flex-1 gap-2 md:h-9 md:flex-none"
              >
                <Send strokeWidth={2} />
                {pending ? t('submitting') : t('submit')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleClear()}
                disabled={!isReady || pending}
                className="size-11 shrink-0 gap-2 p-0 md:h-9 md:w-auto md:px-3"
                aria-label={t('clearAnswers')}
                title={t('clearAnswers')}
              >
                <Eraser strokeWidth={2} />
                <span className="hidden md:inline">{t('clearAnswers')}</span>
              </Button>
            </>
          )}
          <span
            className="order-first w-full text-xs text-muted-foreground tabular-nums md:order-last md:ml-auto md:w-auto"
            data-llm-text={`${answeredCount}/${totalCount}`}
          >
            {t('answered', { answered: answeredCount, total: totalCount })}
          </span>
        </div>
      </div>
    </>
  );
}
