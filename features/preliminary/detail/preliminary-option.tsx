'use client';

import { usePreliminaryAnswers } from '@/features/preliminary/detail/preliminary-answer-provider';
import { cn } from '@/shared/lib/utils';
import { useId, type ReactNode } from 'react';

type Props = {
  questionId: string;
  value: string;
  disabled?: boolean;
  children: ReactNode;
};

export default function PreliminaryOption({
  questionId,
  value,
  disabled,
  children,
}: Props) {
  const { answers, setAnswer, isReady, isReadOnly } = usePreliminaryAnswers();
  const uid = useId();
  const inputId = `${uid}-${questionId}-${value}`;
  const checked = answers[questionId] === value;
  const inputDisabled = disabled || !isReady || isReadOnly;

  return (
    <label
      htmlFor={inputId}
      data-question-id={questionId}
      data-option-value={value}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent/50 has-[input:checked]:border-primary has-[input:checked]:bg-accent',
        inputDisabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <input
        id={inputId}
        type="radio"
        name={`preliminary-${questionId}`}
        value={value}
        checked={checked}
        onChange={(event) => {
          if (event.target.checked) setAnswer(questionId, value);
        }}
        disabled={inputDisabled}
        className="mt-0.5 size-4 shrink-0 accent-primary"
      />
      <span className="min-w-0 flex-1 text-sm">{children}</span>
    </label>
  );
}
