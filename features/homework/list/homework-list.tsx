import type { HomeworkListResponse } from '@/api/server/method/homework/list';
import ContestRuleBadge from '@/features/contest/contest-rule-badge';
import ContestStatus, {
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
import { Search, Check, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Fragment } from 'react';

type Props = {
  data: HomeworkListResponse;
};

function getHomeworkStatus(
  homework: ContestListProjection,
  now: dayjs.Dayjs
): ContestRuntimeStatus {
  const beginAt = dayjs(homework.beginAt);
  const endAt = dayjs(homework.endAt);

  if (beginAt.isValid() && endAt.isValid()) {
    if (now.isBefore(beginAt)) return 'pending';
    if (now.isBefore(endAt)) return 'running';
    return 'ended';
  }

  return 'ended';
}

function HomeworkItem({
  homework,
  attended,
}: {
  homework: ContestListProjection;
  attended: boolean;
}) {
  const t = useTranslations('homework');
  const now = dayjs();
  const status = getHomeworkStatus(homework, now);

  const homeworkHref = `/homework/${homework.docId}`;

  return (
    <div data-llm-visible="true" className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={homeworkHref}
          data-llm-text={homework.title}
          className={cn(
            'truncate text-sm font-medium hover:text-primary hover:underline md:text-lg',
            getContestStatusTextClassName(status)
          )}
        >
          {homework.title}
        </Link>
        <ContestStatus status={status} />
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <ContestRuleBadge rule={homework.rule} />
          <Badge variant="secondary" title={t('participants')}>
            <Users data-icon="inline-start" />
            <span
              data-llm-text={String(homework.attend)}
              className="tabular-nums"
            >
              {homework.attend}
            </span>
          </Badge>
          <TimeDurationBadge
            startTime={homework.beginAt}
            endTime={homework.endAt}
            showDuration={false}
            timeRangeLabel={t('time')}
          />
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

export default function HomeworkList({ data }: Props) {
  const t = useTranslations('homework');
  if (!data.tdocs.length) {
    return (
      <Empty className="border border-dashed" data-llm-visible="true">
        <EmptyMedia variant="icon">
          <Search strokeWidth={2} />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle data-llm-text={t('none')}>{t('none')}</EmptyTitle>
          <EmptyDescription data-llm-text={t('noneDescription')}>
            {t('noneDescription')}
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
      {data.tdocs.map((homework, index) => (
        <Fragment key={homework.docId}>
          <div className="px-4 py-4 transition-colors hover:bg-accent/30 sm:px-5">
            <HomeworkItem
              homework={homework}
              attended={Boolean(data.hsdict?.[homework.docId]?.attend)}
            />
          </div>
          {index < data.tdocs.length - 1 && <Separator />}
        </Fragment>
      ))}
    </div>
  );
}
