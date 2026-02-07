import { formatContestDuration } from './contest-utils';
import type { ContestDetailTdoc } from '@/api/server/method/contests/detail';
import { Badge } from '@/shared/components/ui/badge';
import { RuleTexts } from '@/shared/types/contest';
import {
  Calendar01Icon,
  ChampionIcon,
  Clock01Icon,
  CodeSquareIcon,
  StarIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import dayjs from 'dayjs';

type Props = {
  contest: ContestDetailTdoc;
};

export default function ContestTitle({ contest }: Props) {
  const durationText = formatContestDuration(contest.beginAt, contest.endAt);
  const problemCount = contest.pids?.length ?? 0;
  const beginAt = dayjs(contest.beginAt);
  const endAt = dayjs(contest.endAt);
  const timeText =
    beginAt.isValid() && endAt.isValid()
      ? `${beginAt.format('YYYY-MM-DD HH:mm')} ~ ${endAt.format(
          'YYYY-MM-DD HH:mm'
        )}`
      : '';

  return (
    <div
      data-llm-visible="true"
      className="space-y-3 border-b pb-4"
      data-llm-text={contest.title}
    >
      <h1 className="wrap-break-word text-2xl leading-snug font-medium">
        {contest.title}
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        {contest.rated && (
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
          >
            <HugeiconsIcon icon={StarIcon} data-icon="inline-start" />
            <span data-llm-text="Rated">Rated</span>
          </Badge>
        )}

        <Badge variant="outline">
          <HugeiconsIcon icon={ChampionIcon} />
          <span data-llm-text={RuleTexts[contest.rule]}>
            {RuleTexts[contest.rule]}
          </span>
        </Badge>

        <Badge variant="secondary" title="参赛人数">
          <HugeiconsIcon icon={UserGroupIcon} data-icon="inline-start" />
          <span data-llm-text={String(contest.attend)} className="tabular-nums">
            {contest.attend}
          </span>
        </Badge>

        {durationText && (
          <Badge variant="secondary" title="比赛持续时间">
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
