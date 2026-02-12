'use client';

import UnlockButton from './unlock-button';
import { Button } from '@/shared/components/ui/button';
import type { Contest } from '@/shared/types/contest';
import type { Homework } from '@/shared/types/homework';

type Props = {
  tid: string;
  pageType: 'contest' | 'homework';
  availableViews: Record<string, string>;
  tdoc: Contest | Homework;
};

export default function ScoreboardToolbar({
  tid,
  pageType,
  availableViews,
  tdoc,
}: Props) {
  const exportViews = Object.entries(availableViews).filter(
    ([key]) => key !== 'default'
  );

  const showUnlock =
    pageType === 'contest' &&
    'lockAt' in tdoc &&
    tdoc.lockAt != null &&
    !(tdoc as Contest).unlocked &&
    new Date(tdoc.endAt) < new Date();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {exportViews.map(([key, label]) => (
        <Button key={key} variant="outline" size="sm" asChild>
          <a
            href={`/api/${pageType}/${tid}/scoreboard/${key}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {label}
          </a>
        </Button>
      ))}

      {showUnlock && <UnlockButton tid={tid} />}
    </div>
  );
}
