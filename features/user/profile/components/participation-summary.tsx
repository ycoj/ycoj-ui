import { type UserProfileProps } from './shared';
import ContestStatus from '@/features/contest/contest-status';
import { getContestStatus } from '@/features/contest/detail/contest-utils';
import dayjs from 'dayjs';
import { Trophy } from 'lucide-react';
import Link from 'next/link';

export default function ParticipationSummary({ data }: UserProfileProps) {
  if (!data.tdocs.length) {
    return (
      <section className="space-y-3" data-llm-visible="true">
        <h2 className="inline-flex items-center gap-2 text-base font-medium">
          <Trophy className="size-4 text-muted-foreground" />
          <span data-llm-text="参赛概览">参赛概览</span>
        </h2>
        <p
          className="text-sm text-muted-foreground"
          data-llm-text="暂无参与记录"
        >
          暂无参与记录
        </p>
      </section>
    );
  }

  const contestCount = data.tdocs.filter(
    (item) => item.rule !== 'homework'
  ).length;
  const homeworkCount = data.tdocs.length - contestCount;

  let pending = 0;
  let running = 0;
  let ended = 0;
  for (const item of data.tdocs) {
    const status = getContestStatus(item);
    if (status === 'pending') pending += 1;
    if (status === 'running') running += 1;
    if (status === 'ended') ended += 1;
  }

  const recent = [...data.tdocs]
    .sort((a, b) => dayjs(b.beginAt).valueOf() - dayjs(a.beginAt).valueOf())
    .slice(0, 8);

  return (
    <section className="space-y-3" data-llm-visible="true">
      <h2 className="inline-flex items-center gap-2 text-base font-medium">
        <Trophy className="size-4 text-muted-foreground" />
        <span data-llm-text="参赛概览">参赛概览</span>
      </h2>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-5">
        {[
          { label: '比赛', value: contestCount },
          { label: '作业', value: homeworkCount },
          { label: '进行中', value: running },
          { label: '未开始', value: pending },
          { label: '已结束', value: ended },
        ].map((item) => (
          <div key={item.label} className="bg-background px-3 py-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p
              className="tabular-nums text-sm font-medium"
              data-llm-text={String(item.value)}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {recent.map((item) => {
          const href =
            item.rule === 'homework'
              ? `/homework/${item.docId}`
              : `/contest/${item.docId}`;
          return (
            <Link
              key={item.docId}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs hover:bg-accent/40"
            >
              <span className="max-w-40 truncate" data-llm-text={item.title}>
                {item.title}
              </span>
              <ContestStatus
                status={getContestStatus(item)}
                className="h-5 px-1.5"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
