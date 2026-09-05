'use client';

import PreliminaryQuestionNav from '@/features/preliminary/detail/preliminary-question-nav';
import {
  getPreliminaryQuestionAnchorId,
  type PreliminaryNavQuestion,
} from '@/features/preliminary/lib/preliminary-utils';
import { useTranslations } from 'next-intl';

type Props = {
  questions: PreliminaryNavQuestion[];
  onSelectQuestion?: (questionId: string) => void;
};

// Shared directory block for the desktop sidebar and the mobile sheet.
export default function PreliminaryNavPanel({
  questions,
  onSelectQuestion,
}: Props) {
  const t = useTranslations('preliminary');

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium" data-llm-text={t('directory')}>
        {t('directory')}
      </h2>
      <PreliminaryQuestionNav
        questions={questions}
        onSelectQuestion={onSelectQuestion}
      />
    </div>
  );
}

// Focuses and scrolls to a question (used after the mobile sheet closes so
// focus lands on the selected question). Returns false when the target is
// missing so callers can skip focus-specific handling.
export function focusPreliminaryQuestion(questionId: string): boolean {
  const target = document.getElementById(
    getPreliminaryQuestionAnchorId(questionId)
  );
  if (!target) return false;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'start' });
  return true;
}
