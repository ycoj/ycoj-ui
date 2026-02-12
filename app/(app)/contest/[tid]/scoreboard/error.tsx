'use client';

import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/shared/components/ui/empty';

function getErrorMessage(error: Error): string {
  const msg = error.message || '';
  if (msg.includes('ContestNotLiveError')) return '比赛尚未开始';
  if (msg.includes('ContestScoreboardHiddenError')) return '成绩表暂不可见';
  if (msg.includes('403') || msg.includes('ForbiddenError'))
    return '权限不足，无法查看成绩表';
  return '加载成绩表时出错';
}

export default function ScoreboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = getErrorMessage(error);

  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{message}</EmptyTitle>
        <EmptyDescription>
          {message === '加载成绩表时出错' ? '请检查网络连接后重试' : undefined}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={reset}>
          重试
        </Button>
      </EmptyContent>
    </Empty>
  );
}
