'use client';

import { usePreliminaryAnswers } from '@/features/preliminary/detail/preliminary-answer-provider';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

type Props = {
  questionId: string;
  defaultLanguage?: string;
  isReadOnly: boolean;
  languagePlaceholder: string;
  codePlaceholder: string;
};

export default function PreliminaryProgrammingAnswer({
  questionId,
  defaultLanguage,
  isReadOnly,
  languagePlaceholder,
  codePlaceholder,
}: Props) {
  const { programmingAnswers, setProgrammingAnswer } = usePreliminaryAnswers();
  const answer = programmingAnswers[questionId];

  return (
    <div className="space-y-2">
      <Input
        value={answer?.lang ?? ''}
        onChange={(event) =>
          setProgrammingAnswer(questionId, {
            lang: event.target.value,
            code: answer?.code ?? '',
          })
        }
        disabled={isReadOnly}
        placeholder={languagePlaceholder}
      />
      <Textarea
        value={answer?.code ?? ''}
        onChange={(event) =>
          setProgrammingAnswer(questionId, {
            lang: answer?.lang ?? defaultLanguage ?? '',
            code: event.target.value,
          })
        }
        disabled={isReadOnly}
        rows={12}
        className="font-mono"
        placeholder={codePlaceholder}
      />
    </div>
  );
}
