import type { ContestListResponse } from '@/api/server/method/contests/list';
import ContestRuleBadge from '@/features/contest/contest-rule-badge';
import ContestStatus, {
  getContestStatusHoverTextClassName,
  getContestStatusTextClassName,
  type ContestStatus as ContestRuntimeStatus,
} from '@/features/contest/contest-status';
import TimeDurationBadge from '@/shared/components/time-duration-badge';
import { Badge } from '@/shared/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/lib/utils';
import type { ContestListProjection } from '@/shared/types/contest';
import dayjs from 'dayjs';
import { Code2, Search, Star, Check, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

export function groupContestsByStatus(
  tdocs: ContestListProjection[],
  now: dayjs.Dayjs
): Record<ContestRuntimeStatus, ContestListProjection[]> {
  const groups: Record<ContestRuntimeStatus, ContestListProjection[]> = {
    running: [],
    pending: [],
    ended: [],
  };

  for (const contest of tdocs) {
    groups[getContestStatus(contest, now)].push(contest);
  }

  return groups;
}

const sectionContainerClassName: Record<'running' | 'pending', string> = {
  running:
    'border-pink-300 bg-pink-100 dark:border-pink-500/40 dark:bg-pink-500/20',
  pending:
    'border-sky-300 bg-sky-100 dark:border-sky-500/40 dark:bg-sky-500/20',
};

const sectionStatusBadgeClassName: Record<'running' | 'pending', string> = {
  running: 'bg-pink-200 text-pink-800 dark:bg-pink-500/30 dark:text-pink-100',
  pending: 'bg-sky-200 text-sky-800 dark:bg-sky-500/30 dark:text-sky-100',
};

const sectionItemHoverClassName: Record<'running' | 'pending', string> = {
  running: 'hover:bg-pink-200/40 dark:hover:bg-pink-500/25',
  pending: 'hover:bg-sky-200/40 dark:hover:bg-sky-500/25',
};

function ContestItem({
  contest,
  status,
  attended,
  statusBadgeClassName,
}: {
  contest: ContestListProjection;
  status: ContestRuntimeStatus;
  attended: boolean;
  statusBadgeClassName?: string;
}) {
  const t = useTranslations('contest');
  const common = useTranslations('common');

  const problemCount = contest.pids?.length ?? 0;
  const contestHref = `/contest/${contest.docId}`;

  return (
    <div data-llm-visible="true" className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={contestHref}
          prefetch={false}
          data-llm-text={contest.title}
          className={cn(
            'truncate text-sm font-medium hover:underline md:text-lg',
            getContestStatusTextClassName(status),
            getContestStatusHoverTextClassName(status)
          )}
        >
          {contest.title}
        </Link>
        <ContestStatus status={status} className={statusBadgeClassName} />
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <ContestRuleBadge rule={contest.rule} />
          {contest.rated && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
              title={t('rated')}
            >
              <Star data-icon="inline-start" />
              <span data-llm-text={t('rated')}>{t('rated')}</span>
            </Badge>
          )}
          <Badge variant="secondary" title={t('participants')}>
            <Users data-icon="inline-start" />
            <span
              data-llm-text={String(contest.attend)}
              className="tabular-nums"
            >
              {contest.attend}
            </span>
          </Badge>
          <TimeDurationBadge
            startTime={contest.beginAt}
            endTime={contest.endAt}
            durationLabel={t('duration')}
            timeRangeLabel={t('time')}
          />
          <Badge variant="secondary" title={t('problemCount')}>
            <Code2 data-icon="inline-start" />
            <span data-llm-text={String(problemCount)} className="tabular-nums">
              {common('problems', { count: problemCount })}
            </span>
          </Badge>
          {attended && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
            >
              <Check data-icon="inline-start" />
              <span data-llm-text={t('joined')}>{t('joined')}</span>
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function ContestItemList({
  contests,
  statusById,
  attendedById,
  statusBadgeClassName,
  itemHoverClassName = 'hover:bg-accent/30',
}: {
  contests: ContestListProjection[];
  statusById: Map<string, ContestRuntimeStatus>;
  attendedById: (docId: string) => boolean;
  statusBadgeClassName?: string;
  itemHoverClassName?: string;
}) {
  return (
    <>
      {contests.map((contest, index) => (
        <Fragment key={contest.docId}>
          <div
            className={cn(
              'px-4 py-4 transition-colors sm:px-5',
              itemHoverClassName
            )}
          >
            <ContestItem
              contest={contest}
              status={statusById.get(contest.docId) ?? 'ended'}
              attended={attendedById(contest.docId)}
              statusBadgeClassName={statusBadgeClassName}
            />
          </div>
          {index < contests.length - 1 && <Separator />}
        </Fragment>
      ))}
    </>
  );
}

export default function ContestList({ data }: Props) {
  const t = useTranslations('contest');
  if (!data.tdocs.length) {
    return (
      <Empty className="border border-dashed" data-llm-visible="true">
        <EmptyMedia variant="icon">
          <Search strokeWidth={2} />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle data-llm-text={t('noContests')}>
            {t('noContests')}
          </EmptyTitle>
          <EmptyDescription data-llm-text={t('noContestsDescription')}>
            {t('noContestsDescription')}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const now = dayjs();
  const groups = groupContestsByStatus(data.tdocs, now);
  const statusById = new Map<string, ContestRuntimeStatus>(
    data.tdocs.map((contest) => [contest.docId, getContestStatus(contest, now)])
  );
  const attendedById = (docId: string) => Boolean(data.tsdict?.[docId]?.attend);

  const highlightSections: Array<{
    status: 'running' | 'pending';
    contests: ContestListProjection[];
  }> = [
    { status: 'running', contests: groups.running },
    { status: 'pending', contests: groups.pending },
  ];

  return (
    <div className="space-y-4">
      {highlightSections
        .filter((section) => section.contests.length > 0)
        .map((section) => (
          <section
            key={section.status}
            data-llm-visible="true"
            className={cn(
              'overflow-hidden rounded-xl border',
              sectionContainerClassName[section.status]
            )}
          >
            <ContestItemList
              contests={section.contests}
              statusById={statusById}
              attendedById={attendedById}
              statusBadgeClassName={sectionStatusBadgeClassName[section.status]}
              itemHoverClassName={sectionItemHoverClassName[section.status]}
            />
          </section>
        ))}

      {groups.ended.length > 0 && (
        <div
          className="overflow-hidden rounded-xl border bg-card/40"
          data-llm-visible="true"
        >
          <ContestItemList
            contests={groups.ended}
            statusById={statusById}
            attendedById={attendedById}
          />
        </div>
      )}
    </div>
  );
}
