import { getTrainingProblemCount } from '@/features/training/detail/training-detail-utils';
import { Badge } from '@/shared/components/ui/badge';
import type { TrainingDoc } from '@/shared/types/training';
import { BookOpen, Code2, Check, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  tdoc: TrainingDoc;
  isEnrolled?: boolean;
};

export default function TrainingTitle({ tdoc, isEnrolled }: Props) {
  const t = useTranslations('training');
  const common = useTranslations('common');
  const sectionCount = tdoc.dag.length;
  const problemCount = getTrainingProblemCount(tdoc.dag);

  return (
    <div
      data-llm-visible="true"
      className="space-y-3 border-b pb-4"
      data-llm-text={tdoc.title}
    >
      <h1 className="wrap-break-word text-2xl leading-snug font-medium">
        {tdoc.title}
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" title={t('sectionCount')}>
          <BookOpen data-icon="inline-start" />
          <span data-llm-text={String(sectionCount)} className="tabular-nums">
            {common('sections', { count: sectionCount })}
          </span>
        </Badge>

        <Badge variant="secondary" title={t('problemCount')}>
          <Code2 data-icon="inline-start" />
          <span data-llm-text={String(problemCount)} className="tabular-nums">
            {common('problems', { count: problemCount })}
          </span>
        </Badge>

        <Badge variant="secondary" title={t('participants')}>
          <Users data-icon="inline-start" />
          <span data-llm-text={String(tdoc.attend)} className="tabular-nums">
            {tdoc.attend}
          </span>
        </Badge>

        {isEnrolled && (
          <Badge
            variant="secondary"
            className="w-fit bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
          >
            <Check data-icon="inline-start" />
            <span data-llm-text={t('joinedTraining')}>
              {t('joinedTraining')}
            </span>
          </Badge>
        )}
      </div>
    </div>
  );
}
