'use client';

import ClientApis from '@/api/client/method';
import type { TrainingDetailResponse } from '@/api/server/method/training/detail';
import {
  getTrainingChapterAnchorId,
  getTrainingProblemCount,
} from '@/features/training/detail/training-detail-utils';
import UserSpan from '@/features/user/user-span';
import { Button } from '@/shared/components/ui/button';
import type { BaseUser } from '@/shared/types/user';
import { PlusSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  tid: string;
  data: TrainingDetailResponse;
  owner?: BaseUser;
};

function InfoRow({
  label,
  value,
  llmText,
}: {
  label: string;
  value: React.ReactNode;
  llmText?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right" data-llm-text={llmText}>
        {value}
      </span>
    </div>
  );
}

export default function TrainingSidebar({ tid, data, owner }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEnrolled = Boolean(data.tsdoc?.enroll);
  const sectionCount = data.tdoc.dag.length;
  const problemCount = getTrainingProblemCount(data.tdoc.dag);
  const doneProblemCount = data.tsdoc?.donePids?.length ?? 0;
  const doneSectionCount = data.tsdoc?.doneNids?.length ?? 0;
  const progressText = problemCount
    ? `${doneProblemCount}/${problemCount}`
    : '0/0';
  const progressPercent = problemCount
    ? Math.round((doneProblemCount * 100) / problemCount)
    : 0;

  const handleEnroll = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await ClientApis.Training.enrollTraining(tid, {
        operation: 'enroll',
      }).send();
      router.refresh();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full space-y-4" data-llm-visible="true">
      {!isEnrolled && (
        <div className="space-y-2 border-b pb-4">
          <Button
            className="h-10 w-full justify-start gap-3 px-4"
            onClick={handleEnroll}
            disabled={submitting}
          >
            <PlusSquare strokeWidth={2} />
            <span data-llm-text={submitting ? '参加中...' : '参加训练'}>
              {submitting ? '参加中...' : '参加训练'}
            </span>
          </Button>
        </div>
      )}

      <div className="space-y-3 pb-4 border-b">
        <h2 className="text-sm font-medium" data-llm-text="训练信息">
          训练信息
        </h2>
        <InfoRow
          label="章节数量"
          value={`${sectionCount} 小节`}
          llmText={String(sectionCount)}
        />
        <InfoRow
          label="题目数量"
          value={`${problemCount} 道题`}
          llmText={String(problemCount)}
        />
        <InfoRow
          label="参加人数"
          value={<span className="tabular-nums">{data.tdoc.attend}</span>}
          llmText={String(data.tdoc.attend)}
        />
        <InfoRow
          label="完成进度"
          value={
            <span className="tabular-nums">
              {progressText} ({progressPercent}%)
            </span>
          }
          llmText={`${progressText} (${progressPercent}%)`}
        />
        <InfoRow
          label="完成章节"
          value={`${doneSectionCount}/${sectionCount}`}
          llmText={`${doneSectionCount}/${sectionCount}`}
        />
        <InfoRow
          label="创建者"
          value={owner ? <UserSpan user={owner} /> : '-'}
          llmText={owner?.uname}
        />
      </div>

      <div className="md:sticky md:top-4 space-y-3">
        <h2 className="text-sm font-medium" data-llm-text="章节目录">
          章节目录
        </h2>
        <div className="space-y-1 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto">
          {data.tdoc.dag.length ? (
            data.tdoc.dag.map((node, index) => {
              const sectionTitle = node.title?.trim() || '未命名章节';
              const chapterLabel = `第${index + 1}章. ${sectionTitle}`;

              return (
                <a
                  key={node._id}
                  href={`#${getTrainingChapterAnchorId(node._id)}`}
                  className="hover:bg-accent/60 block rounded-md px-2 py-1.5 text-base transition-colors"
                >
                  <span className="block truncate" data-llm-text={chapterLabel}>
                    {chapterLabel}
                  </span>
                </a>
              );
            })
          ) : (
            <p
              className="text-sm text-muted-foreground"
              data-llm-text="暂无章节"
            >
              暂无章节
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
