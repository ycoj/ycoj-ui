import type { TrainingListResponse } from '@/api/server/method/training/list';
import { Badge } from '@/shared/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import { Separator } from '@/shared/components/ui/separator';
import type { TrainingDoc } from '@/shared/types/training';
import { BookOpen, Code2, Search, Check, Users } from 'lucide-react';
import Link from 'next/link';
import { Fragment } from 'react';

type Props = {
  data: TrainingListResponse;
};

function getTrainingProblemCount(training: TrainingDoc) {
  return training.dag.reduce((sum, node) => sum + node.pids.length, 0);
}

function TrainingItem({
  training,
  attended,
}: {
  training: TrainingDoc;
  attended: boolean;
}) {
  const sectionCount = training.dag.length;
  const problemCount = getTrainingProblemCount(training);
  const trainingHref = `/training/${training.docId}`;
  const description = training.content?.trim();

  return (
    <div data-llm-visible="true" className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={trainingHref}
          data-llm-text={training.title}
          className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline md:text-lg"
        >
          {training.title}
        </Link>
      </div>

      <p
        className="line-clamp-1 text-xs text-muted-foreground md:text-sm"
        data-llm-text={description || '暂无简介'}
      >
        {description || '暂无简介'}
      </p>

      <div className="flex items-center gap-3 text-xs">
        <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <Badge variant="secondary" title="小节数量">
            <BookOpen data-icon="inline-start" />
            <span data-llm-text={String(sectionCount)} className="tabular-nums">
              {sectionCount} 小节
            </span>
          </Badge>
          <Badge variant="secondary" title="题目数量">
            <Code2 data-icon="inline-start" />
            <span data-llm-text={String(problemCount)} className="tabular-nums">
              {problemCount} 道题
            </span>
          </Badge>
          <Badge variant="secondary" title="参加人数">
            <Users data-icon="inline-start" />
            <span
              data-llm-text={String(training.attend)}
              className="tabular-nums"
            >
              {training.attend}
            </span>
          </Badge>
          {attended && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
            >
              <Check data-icon="inline-start" />
              <span data-llm-text="已参加">已参加</span>
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrainingList({ data }: Props) {
  if (!data.tdocs.length) {
    return (
      <Empty className="border border-dashed" data-llm-visible="true">
        <EmptyMedia variant="icon">
          <Search strokeWidth={2} />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle data-llm-text="暂无训练">暂无训练</EmptyTitle>
          <EmptyDescription data-llm-text="暂无训练">
            教练还没有添加训练，或是你没有对应权限。
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
      {data.tdocs.map((training, index) => (
        <Fragment key={training.docId}>
          <div className="px-4 py-4 transition-colors hover:bg-accent/30 sm:px-5">
            <TrainingItem
              training={training}
              attended={Boolean(data.tsdict?.[training.docId]?.enroll)}
            />
          </div>
          {index < data.tdocs.length - 1 && <Separator />}
        </Fragment>
      ))}
    </div>
  );
}
