'use client';

import { usePreliminaryAnswers } from '@/features/preliminary/detail/preliminary-answer-provider';
import {
  getPreliminaryQuestionAnchorId,
  type PreliminaryNavQuestion,
} from '@/features/preliminary/lib/preliminary-utils';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

type Props = {
  questions: PreliminaryNavQuestion[];
  onSelectQuestion?: (questionId: string) => void;
};

export default function PreliminaryQuestionNav({
  questions,
  onSelectQuestion,
}: Props) {
  const { isAnswered, isReady } = usePreliminaryAnswers();

  if (questions.length === 0) return null;

  return (
    <div className="grid grid-cols-5 gap-2" data-llm-visible="true">
      {questions.map((question) => {
        // Render the grid before the draft is ready; only the answered
        // styling lags until answers load.
        const answered = isReady && isAnswered(question.id);
        return (
          <Button
            key={question.id}
            asChild
            variant={answered ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-11 px-2 text-sm tabular-nums md:h-8 md:text-xs',
              answered && 'bg-green-600 hover:bg-green-700'
            )}
          >
            <a
              href={`#${getPreliminaryQuestionAnchorId(question.id)}`}
              aria-label={String(question.number)}
              onClick={(event) => {
                if (!onSelectQuestion) return;
                event.preventDefault();
                onSelectQuestion(question.id);
              }}
            >
              {question.number}
            </a>
          </Button>
        );
      })}
    </div>
  );
}
