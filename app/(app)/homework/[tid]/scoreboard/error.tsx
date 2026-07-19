'use client';

import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import { useTranslations } from 'next-intl';

function getErrorKey(error: Error) {
  const msg = error.message || '';
  if (msg.includes('ContestNotLiveError')) return 'notLive';
  if (msg.includes('ContestScoreboardHiddenError')) return 'hidden';
  if (msg.includes('403') || msg.includes('ForbiddenError')) return 'forbidden';
  return 'loadError';
}

export default function ScoreboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('scoreboard.error');
  const errorKey = getErrorKey(error);
  const message = t(errorKey);

  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{message}</EmptyTitle>
        <EmptyDescription>
          {errorKey === 'loadError' ? t('checkNetwork') : undefined}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={reset}>
          {t('retry')}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
