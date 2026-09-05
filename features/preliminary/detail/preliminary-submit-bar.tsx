'use client';

import { usePreliminaryAnswers } from '@/features/preliminary/detail/preliminary-answer-provider';
import {
  PreliminaryRequestError,
  submitPreliminaryAnswers,
} from '@/features/preliminary/lib/preliminary-request';
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
  canSubmit: boolean;
  navigation?: ReactNode;
};

// Measures only the fixed action bar (banners stay in flow above the spacer)
// so wrapping, i18n length, and safe-area padding never overlap content.
// getBoundingClientRect includes the safe-area padding. A ResizeObserver
// covers every size change (wrapping, i18n, class toggles), so no props
// belong in the effect dependencies.
function useFixedBarHeight() {
  const barRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState(112);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (typeof ResizeObserver === 'undefined') return;
    const update = () => {
      setBarHeight(bar.getBoundingClientRect().height);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  return { barRef, barHeight };
}

export default function PreliminarySubmitBar({
  paperId,
  revision,
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
  const { barRef, barHeight } = useFixedBarHeight();

  const handleClear = async () => {
    if (!window.confirm(t('clearConfirm'))) return;
    await clearAnswers();
  };

  const handleSubmit = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const url = await submitPreliminaryAnswers(
        paperId,
        revision,
        answers,
        clearAnswers
      );
      router.push(url);
    } catch (e) {
      if (e instanceof PreliminaryRequestError) {
        setError(t('submitFailed'));
      } else {
        setError(
          e instanceof Error && e.message ? e.message : t('submitFailed')
        );
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <>
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
      <div
        aria-hidden="true"
        className="md:hidden"
        style={{ height: barHeight }}
      />
      <div
        ref={barRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:sticky md:inset-x-auto md:bottom-4 md:p-0',
          !canSubmit && 'md:hidden'
        )}
      >
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur md:gap-3">
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
