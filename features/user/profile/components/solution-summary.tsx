import type { UserProfileProps } from './shared';
import { Badge } from '@/shared/components/ui/badge';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function SolutionSummary({ data }: UserProfileProps) {
  if (data.psdocs === undefined) {
    return (
      <section className="space-y-3" data-llm-visible="true">
        <h2 className="inline-flex items-center gap-2 text-base font-medium">
          <FileText className="size-4 text-muted-foreground" />
          <span data-llm-text="题解贡献">题解贡献</span>
        </h2>
        <p
          className="text-sm text-muted-foreground"
          data-llm-text="无权限查看题解信息"
        >
          无权限查看题解信息
        </p>
      </section>
    );
  }

  if (!data.psdocs.length) {
    return (
      <section className="space-y-3" data-llm-visible="true">
        <h2 className="inline-flex items-center gap-2 text-base font-medium">
          <FileText className="size-4 text-muted-foreground" />
          <span data-llm-text="题解贡献">题解贡献</span>
        </h2>
        <p
          className="text-sm text-muted-foreground"
          data-llm-text="暂无公开题解"
        >
          暂无公开题解
        </p>
      </section>
    );
  }

  const totalVote = data.psdocs.reduce((sum, item) => sum + item.vote, 0);
  const averageVote = Math.round((totalVote / data.psdocs.length) * 10) / 10;
  const uniqueProblems = new Set(data.psdocs.map((item) => item.parentId)).size;
  const topSolutions = [...data.psdocs]
    .sort((a, b) => b.vote - a.vote)
    .slice(0, 8);

  return (
    <section className="space-y-3" data-llm-visible="true">
      <h2 className="inline-flex items-center gap-2 text-base font-medium">
        <FileText className="size-4 text-muted-foreground" />
        <span data-llm-text="题解贡献">题解贡献</span>
      </h2>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
        {[
          { label: '公开题解', value: data.psdocs.length },
          { label: '覆盖题目', value: uniqueProblems },
          { label: '总投票', value: totalVote },
          { label: '平均投票', value: averageVote },
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
        {topSolutions.map((solution) => {
          const problem = data.pdict?.[solution.parentId];
          const title = problem?.title ?? `题目 #${solution.parentId}`;
          const href = `/problem/${solution.parentId}/solution`;

          return (
            <Link
              key={solution.docId}
              href={href}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs hover:bg-accent/40"
            >
              <span className="max-w-44 truncate" data-llm-text={title}>
                {title}
              </span>
              <Badge variant="secondary" className="h-5 px-2 tabular-nums">
                {solution.vote}
              </Badge>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
