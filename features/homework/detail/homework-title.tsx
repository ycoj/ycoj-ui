import type { HomeworkDetailTdoc } from '@/api/server/method/homework/detail';
import ContestRuleBadge from '@/features/contest/contest-rule-badge';
import { formatContestDuration } from '@/features/contest/detail/contest-utils';
import { Badge } from '@/shared/components/ui/badge';
import {
  Calendar01Icon,
  Clock01Icon,
  CodeSquareIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import dayjs from 'dayjs';

type Props = {
  homework: HomeworkDetailTdoc;
};

export default function HomeworkTitle({ homework }: Props) {
  const beginAt = dayjs(homework.beginAt);
  const endAt = dayjs(homework.endAt);
  const timeText =
    beginAt.isValid() && endAt.isValid()
      ? `${beginAt.format('YYYY-MM-DD HH:mm')} ~ ${endAt.format(
          'YYYY-MM-DD HH:mm'
        )}`
      : '';
  const durationText = formatContestDuration(homework.beginAt, homework.endAt);
  const problemCount = homework.pids?.length ?? 0;

  return (
    <div
      data-llm-visible="true"
      className="space-y-3 border-b pb-4"
      data-llm-text={homework.title}
    >
      <h1 className="wrap-break-word text-2xl leading-snug font-medium">
        {homework.title}
      </h1>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <ContestRuleBadge rule={homework.rule} />
        <Badge variant="secondary" title="参与人数">
          <HugeiconsIcon icon={UserGroupIcon} data-icon="inline-start" />
          <span
            data-llm-text={String(homework.attend)}
            className="tabular-nums"
          >
            {homework.attend}
          </span>
        </Badge>
        {durationText && (
          <Badge variant="secondary" title="作业时长">
            <HugeiconsIcon icon={Clock01Icon} data-icon="inline-start" />
            <span data-llm-text={durationText} className="tabular-nums">
              {durationText}
            </span>
          </Badge>
        )}
        <Badge variant="secondary" title="题目数量">
          <HugeiconsIcon icon={CodeSquareIcon} data-icon="inline-start" />
          <span data-llm-text={String(problemCount)} className="tabular-nums">
            {problemCount} 道题
          </span>
        </Badge>
        {timeText && (
          <div className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
            <HugeiconsIcon icon={Calendar01Icon} className="size-4" />
            <span data-llm-text={timeText}>{timeText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
