import { getTrainingProblemCount } from '@/features/training/detail/training-detail-utils';
import { Badge } from '@/shared/components/ui/badge';
import type { TrainingDoc } from '@/shared/types/training';
import { BookOpen, Code2, Check, Users } from 'lucide-react';

type Props = {
  tdoc: TrainingDoc;
  isEnrolled?: boolean;
};

export default function TrainingTitle({ tdoc, isEnrolled }: Props) {
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
        <Badge variant="secondary" title="章节数量">
          <BookOpen data-icon="inline-start" />
          <span data-llm-text={String(sectionCount)} className="tabular-nums">
            {sectionCount} 小节
          </span>
        </Badge>

        <Badge variant="secondary" title="题目数量">
          <Code2 data-icon="inline-start" />
          <span data-llm-text={String(problemCount)} className="tabular-nums">
            {problemCount} 道题
          </span>
        </Badge>

        <Badge variant="secondary" title="参加人数">
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
            <span data-llm-text="已参加训练">已参加训练</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
