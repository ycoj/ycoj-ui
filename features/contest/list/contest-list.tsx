import type { ContestListResponse } from '@/api/server/method/contests/list';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/lib/utils';
import { RuleTexts, type ContestListProjection } from '@/shared/types/contest';
import {
  Calendar01Icon,
  ChampionIcon,
  Clock01Icon,
  CodeSquareIcon,
  StarIcon,
  Tick02Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import dayjs from 'dayjs';
import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';

type Props = {
  data: ContestListResponse;
};

type ContestStatus = 'running' | 'pending' | 'ended';

function getContestStatus(
  contest: ContestListProjection,
  now: dayjs.Dayjs
): ContestStatus {
  const beginAt = dayjs(contest.beginAt);
  const endAt = dayjs(contest.endAt);

  if (beginAt.isValid() && endAt.isValid()) {
    if (now.isBefore(beginAt)) return 'pending';
    if (now.isBefore(endAt)) return 'running';
    return 'ended';
  }

  return 'ended';
}

function getStatusStyle(status: ContestStatus) {
  switch (status) {
    case 'running':
      return { className: 'text-pink-600', label: '进行中' as const };
    case 'pending':
      return { className: 'text-blue-500', label: '即将开始' as const };
    default:
      return { className: 'text-muted-foreground', label: '已结束' as const };
  }
}

function MetaItem({
  icon,
  children,
}: {
  icon: IconSvgElement;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <HugeiconsIcon icon={icon} className="size-3.5" />
      <span className="tabular-nums">{children}</span>
    </span>
  );
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
  const statusStyle = getStatusStyle(status);

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
        <span
          data-llm-text={statusStyle.label}
          className={cn(
            'bg-muted rounded-full px-2 py-0.5 shrink-0 text-xs font-medium',
            statusStyle.className
          )}
        >
          {statusStyle.label}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
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
          <Badge variant="outline">
            <HugeiconsIcon icon={ChampionIcon} />
            <span data-llm-text={RuleTexts[contest.rule]}>
              {RuleTexts[contest.rule]}
            </span>
          </Badge>
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
        {timeText && (
          <div className="text-muted-foreground shrink-0">
            <MetaItem icon={Calendar01Icon}>
              <span data-llm-text={timeText}>{timeText}</span>
            </MetaItem>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContestList({ data }: Props) {
  if (!data.tdocs.length) {
    return (
      <div
        data-llm-visible="true"
        className="rounded-xl border border-dashed py-10 text-center"
      >
        <p data-llm-text="暂无比赛" className="text-muted-foreground text-sm">
          暂无比赛
        </p>
      </div>
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
