'use client';

import ClientApis from '@/api/client/method';
import { clearDraft } from '@/features/preliminary/detail/draft-storage';
import { usePreliminaryAnswers } from '@/features/preliminary/detail/preliminary-answer-provider';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Eraser, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  paperId: string;
  revision: number;
  draftId: string;
  canSubmit: boolean;
};

export default function PreliminarySubmitBar({
  paperId,
  revision,
  draftId,
  canSubmit,
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

  if (!canSubmit) return null;

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
    <div className="sticky bottom-4 space-y-2">
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
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
        <Button
          onClick={handleSubmit}
          disabled={!isReady || pending}
          className="gap-2"
        >
          <Send strokeWidth={2} />
          {pending ? t('submitting') : t('submit')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void handleClear()}
          disabled={!isReady || pending}
          className="gap-2"
        >
          <Eraser strokeWidth={2} />
          {t('clearAnswers')}
        </Button>
        <span
          className="ml-auto text-xs text-muted-foreground tabular-nums"
          data-llm-text={`${answeredCount}/${totalCount}`}
        >
          {t('answered', { answered: answeredCount, total: totalCount })}
        </span>
      </div>
    </div>
  );
}
