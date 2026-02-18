'use client';

import { formatContestDuration, getContestStatus } from './contest-utils';
import ClientApis from '@/api/client/method';
import type {
  ContestDetailStatus,
  ContestDetailTdoc,
} from '@/api/server/method/contests/detail';
import ContestInfo from '@/features/contest/contest-info';
import ContestRuleBadge from '@/features/contest/contest-rule-badge';
import ContestStatus from '@/features/contest/contest-status';
import UserSpan from '@/features/user/user-span';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import type { BaseUser } from '@/shared/types/user';
import dayjs from 'dayjs';
import {
  Award,
  MessageCircle,
  PlusSquare,
  Check,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  tid: string;
  contest: ContestDetailTdoc;
  contestStatus?: ContestDetailStatus | null;
  owner?: BaseUser;
};

type SidebarButtonProps = {
  href: string;
  icon: LucideIcon;
  text: string;
};

function SidebarButton({ href, icon: Icon, text }: SidebarButtonProps) {
  return (
    <Button
      asChild
      className="h-10 w-full justify-start gap-3 px-4"
      variant="ghost"
    >
      <Link href={href}>
        <Icon strokeWidth={2} />
        <span data-llm-text={text}>{text}</span>
      </Link>
    </Button>
  );
}

export default function ContestSidebar({
  tid,
  contest,
  contestStatus,
  owner,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const status = getContestStatus(contest);
  const beginAt = dayjs(contest.beginAt);
  const endAt = dayjs(contest.endAt);
  const beginAtText = beginAt.isValid()
    ? beginAt.format('YYYY-MM-DD HH:mm')
    : '-';
  const endAtText = endAt.isValid() ? endAt.format('YYYY-MM-DD HH:mm') : '-';
  const durationText =
    formatContestDuration(contest.beginAt, contest.endAt) || '-';
  const problemCount = contest.pids?.length ?? 0;
  const isEnded = status === 'ended';
  const isAttended = Boolean(contestStatus?.attend);
  const attendedBadge = isAttended ? (
    <Badge
      variant="secondary"
      className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
    >
      <Check data-icon="inline-start" />
      <span data-llm-text="已报名">已报名</span>
    </Badge>
  ) : undefined;

  const handleAttend = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await ClientApis.Contest.attendContest(tid, {
        operation: 'attend',
      }).send();
      router.refresh();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4" data-llm-visible="true">
      <div className="space-y-1">
        {!isEnded && !isAttended && (
          <Button
            className="h-10 w-full justify-start gap-3 px-4"
            onClick={handleAttend}
            disabled={submitting}
          >
            <PlusSquare strokeWidth={2} />
            <span data-llm-text={submitting ? '报名中...' : '报名比赛'}>
              {submitting ? '报名中...' : '报名比赛'}
            </span>
          </Button>
        )}
        <SidebarButton
          href={`/contest/${tid}/scoreboard`}
          icon={Award}
          text="成绩表"
        />
        <SidebarButton href="#" icon={MessageCircle} text="讨论" />
      </div>

      <Separator />

      <ContestInfo
        status={<ContestStatus status={status} />}
        rule={<ContestRuleBadge rule={contest.rule} />}
        problemCount={problemCount}
        beginAtText={beginAtText}
        endAtText={endAtText}
        durationText={durationText}
        attend={contest.attend}
        attendedBadge={attendedBadge}
        showOwner={true}
        owner={owner ? <UserSpan user={owner} /> : '-'}
        ownerText={owner?.uname}
      />
    </div>
  );
}
