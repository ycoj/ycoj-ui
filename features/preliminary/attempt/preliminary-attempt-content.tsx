import type {
  PreliminaryAttemptData,
  PreliminaryReviewQuestion,
} from '@/api/server/method/preliminary/attempt';
import PreliminaryOptionText from '@/features/preliminary/detail/preliminary-option-text';
import PreliminarySectionShell from '@/features/preliminary/detail/preliminary-section-shell';
import { getAlphabeticId } from '@/features/preliminary/lib/preliminary-utils';
import Markdown from '@/shared/components/markdown';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';
import { Check, X } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

function ReviewOption({
  selected,
  correct,
  children,
}: {
  selected: boolean;
  correct: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md border p-3 text-sm',
        correct &&
          'border-green-500/50 bg-green-50 dark:border-green-500/40 dark:bg-green-500/10',
        selected &&
          !correct &&
          'border-red-500/50 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10'
      )}
    >
      <span className="mt-0.5 flex shrink-0 items-center">
        {correct ? (
          <Check className="size-4 text-green-600 dark:text-green-400" />
        ) : selected ? (
          <X className="size-4 text-red-600 dark:text-red-400" />
        ) : (
          <span className="size-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

function ReviewQuestion({ question }: { question: PreliminaryReviewQuestion }) {
  const t = useTranslations('preliminary');
  const correct = question.result.correct;

  return (
    <li className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="font-medium tabular-nums"
          data-llm-text={String(question.questionNumber ?? '')}
        >
          {question.questionNumber}
        </span>
        <Badge
          variant="secondary"
          className={cn(
            correct
              ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
          )}
        >
          <span data-llm-text={correct ? t('correct') : t('incorrect')}>
            {correct ? t('correct') : t('incorrect')}
          </span>
        </Badge>
        <span className="text-xs text-muted-foreground tabular-nums">
          {question.result.score} / {question.result.maxScore}
        </span>
      </div>
      <Markdown>{question.prompt}</Markdown>
      <div className="space-y-2">
        {question.type === 'true_false' ? (
          <>
            <ReviewOption
              selected={question.result.answer === 'true'}
              correct={question.correctAnswer === 'true'}
            >
              <span className="mr-2 font-medium">{getAlphabeticId(0)}.</span>
              {t('trueLabel')}
            </ReviewOption>
            <ReviewOption
              selected={question.result.answer === 'false'}
              correct={question.correctAnswer === 'false'}
            >
              <span className="mr-2 font-medium">{getAlphabeticId(1)}.</span>
              {t('falseLabel')}
            </ReviewOption>
          </>
        ) : (
          (question.options ?? []).map((option, index) => (
            <ReviewOption
              key={option.id}
              selected={question.result.answer === option.id}
              correct={question.correctAnswer === option.id}
            >
              <PreliminaryOptionText index={index} text={option.text} />
            </ReviewOption>
          ))
        )}
      </div>
      {!correct && question.explanation?.trim() && (
        <div className="rounded-md border bg-muted/40 p-3">
          <h4
            className="mb-1 text-sm font-medium"
            data-llm-text={t('explanation')}
          >
            {t('explanation')}
          </h4>
          <Markdown>{question.explanation}</Markdown>
        </div>
      )}
    </li>
  );
}

type Props = {
  data: PreliminaryAttemptData;
};

export default function PreliminaryAttemptContent({ data }: Props) {
  const t = useTranslations('preliminary');
  const format = useFormatter();
  const { attempt, paper } = data;
  const description = paper.content?.trim();

  return (
    <div className="space-y-4" data-llm-visible="true">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl" data-llm-text={paper.title}>
            {paper.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div
            className="text-2xl font-semibold tabular-nums"
            data-llm-text={`${attempt.score}/${attempt.totalScore}`}
          >
            {attempt.score} / {attempt.totalScore}
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {t('revision')} {attempt.revision} ·{' '}
            {format.dateTime(new Date(attempt.submittedAt), {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
          {description && <Markdown>{description}</Markdown>}
        </CardContent>
      </Card>

      {paper.sections.map((section) => (
        <PreliminarySectionShell
          key={section.id}
          title={section.title}
          content={section.content}
        >
          {section.questions.map((question) => (
            <ReviewQuestion key={question.id} question={question} />
          ))}
        </PreliminarySectionShell>
      ))}
    </div>
  );
}
