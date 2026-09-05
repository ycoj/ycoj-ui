import type { PreliminaryReviewQuestion } from '@/api/server/method/preliminary/attempt';
import PreliminaryOptionText from '@/features/preliminary/detail/preliminary-option-text';
import { getAlphabeticId } from '@/features/preliminary/lib/preliminary-utils';
import type { PreliminaryQuestion } from '@/shared/types/preliminary';
import type { ReactNode } from 'react';

export type PreliminaryOptionInfo =
  | { kind: 'boolean'; value: 'true' | 'false'; index: number }
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
    return [
      { kind: 'boolean', value: 'true', index: 0 },
      { kind: 'boolean', value: 'false', index: 1 },
    ];
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
    return <PreliminaryOptionText index={info.index} text={info.text} />;
  }
  return (
    <>
      <span className="mr-2 font-medium">{getAlphabeticId(info.index)}.</span>
      {info.value === 'true' ? trueLabel : falseLabel}
    </>
  );
}
