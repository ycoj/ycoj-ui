'use client';

import ContestInfo from '@/shared/components/contest-info';
import ContestRuleBadge from '@/shared/components/contest-rule-badge';
import ContestStatusBadge from '@/shared/components/contest-status';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import {
  getContestDurationParts,
  getContestStatus,
} from '@/shared/lib/contest-utils';
import type { BaseContest } from '@/shared/types/contest';
import dayjs from 'dayjs';
import { ArrowLeft } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  contest: BaseContest;
  owner?: ReactNode;
  ownerText?: string;
  attendedBadge?: ReactNode;
  showOwner?: boolean;
  showBackLink?: boolean;
  tid?: string;
};

export default function ContestInfoCard({
  contest,
  owner,
  ownerText,
  attendedBadge,
  showOwner,
  showBackLink,
  tid,
}: Props) {
  const contestT = useTranslations('contest');
  const homeworkT = useTranslations('homework');
  const format = useFormatter();

  const beginAt = dayjs(contest.beginAt);
  const endAt = dayjs(contest.endAt);
  const beginAtText = beginAt.isValid()
    ? format.dateTime(beginAt.toDate(), {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '-';
  const endAtText = endAt.isValid()
    ? format.dateTime(endAt.toDate(), {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '-';
  const parts = getContestDurationParts(contest.beginAt, contest.endAt);
  const durationText = parts
    ? parts.days > 0
      ? contestT('durationDaysHours', parts)
      : parts.hours > 0
        ? contestT('durationHoursMinutes', parts)
        : contestT('durationMinutes', parts)
    : '-';
  const problemCount = contest.pids?.length ?? 0;
  const status = getContestStatus(contest);
  const isHomework = contest.rule === 'homework';
  const resolvedTid = tid ?? contest.docId ?? contest._id;

  const backHref = isHomework
    ? `/homework/${resolvedTid}`
    : `/contest/${resolvedTid}`;
  const backText = isHomework
    ? homeworkT('backToHomework')
    : contestT('backToContest');

  return (
    <div className="w-full space-y-4" data-llm-visible="true">
      {showBackLink && resolvedTid && (
        <>
          <Button
            asChild
            className="h-10 w-full justify-start gap-3 px-4"
            variant="ghost"
          >
            <Link href={backHref}>
              <ArrowLeft strokeWidth={2} />
              <span data-llm-text={backText}>{backText}</span>
            </Link>
          </Button>
          <Separator />
        </>
      )}
      <ContestInfo
        status={<ContestStatusBadge status={status} />}
        rule={<ContestRuleBadge rule={contest.rule} />}
        ruleText={contestT(`rule.${contest.rule}`)}
        problemCount={problemCount}
        beginAtText={beginAtText}
        endAtText={endAtText}
        durationText={durationText}
        attend={contest.attend}
        attendedBadge={attendedBadge}
        showOwner={showOwner}
        owner={owner ?? (showOwner ? '-' : undefined)}
        ownerText={ownerText}
      />
    </div>
  );
}
