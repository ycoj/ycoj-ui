import type { PreliminaryDetailData } from '@/api/server/method/preliminary/detail';
import PreliminaryOption from '@/features/preliminary/detail/preliminary-option';
import PreliminaryOptionContent, {
  getPreliminaryOptionInfos,
} from '@/features/preliminary/detail/preliminary-option-content';
import PreliminarySectionShell from '@/features/preliminary/detail/preliminary-section-shell';
import {
  getPreliminaryQuestionAnchorId,
  getPreliminarySectionStarts,
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
  const sectionsWithStarts = getPreliminarySectionStarts(paper.sections);

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

      {sectionsWithStarts.map(({ section, start }) => (
        <PreliminarySectionShell
          key={section.id}
          title={section.title}
          content={section.content}
        >
          {section.questions.map((question, questionIndex) => {
            const displayNumber = getQuestionDisplayNumber(
              question,
              start + questionIndex
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
                    {getPreliminaryOptionInfos(question).map((info) => (
                      <PreliminaryOption
                        key={info.value}
                        questionId={question.id}
                        value={info.value}
                        disabled={isReadOnly}
                      >
                        <PreliminaryOptionContent
                          info={info}
                          trueLabel={t('trueLabel')}
                          falseLabel={t('falseLabel')}
                        />
                      </PreliminaryOption>
                    ))}
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
