import type { PreliminaryReviewQuestion } from '@/api/server/method/preliminary/attempt';
import { getAlphabeticId } from '@/features/preliminary/lib/preliminary-utils';
import Markdown from '@/shared/components/markdown';
import {
  PRELIMINARY_TRUE_FALSE_VALUES,
  type PreliminaryQuestion,
  type PreliminaryTrueFalseValue,
} from '@/shared/types/preliminary';
import type { ReactNode } from 'react';

export type PreliminaryOptionInfo =
  | { kind: 'boolean'; value: PreliminaryTrueFalseValue; index: number }
  | { kind: 'choice'; value: string; index: number; text: string };

type PreliminaryOptionSource =
  | Pick<PreliminaryQuestion, 'type' | 'options'>
  | Pick<PreliminaryReviewQuestion, 'type' | 'options'>;

// Normalizes true/false and choice questions into a single option list so
// detail and review views share one renderer instead of duplicating the
// true_false branch.
export function getPreliminaryOptionInfos(
  question: PreliminaryOptionSource
): PreliminaryOptionInfo[] {
  if (question.type === 'true_false') {
    return PRELIMINARY_TRUE_FALSE_VALUES.map(
      (value, index): PreliminaryOptionInfo => ({
        kind: 'boolean',
        value,
        index,
      })
    );
  }
  return (question.options ?? []).map(
    (option, index): PreliminaryOptionInfo => ({
      kind: 'choice',
      value: option.id,
      index,
      text: option.text,
    })
  );
}

type Props = {
  info: PreliminaryOptionInfo;
  trueLabel: string;
  falseLabel: string;
};

export default function PreliminaryOptionContent({
  info,
  trueLabel,
  falseLabel,
}: Props): ReactNode {
  if (info.kind === 'choice') {
    return (
      <div className="flex items-baseline gap-2">
        <span className="shrink-0 font-medium">
          {getAlphabeticId(info.index)}.
        </span>
        <div className="min-w-0 flex-1 [&_.markdown>:nth-last-child(2)]:mb-0!">
          <Markdown>{info.text}</Markdown>
        </div>
      </div>
    );
  }
  return (
    <>
      <span className="mr-2 font-medium">{getAlphabeticId(info.index)}.</span>
      {info.value === 'true' ? trueLabel : falseLabel}
    </>
  );
}
