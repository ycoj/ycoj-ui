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
import dayjs from 'dayjs';
import {
  Calendar,
  Clock,
  Code2,
  Search,
  Star,
  Check,
  Users,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
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

function getDurationParts(beginAt: dayjs.Dayjs, endAt: dayjs.Dayjs) {
  if (!beginAt.isValid() || !endAt.isValid()) return null;
  const totalMinutes = endAt.diff(beginAt, 'minute');
  if (totalMinutes <= 0) return null;

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
}

function ContestItem({
  contest,
  attended,
}: {
  contest: ContestListProjection;
  attended: boolean;
}) {
  const t = useTranslations('contest');
  const common = useTranslations('common');
  const format = useFormatter();
  const now = dayjs();
  const status = getContestStatus(contest, now);

  const beginAt = dayjs(contest.beginAt);
  const endAt = dayjs(contest.endAt);
  const timeText =
    beginAt.isValid() && endAt.isValid()
      ? `${format.dateTime(beginAt.toDate(), { dateStyle: 'medium', timeStyle: 'short' })} ~ ${format.dateTime(endAt.toDate(), { dateStyle: 'medium', timeStyle: 'short' })}`
      : '';
  const parts = getDurationParts(beginAt, endAt);
  const durationText = parts
    ? parts.days > 0
      ? t('durationDaysHours', parts)
      : parts.hours > 0
        ? t('durationHoursMinutes', parts)
        : t('durationMinutes', parts)
    : '';
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
          {durationText && (
            <Badge variant="secondary" title={t('duration')}>
              <Clock data-icon="inline-start" />
              <span data-llm-text={durationText} className="tabular-nums">
                {durationText}
              </span>
            </Badge>
          )}
          <Badge variant="secondary" title={t('problemCount')}>
            <Code2 data-icon="inline-start" />
            <span data-llm-text={String(problemCount)} className="tabular-nums">
              {common('problems', { count: problemCount })}
            </span>
          </Badge>
          {timeText && (
            <Badge variant="secondary" title={t('time')}>
              <Calendar data-icon="inline-start" />
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
              <Check data-icon="inline-start" />
              <span data-llm-text={t('joined')}>{t('joined')}</span>
            </Badge>
          )}
        </div>
      </div>
    </div>
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
