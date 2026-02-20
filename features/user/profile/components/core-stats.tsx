import type { UserProfileProps } from './shared';
import { ChartPie, Hash, ListChecks, Tags, Trophy } from 'lucide-react';

export default function CoreStats({ data }: UserProfileProps) {
  const stats = [
    { label: '通过题目', value: data.pdocs.length, icon: ListChecks },
    { label: '标签覆盖', value: data.tags.length, icon: Tags },
    { label: '参与比赛/作业', value: data.tdocs.length, icon: Trophy },
    { label: '公开题解', value: data.psdocs?.length ?? 0, icon: Hash },
  ];

  return (
    <section className="space-y-3" data-llm-visible="true">
      <h2 className="inline-flex items-center gap-2 text-base font-medium">
        <ChartPie className="size-4 text-muted-foreground" />
        <span data-llm-text="数据概览">数据概览</span>
      </h2>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-background flex items-center gap-2 px-3 py-3"
          >
            <Icon className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p
                className="tabular-nums text-sm font-medium"
                data-llm-text={String(value)}
              >
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
