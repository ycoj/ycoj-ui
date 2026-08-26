import { ProblemTags } from '@/features/problem/detail/problem-tags';
import { isFileIoProblem } from '@/features/problem/detail/problem-type';
import { formatProblemPid } from '@/features/problem/lib/format-problem-pid';
import ProblemDifficulty from '@/features/problem/problem-difficulty';
import { Badge } from '@/shared/components/ui/badge';
import { formatMemory, formatTime } from '@/shared/lib/format-units';
import type { Contest } from '@/shared/types/contest';
import type { Homework } from '@/shared/types/homework';
import type { PublicProjectionProblem } from '@/shared/types/problem';
import { Award, Clock, Code2, FileInput, Server } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  problem: PublicProjectionProblem;
  contest?: Contest | Homework;
};

const PROBLEM_TYPE_KEYS: Record<string, string> = {
  default: 'traditional',
  traditional: 'traditional',
  objective: 'objective',
  submit_answer: 'submitAnswer',
  fileio: 'fileIoShort',
  interactive: 'interactive',
  communication: 'communication',
  remote_judge: 'remoteJudgeShort',
};

const DEFAULT_TIME_MS = 1000;
const DEFAULT_MEMORY_MB = 256;
const DEFAULT_PROBLEM_TYPE = 'default';

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
  const t = useTranslations('problem');
  const typeKey =
    PROBLEM_TYPE_KEYS[problem.config?.type || DEFAULT_PROBLEM_TYPE];
  const typeLabel = typeKey ? t(typeKey) : problem.config?.type;
  const tagList = Array.isArray(problem.tag) ? problem.tag : [];
  const fileIoName = problem.config?.subType;
  const hideTimeMemory =
    problem.config?.type === 'objective' ||
    problem.config?.type === 'submit_answer';

  return (
    <div
      data-llm-visible="true"
      className="flex items-start justify-between gap-6 border-b pb-4"
    >
      <div className="min-w-0 flex-1">
        <div className="min-w-0 text-2xl leading-snug">
          <span className="mr-2 whitespace-nowrap text-muted-foreground">
            #{formatProblemPid(problem)}.
          </span>
          <span className="wrap-break-word" data-llm-text={problem.title}>
            {problem.title}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ProblemDifficulty difficulty={problem.difficulty} />
          <Badge variant="secondary">
            <Code2 strokeWidth={2} data-icon="inline-start" />
            {typeLabel}
          </Badge>
          {isFileIoProblem(problem) && fileIoName && (
            <Badge variant="secondary">
              <FileInput strokeWidth={2} data-icon="inline-start" />
              {t('fileIoWithName', { name: fileIoName })}
            </Badge>
          )}
          {!hideTimeMemory && (
            <Badge variant="secondary">
              <Clock strokeWidth={3} data-icon="inline-start" />
              {formatTime(problem.config?.timeMax ?? DEFAULT_TIME_MS, 'ms')}
            </Badge>
          )}

          {!hideTimeMemory && (
            <Badge variant="secondary">
              <Server strokeWidth={2} data-icon="inline-start" />
              {formatMemory(
                (problem.config?.memoryMax ?? DEFAULT_MEMORY_MB) * 1024 * 1024
              )}
            </Badge>
          )}

          {contest && (
            <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950 dark:text-amber-400">
              <Award strokeWidth={2} />
              <span data-llm-text={contest.title}>{contest.title}</span>
            </Badge>
          )}

          <ProblemTags tagList={tagList} />
        </div>
      </div>

      {!contest && (
        <div className="flex shrink-0 items-start gap-8">
          <StatItem value={problem.nAccept} label={t('accepted')} />
          <StatItem value={problem.nSubmit} label={t('submissions')} />
        </div>
      )}
    </div>
  );
}
