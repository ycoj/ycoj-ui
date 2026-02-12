import ScoreboardTable from '@/features/contest/scoreboard/scoreboard-table';
import ScoreboardToolbar from '@/features/contest/scoreboard/scoreboard-toolbar';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import type { ScoreboardResponse } from '@/shared/types/contest';
import { ClipboardIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

type Props = {
  data: ScoreboardResponse;
  tid: string;
  pageType: 'contest' | 'homework';
  currentUid?: number;
};

export default function ContestScoreboard({
  data,
  tid,
  pageType,
  currentUid,
}: Props) {
  const { tdoc, rows, udict, pdict, availableViews } = data;

  return (
    <div className="space-y-4" data-llm-visible="true">
      <ScoreboardToolbar
        tid={tid}
        pageType={pageType}
        availableViews={availableViews}
        tdoc={tdoc}
      />
      {rows.length > 1 ? (
        <ScoreboardTable
          rows={rows}
          udict={udict}
          pdict={pdict}
          tid={tid}
          pageType={pageType}
          currentUid={currentUid}
        />
      ) : (
        <Empty data-llm-visible="true">
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={ClipboardIcon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle data-llm-text="暂无成绩数据">暂无成绩数据</EmptyTitle>
            <EmptyDescription data-llm-text="目前还没有人在此作业中提交题目。">
              目前还没有人在此作业中提交题目。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
