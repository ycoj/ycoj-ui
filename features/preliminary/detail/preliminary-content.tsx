import type { PreliminaryDetailData } from '@/api/server/method/preliminary/detail';
import PreliminaryOption from '@/features/preliminary/detail/preliminary-option';
import PreliminaryOptionContent, {
  getPreliminaryOptionInfos,
} from '@/features/preliminary/detail/preliminary-option-content';
import PreliminaryProgrammingQuestion from '@/features/preliminary/detail/preliminary-programming-question';
import PreliminarySectionShell from '@/features/preliminary/detail/preliminary-section-shell';
import {
  getPreliminaryQuestionAnchorId,
  getPreliminarySectionStarts,
  getQuestionDisplayNumber,
} from '@/features/preliminary/lib/preliminary-utils';
import PreliminaryMarkdown from '@/features/preliminary/markdown/preliminary-markdown';
import ProblemContent from '@/features/problem/detail/problem-content';
import type { ScratchpadLanguages } from '@/features/problem/scratchpad/scratchpad-types';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import type { User } from '@/shared/types/user';
import { useTranslations } from 'next-intl';

type Props = {
  data: PreliminaryDetailData;
  isReadOnly: boolean;
  programmingLanguages: Record<number, ScratchpadLanguages>;
  user: User | null;
};

export default function PreliminaryContent({
  data,
  isReadOnly,
  programmingLanguages,
  user,
}: Props) {
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
            <PreliminaryMarkdown>{description}</PreliminaryMarkdown>
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
                <PreliminaryMarkdown>{question.prompt}</PreliminaryMarkdown>
                {question.type === 'programming' ? (
                  data.pdict[question.pid ?? 0] ? (
                    <PreliminaryProgrammingQuestion
                      question={question}
                      problem={data.pdict[question.pid ?? 0]}
                      statement={
                        <ProblemContent
                          problem={data.pdict[question.pid ?? 0]}
                        />
                      }
                      languages={programmingLanguages[question.pid ?? 0] ?? {}}
                      user={user}
                      isReadOnly={isReadOnly}
                    />
                  ) : (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                      {t('programmingUnavailable')}
                    </div>
                  )
                ) : (
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
                )}
              </li>
            );
          })}
        </PreliminarySectionShell>
      ))}
    </div>
  );
}
