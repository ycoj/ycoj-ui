import type { HomeworkListResponse } from '@/api/server/method/homework/list';
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
  SearchList02Icon,
  Tick02Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import dayjs from 'dayjs';
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
  const now = dayjs();
  const status = getHomeworkStatus(homework, now);

  const beginAt = dayjs(homework.beginAt).format('YYYY-MM-DD HH:mm');
  const endAt = dayjs(homework.endAt).format('YYYY-MM-DD HH:mm');
  const timeText = beginAt && endAt ? `${beginAt} - ${endAt}` : '';
  const homeworkHref = `/homework/${homework.docId}`;

  return (
    <div data-llm-visible="true" className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={homeworkHref}
          data-llm-text={homework.title}
          className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline md:text-lg"
        >
          {homework.title}
        </Link>
        <ContestStatus status={status} />
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
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
          {timeText && (
            <Badge variant="secondary" title="作业时间">
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

export default function HomeworkList({ data }: Props) {
  if (!data.tdocs.length) {
    return (
      <Empty className="border border-dashed" data-llm-visible="true">
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={SearchList02Icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle data-llm-text="暂无作业">暂无作业</EmptyTitle>
          <EmptyDescription data-llm-text="暂无作业">
            教练还没有添加作业，或是你没有对应权限。
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
