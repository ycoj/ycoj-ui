'use client';

import ContestManagementNav from './contest-management-nav';
import ContestInfo from '@/features/contest/contest-info';
import ContestRuleBadge from '@/features/contest/contest-rule-badge';
import ContestStatus from '@/features/contest/contest-status';
import {
  getContestDurationParts,
  getContestStatus,
} from '@/features/contest/detail/contest-utils';
import UserSpan from '@/features/user/user-span';
import { Separator } from '@/shared/components/ui/separator';
import type { Contest } from '@/shared/types/contest';
import type { BaseUser } from '@/shared/types/user';
import dayjs from 'dayjs';
import { useFormatter, useTranslations } from 'next-intl';

type Props = { tid: string; contest: Contest; owner?: BaseUser };

export default function ContestManagementSidebar({
  tid,
  contest,
  owner,
}: Props) {
  const t = useTranslations('contest');
  const format = useFormatter();
  const durationParts = getContestDurationParts(contest.beginAt, contest.endAt);
  const durationText = durationParts
    ? durationParts.days > 0
      ? t('durationDaysHours', durationParts)
      : durationParts.hours > 0
        ? t('durationHoursMinutes', durationParts)
        : t('durationMinutes', durationParts)
    : '-';
  const date = (value: Date) =>
    format.dateTime(dayjs(value).toDate(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  return (
    <aside className="space-y-4" data-llm-visible="true">
      <ContestManagementNav tid={tid} showReturn />
      <Separator />
      <ContestInfo
        status={<ContestStatus status={getContestStatus(contest)} />}
        rule={<ContestRuleBadge rule={contest.rule} />}
        problemCount={contest.pids.length}
        beginAtText={date(contest.beginAt)}
        endAtText={date(contest.endAt)}
        durationText={durationText}
        attend={contest.attend}
        showOwner
        owner={owner ? <UserSpan user={owner} /> : '-'}
        ownerText={owner?.uname}
      />
    </aside>
  );
}
