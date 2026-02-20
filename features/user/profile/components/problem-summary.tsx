import type { UserProfileProps } from './shared';
import { Badge } from '@/shared/components/ui/badge';
import { Empty, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import {
  PROBLEMS_DIFFICULTY_SHORT,
  PROBLEMS_DIFFICULTY_COLOR,
} from '@/shared/configs/difficulty';
import { ListChecks } from 'lucide-react';
import Link from 'next/link';

export default function ProblemSummary({ data }: UserProfileProps) {
  if (!data.pdocs.length) {
    return (
      <Empty className="border border-dashed" data-llm-visible="true">
        <EmptyHeader>
          <EmptyTitle data-llm-text="暂无通过题目">暂无通过题目</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  const difficultyCount = new Map<number, number>();
  for (const problem of data.pdocs) {
    const difficulty =
      typeof problem.difficulty === 'number' && problem.difficulty >= 0
        ? problem.difficulty
        : 0;
    difficultyCount.set(difficulty, (difficultyCount.get(difficulty) ?? 0) + 1);
  }

  const rows = [...difficultyCount.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([difficulty, count]) => ({
      difficulty,
      count,
      label: PROBLEMS_DIFFICULTY_SHORT[difficulty] ?? `难度 ${difficulty}`,
      color: PROBLEMS_DIFFICULTY_COLOR[difficulty] ?? '#9ca3af',
    }));
  const maxCount = Math.max(...rows.map((row) => row.count));

  return (
    <section className="space-y-3" data-llm-visible="true">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-base font-medium">
          <ListChecks className="size-4 text-muted-foreground" />
          <span data-llm-text="做题概览">做题概览</span>
        </h2>
        <Link
          href={`/record?uidOrName=${encodeURIComponent(data.udoc.uname)}`}
          className="text-sm text-primary hover:underline"
          data-llm-text="查看提交记录"
        >
          查看提交记录
        </Link>
      </div>

      <div className="space-y-2 rounded-lg border p-3">
        {rows.map((row) => (
          <div
            key={row.difficulty}
            className="grid grid-cols-[76px_1fr_40px] items-center gap-2"
          >
            <span
              className="text-xs text-muted-foreground"
              data-llm-text={row.label}
            >
              {row.label}
            </span>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(8, Math.round((row.count / maxCount) * 100))}%`,
                  backgroundColor: row.color,
                }}
              />
            </div>
            <span
              className="tabular-nums text-right text-xs"
              data-llm-text={String(row.count)}
            >
              {row.count}
            </span>
          </div>
        ))}
      </div>

      {data.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.tags.slice(0, 20).map(([tag, count]) => (
            <Badge key={tag} variant="secondary">
              <span data-llm-text={tag}>{tag}</span>
              <span className="px-1 text-muted-foreground">·</span>
              <span className="tabular-nums" data-llm-text={String(count)}>
                {count}
              </span>
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}
