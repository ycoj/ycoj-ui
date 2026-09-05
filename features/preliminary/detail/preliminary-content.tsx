import type { PreliminaryDetailData } from '@/api/server/method/preliminary/detail';
import PreliminaryOption from '@/features/preliminary/detail/preliminary-option';
import PreliminaryOptionText from '@/features/preliminary/detail/preliminary-option-text';
import PreliminarySectionShell from '@/features/preliminary/detail/preliminary-section-shell';
import {
  getAlphabeticId,
  getPreliminaryQuestionAnchorId,
  getQuestionDisplayNumber,
} from '@/features/preliminary/lib/preliminary-utils';
import Markdown from '@/shared/components/markdown';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { useTranslations } from 'next-intl';

type Props = {
  data: PreliminaryDetailData;
  isReadOnly: boolean;
};

export default function PreliminaryContent({ data, isReadOnly }: Props) {
  const t = useTranslations('preliminary');
  const paper = data.paper;
  const description = paper.content?.trim();
  const sectionStarts = paper.sections.map((_, sectionIndex) =>
    paper.sections
      .slice(0, sectionIndex)
      .reduce((count, prior) => count + prior.questions.length, 0)
  );

  return (
    <div className="space-y-4" data-llm-visible="true">
      <Card>
        <CardHeader className="px-4 md:px-6">
          <div className="flex items-start justify-between gap-3">
            <CardTitle
              className="text-lg md:text-xl"
              data-llm-text={paper.title}
            >
              {paper.title}
            </CardTitle>
            {!paper.published && (
              <Badge variant="secondary" className="shrink-0">
                <span data-llm-text={t('draft')}>{t('draft')}</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        {description && (
          <CardContent className="px-4 md:px-6">
            <Markdown>{description}</Markdown>
          </CardContent>
        )}
      </Card>

      {paper.sections.map((section, sectionIndex) => (
        <PreliminarySectionShell
          key={section.id}
          title={section.title}
          content={section.content}
        >
          {section.questions.map((question, index) => {
            const displayNumber = getQuestionDisplayNumber(
              question,
              (sectionStarts[sectionIndex] ?? 0) + index
            );
            return (
              <li
                key={question.id}
                id={getPreliminaryQuestionAnchorId(question.id)}
                data-question-id={question.id}
                tabIndex={-1}
                className="min-w-0 space-y-3 scroll-mt-20 rounded-md focus-visible:outline-2 focus-visible:outline-primary md:space-y-2"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-medium tabular-nums"
                    data-llm-text={String(displayNumber)}
                  >
                    {displayNumber}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t('totalScore', { count: question.score })}
                  </span>
                </div>
                <Markdown>{question.prompt}</Markdown>
                <fieldset
                  disabled={isReadOnly}
                  aria-label={String(displayNumber)}
                >
                  <div className="space-y-2">
                    {question.type === 'true_false' ? (
                      <>
                        <PreliminaryOption
                          questionId={question.id}
                          value="true"
                          disabled={isReadOnly}
                        >
                          <span className="mr-2 font-medium">
                            {getAlphabeticId(0)}.
                          </span>
                          {t('trueLabel')}
                        </PreliminaryOption>
                        <PreliminaryOption
                          questionId={question.id}
                          value="false"
                          disabled={isReadOnly}
                        >
                          <span className="mr-2 font-medium">
                            {getAlphabeticId(1)}.
                          </span>
                          {t('falseLabel')}
                        </PreliminaryOption>
                      </>
                    ) : (
                      (question.options ?? []).map((option, optionIndex) => (
                        <PreliminaryOption
                          key={option.id}
                          questionId={question.id}
                          value={option.id}
                          disabled={isReadOnly}
                        >
                          <PreliminaryOptionText
                            index={optionIndex}
                            text={option.text}
                          />
                        </PreliminaryOption>
                      ))
                    )}
                  </div>
                </fieldset>
              </li>
            );
          })}
        </PreliminarySectionShell>
      ))}
    </div>
  );
}
