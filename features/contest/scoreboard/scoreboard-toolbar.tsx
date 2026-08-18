'use client';

import UnlockButton from './unlock-button';
import { Button } from '@/shared/components/ui/button';
import type { Contest } from '@/shared/types/contest';
import type { Homework } from '@/shared/types/homework';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = {
  tid: string;
  pageType: 'contest' | 'homework';
  availableViews?: Record<string, string>;
  tdoc: Contest | Homework;
};

export default function ScoreboardToolbar({
  tid,
  pageType,
  availableViews,
  tdoc,
}: Props) {
  const contestT = useTranslations('contest');
  const homeworkT = useTranslations('homework');
  const exportViews = availableViews
    ? Object.entries(availableViews).filter(([key]) => key !== 'default')
    : [];

  const showUnlock =
    pageType === 'contest' &&
    'lockAt' in tdoc &&
    tdoc.lockAt != null &&
    !(tdoc as Contest).unlocked &&
    new Date(tdoc.endAt) < new Date();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/${pageType}/${tid}`}>
          <ArrowLeft data-icon="inline-start" />
          {pageType === 'homework'
            ? homeworkT('backToHomework')
            : contestT('backToContest')}
        </Link>
      </Button>

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
