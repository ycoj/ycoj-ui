import ContestRuleBadge from '@/features/contest/contest-rule-badge';
import { formatContestDuration } from '@/features/contest/detail/contest-utils';
import { Badge } from '@/shared/components/ui/badge';
import type { Contest } from '@/shared/types/contest';
import type { Homework } from '@/shared/types/homework';
import {
  Calendar01Icon,
  Clock01Icon,
  CodeSquareIcon,
  StarIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import dayjs from 'dayjs';

type Props = {
  tdoc: Contest | Homework;
};

export default function ContestTitle({ tdoc }: Props) {
  const durationText = formatContestDuration(tdoc.beginAt, tdoc.endAt);
  const problemCount = tdoc.pids?.length ?? 0;
  const beginAt = dayjs(tdoc.beginAt);
  const endAt = dayjs(tdoc.endAt);
  const timeText =
    beginAt.isValid() && endAt.isValid()
      ? `${beginAt.format('YYYY-MM-DD HH:mm')} ~ ${endAt.format(
          'YYYY-MM-DD HH:mm'
        )}`
      : '';

  const isHomework = tdoc.rule === 'homework';
  const hasRated = 'rated' in tdoc && tdoc.rated;

  return (
    <div
      data-llm-visible="true"
      className="space-y-3"
      data-llm-text={tdoc.title}
    >
      <h1 className="wrap-break-word text-2xl leading-snug font-medium">
        {tdoc.title}
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        {hasRated && (
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
          >
            <HugeiconsIcon icon={StarIcon} data-icon="inline-start" />
            <span data-llm-text="Rated">Rated</span>
          </Badge>
        )}

        <ContestRuleBadge rule={tdoc.rule} />

        <Badge variant="secondary" title={isHomework ? '参与人数' : '参赛人数'}>
          <HugeiconsIcon icon={UserGroupIcon} data-icon="inline-start" />
          <span data-llm-text={String(tdoc.attend)} className="tabular-nums">
            {tdoc.attend}
          </span>
        </Badge>

        {durationText && (
          <Badge
            variant="secondary"
            title={isHomework ? '作业时长' : '比赛持续时间'}
          >
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
