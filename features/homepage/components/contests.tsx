import ContestRuleBadge from '@/features/contest/contest-rule-badge';
import ContestStatus, {
  getContestStatusTextClassName,
  type ContestStatus as ContestRuntimeStatus,
} from '@/features/contest/contest-status';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';
import type { Contest } from '@/shared/types/contest';
import dayjs from 'dayjs';
import { Award, Calendar, Star, Users } from 'lucide-react';
import Link from 'next/link';

type Props = {
  contests: Contest[];
};

function getContestStatus(
  contest: Contest,
  now: dayjs.Dayjs
): ContestRuntimeStatus {
  const beginAt = dayjs(contest.beginAt);
  const endAt = dayjs(contest.endAt);

  if (beginAt.isValid() && endAt.isValid()) {
    if (now.isBefore(beginAt)) return 'pending';
    if (now.isBefore(endAt)) return 'running';
    return 'ended';
  }

  return 'ended';
}

function ContestRow({ contest }: { contest: Contest }) {
  const now = dayjs();
  const status = getContestStatus(contest, now);
  const statusClassName = getContestStatusTextClassName(status);

  const beginAt = dayjs(contest.beginAt);
  const endAt = dayjs(contest.endAt);
  const timeText =
    beginAt.isValid() && endAt.isValid()
      ? `${beginAt.format('MM-DD HH:mm')} ~ ${endAt.format(
          beginAt.year() === endAt.year() ? 'MM-DD HH:mm' : 'YYYY-MM-DD HH:mm'
        )}`
      : '';

  return (
    <div data-llm-visible="true" className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/contest/${contest.docId}`}
          data-llm-text={contest.title}
          className={cn(
            'overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap hover:underline',
            statusClassName
          )}
        >
          {contest.title}
        </Link>
        <ContestStatus status={status} />
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        <ContestRuleBadge rule={contest.rule} />
        {contest.rated && (
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
            title="Rated"
          >
            <Star data-icon="inline-start" />
            <span data-llm-text="Rated">Rated</span>
          </Badge>
        )}
        <Badge variant="secondary" title="参赛人数">
          <Users data-icon="inline-start" />
          <span data-llm-text={String(contest.attend)} className="tabular-nums">
            {contest.attend}
          </span>
        </Badge>
        {timeText && (
          <Badge variant="secondary" title="比赛时间">
            <Calendar data-icon="inline-start" />
            <span data-llm-text={timeText} className="tabular-nums">
              {timeText}
            </span>
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function Contests({ contests }: Props) {
  if (!contests.length) return null;

  const lastIndexByColumn: Record<number, number> = { 0: -1, 1: -1 };
  contests.forEach((_, index) => {
    lastIndexByColumn[index % 2] = index;
  });

  return (
    <Card data-llm-visible="true">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="size-5" />
          <span data-llm-text="最近比赛">最近比赛</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {contests.map((contest, index) => {
            const isLastOverall = index === contests.length - 1;
            const isLastInColumn = index === lastIndexByColumn[index % 2];

            return (
              <div
                key={contest.docId}
                className={cn(
                  !isLastOverall && 'border-b pb-4',
                  'sm:border-b-0 sm:pb-0',
                  !isLastInColumn && 'sm:border-b sm:pb-4'
                )}
              >
                <ContestRow contest={contest} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
