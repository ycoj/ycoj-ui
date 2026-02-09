import { ProblemTags } from './problem-tags';
import ProblemDifficulty from '@/features/problem/problem-difficulty';
import { Badge } from '@/shared/components/ui/badge';
import { formatMemory, formatTime } from '@/shared/lib/format-units';
import type { Contest } from '@/shared/types/contest';
import type { Homework } from '@/shared/types/homework';
import type { PublicProjectionProblem } from '@/shared/types/problem';
import {
  Award01Icon,
  Clock01Icon,
  CodeSquareIcon,
  ServerStack03Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

type Props = {
  problem: PublicProjectionProblem;
  contest?: Contest | Homework;
};

const PROBLEM_TYPE_LABEL: Record<string, string> = {
  default: '传统',
  traditional: '传统',
  fileio: '文件读写',
  remote_judge: '远程评测',
};

function StatItem({ value, label }: { value?: number; label: string }) {
  const display = typeof value === 'number' ? value : 0;
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-3xl text-primary leading-none">{display}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export default function ProblemTitle({ problem, contest }: Props) {
  const typeLabel =
    (problem.config?.type && PROBLEM_TYPE_LABEL[problem.config.type]) ||
    problem.config?.type;
  const tagList = Array.isArray(problem.tag) ? problem.tag : [];

  return (
    <div
      data-llm-visible="true"
      className="flex items-start justify-between gap-6 border-b pb-4"
    >
      <div className="min-w-0 flex-1">
        <div className="min-w-0 text-2xl leading-snug">
          <span className="mr-2 whitespace-nowrap text-muted-foreground">
            #{problem.pid || problem.docId}.
          </span>
          <span className="wrap-break-word" data-llm-text={problem.title}>
            {problem.title}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ProblemDifficulty difficulty={problem.difficulty} />
          <Badge variant="secondary">
            <HugeiconsIcon
              strokeWidth={2}
              icon={CodeSquareIcon}
              data-icon="inline-start"
            />
            {typeLabel}
          </Badge>
          <Badge variant="secondary">
            <HugeiconsIcon
              strokeWidth={3}
              icon={Clock01Icon}
              data-icon="inline-start"
            />
            {formatTime(problem.config?.timeMax ?? 0, 'ms')}
          </Badge>

          <Badge variant="secondary">
            <HugeiconsIcon
              strokeWidth={2}
              icon={ServerStack03Icon}
              data-icon="inline-start"
            />
            {formatMemory((problem.config?.memoryMax ?? 0) * 1024 * 1024)}
          </Badge>

          {contest && (
            <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950 dark:text-amber-400">
              <HugeiconsIcon icon={Award01Icon} strokeWidth={2} />
              <span data-llm-text={contest.title}>{contest.title}</span>
            </Badge>
          )}

          <ProblemTags tagList={tagList} />
        </div>
      </div>

      <div className="flex shrink-0 items-start gap-8">
        <StatItem value={problem.nAccept} label="通过" />
        <StatItem value={problem.nSubmit} label="提交" />
      </div>
    </div>
  );
}
