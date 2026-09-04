'use client';

import { usePreliminaryAnswers } from '@/features/preliminary/detail/preliminary-answer-provider';
import { getPreliminaryQuestionAnchorId } from '@/features/preliminary/lib/preliminary-utils';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

type Props = {
  questions: Array<{ id: string; number: number }>;
};

export default function PreliminaryQuestionNav({ questions }: Props) {
  const { isAnswered, isReady } = usePreliminaryAnswers();

  if (!isReady || questions.length === 0) return null;

  return (
    <div className="grid grid-cols-5 gap-2" data-llm-visible="true">
      {questions.map((question) => {
        const answered = isAnswered(question.id);
        return (
          <Button
            key={question.id}
            asChild
            variant={answered ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-8 px-2 text-xs tabular-nums',
              answered && 'bg-green-600 hover:bg-green-700'
            )}
          >
            <a
              href={`#${getPreliminaryQuestionAnchorId(question.id)}`}
              aria-label={String(question.number)}
            >
              {question.number}
            </a>
          </Button>
        );
      })}
    </div>
  );
}
