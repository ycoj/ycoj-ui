'use client';

import { useObjective } from '@/features/problem/objective/provider';
import ConfirmActionDialog from '@/shared/components/confirm-action-dialog';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

function escapeId(id: string) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(id);
  return id.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

function scrollToQuestion(id: string) {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(
      `[data-objective-id="${escapeId(id)}"]`
    )
  );
  const target = nodes.find((el) => el.offsetParent !== null) ?? nodes[0];
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusable = target.querySelector<HTMLElement>(
    'input:not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex="-1"]):not(:disabled)'
  );
  if (focusable) {
    // Wait for the smooth scroll to settle before moving focus
    const FOCUS_DELAY_MS = 300;
    setTimeout(() => focusable.focus(), FOCUS_DELAY_MS);
  } else {
    if (target.tabIndex < 0) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }
}

export default function ObjectiveNavigation() {
  const t = useTranslations('problem.objectiveForm');
  const tCommon = useTranslations('common');
  const {
    questionIds,
    isCompleted,
    clearAnswers,
    isReady,
    isReadOnly,
    draftError,
  } = useObjective();

  if (!isReady) return null;
  if (questionIds.length === 0) {
    return (
      <div className="space-y-4" data-llm-visible="true">
        {draftError && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {t('draftError')}
          </div>
        )}
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {t('configWarning')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-llm-visible="true">
      {draftError && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {t('draftError')}
        </div>
      )}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {questionIds.map((id) => {
          const completed = isCompleted(id);
          return (
            <Button
              key={id}
              variant={completed ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-8 px-2 text-xs',
                completed && 'bg-green-600 hover:bg-green-700'
              )}
              onClick={() => scrollToQuestion(id)}
              aria-label={t('question', { id })}
              title={completed ? t('answered') : t('unanswered')}
            >
              {id}
            </Button>
          );
        })}
      </div>
      {!isReadOnly && (
        <ConfirmActionDialog
          title={t('clearAnswers')}
          description={t('clearConfirm')}
          confirmLabel={t('clearAnswers')}
          cancelLabel={tCommon('cancel')}
          fallbackError={t('draftError')}
          onConfirm={clearAnswers}
          trigger={(pending) => (
            <Button
              variant="ghost"
              className="h-10 w-full justify-start gap-3 px-4"
              disabled={pending}
            >
              <Trash2 strokeWidth={2} />
              {t('clearAnswers')}
            </Button>
          )}
        />
      )}
    </div>
  );
}
