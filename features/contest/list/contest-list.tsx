import type { ContestListResponse } from '@/api/server/method/contests/list';
import ContestRuleBadge from '@/features/contest/contest-rule-badge';
import ContestStatus, {
  type ContestStatus as ContestRuntimeStatus,
} from '@/features/contest/contest-status';
import { Badge } from '@/shared/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import { Separator } from '@/shared/components/ui/separator';
import type { ContestListProjection } from '@/shared/types/contest';
import {
  Calendar01Icon,
  Clock01Icon,
  CodeSquareIcon,
  SearchList02Icon,
  StarIcon,
  Tick02Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import dayjs from 'dayjs';
import Link from 'next/link';
import { Fragment } from 'react';

type Props = {
  data: ContestListResponse;
};

function getContestStatus(
  contest: ContestListProjection,
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

function formatDuration(beginAt: dayjs.Dayjs, endAt: dayjs.Dayjs) {
  if (!beginAt.isValid() || !endAt.isValid()) return '';
  const totalMinutes = endAt.diff(beginAt, 'minute');
  if (totalMinutes <= 0) return '';

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    if (hours > 0) return `${days} 天 ${hours} 小时`;
    return `${days} 天`;
  }
  if (hours > 0) {
    if (minutes > 0) return `${hours} 小时 ${minutes} 分钟`;
    return `${hours} 小时`;
  }
  return `${minutes} 分钟`;
}

function ContestItem({
  contest,
  attended,
}: {
  contest: ContestListProjection;
  attended: boolean;
}) {
  const now = dayjs();
  const status = getContestStatus(contest, now);

  const beginAt = dayjs(contest.beginAt);
  const endAt = dayjs(contest.endAt);
  const timeText =
    beginAt.isValid() && endAt.isValid()
      ? `${beginAt.format('YYYY-MM-DD HH:mm')} ~ ${endAt.format(
          'YYYY-MM-DD HH:mm'
        )}`
      : '';
  const durationText = formatDuration(beginAt, endAt);
  const problemCount = contest.pids?.length ?? 0;
  const contestHref = `/contest/${contest.docId}`;

  return (
    <div data-llm-visible="true" className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={contestHref}
          data-llm-text={contest.title}
          className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline md:text-lg"
        >
          {contest.title}
        </Link>
        <ContestStatus status={status} />
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <ContestRuleBadge rule={contest.rule} />
          {contest.rated && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
              title="Rated"
            >
              <HugeiconsIcon icon={StarIcon} data-icon="inline-start" />
              <span data-llm-text="Rated">Rated</span>
            </Badge>
          )}
          <Badge variant="secondary" title="参赛人数">
            <HugeiconsIcon icon={UserGroupIcon} data-icon="inline-start" />
            <span
              data-llm-text={String(contest.attend)}
              className="tabular-nums"
            >
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
            <Badge variant="secondary" title="比赛时间">
              <HugeiconsIcon icon={Calendar01Icon} data-icon="inline-start" />
              <span data-llm-text={timeText} className="tabular-nums">
                {timeText}
              </span>
            </Badge>
          )}
          {attended && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
            >
              <HugeiconsIcon icon={Tick02Icon} data-icon="inline-start" />
              <span data-llm-text="已参加">已参加</span>
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContestList({ data }: Props) {
  if (!data.tdocs.length) {
    return (
      <Empty className="border border-dashed" data-llm-visible="true">
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={SearchList02Icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle data-llm-text="暂无比赛">暂无比赛</EmptyTitle>
          <EmptyDescription data-llm-text="暂无比赛">
            教练还没有添加比赛，或是你没有对应权限。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-xl border bg-card/40"
      data-llm-visible="true"
    >
      {data.tdocs.map((contest, index) => (
        <Fragment key={contest.docId}>
          <div className="px-4 py-4 transition-colors hover:bg-accent/30 sm:px-5">
            <ContestItem
              contest={contest}
              attended={Boolean(data.tsdict?.[contest.docId]?.attend)}
            />
          </div>
          {index < data.tdocs.length - 1 && <Separator />}
        </Fragment>
      ))}
    </div>
  );
}
