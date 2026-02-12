'use client';

import ClientApis from '@/api/client/method';
import type { HomeworkDetailTdoc } from '@/api/server/method/homework/detail';
import ContestInfo from '@/features/contest/contest-info';
import ContestRuleBadge from '@/features/contest/contest-rule-badge';
import ContestStatus from '@/features/contest/contest-status';
import {
  formatContestDuration,
  getContestStatus,
} from '@/features/contest/detail/contest-utils';
import UserSpan from '@/features/user/user-span';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import type { HomeworkStatus } from '@/shared/types/homework';
import type { BaseUser } from '@/shared/types/user';
import {
  Award01Icon,
  Chat01Icon,
  PlusSignSquareIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  tid: string;
  homework: HomeworkDetailTdoc;
  homeworkStatus?: HomeworkStatus | null;
  owner?: BaseUser;
};

type SidebarButtonProps = {
  href: string;
  icon: IconSvgElement;
  text: string;
};

function SidebarButton({ href, icon, text }: SidebarButtonProps) {
  return (
    <Button
      asChild
      className="h-10 w-full justify-start gap-3 px-4"
      variant="ghost"
    >
      <Link href={href}>
        <HugeiconsIcon icon={icon} strokeWidth={2} />
        <span data-llm-text={text}>{text}</span>
      </Link>
    </Button>
  );
}

export default function HomeworkSidebar({
  tid,
  homework,
  homeworkStatus,
  owner,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const status = getContestStatus(homework);
  const beginAt = dayjs(homework.beginAt);
  const endAt = dayjs(homework.endAt);
  const beginAtText = beginAt.isValid()
    ? beginAt.format('YYYY-MM-DD HH:mm')
    : '-';
  const endAtText = endAt.isValid() ? endAt.format('YYYY-MM-DD HH:mm') : '-';
  const durationText =
    formatContestDuration(homework.beginAt, homework.endAt) || '-';
  const problemCount = homework.pids?.length ?? 0;
  const isEnded = status === 'ended';
  const isAttended = Boolean(homeworkStatus?.attend);
  const attendedBadge = isAttended ? (
    <Badge
      variant="secondary"
      className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
    >
      <HugeiconsIcon icon={Tick02Icon} data-icon="inline-start" />
      <span data-llm-text="已报名">已报名</span>
    </Badge>
  ) : undefined;

  const handleAttend = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await ClientApis.Homework.attendHomework(tid, {
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
            <HugeiconsIcon icon={PlusSignSquareIcon} strokeWidth={2} />
            <span data-llm-text={submitting ? '报名中...' : '报名作业'}>
              {submitting ? '报名中...' : '报名作业'}
            </span>
          </Button>
        )}
        <SidebarButton
          href={`/homework/${tid}/scoreboard`}
          icon={Award01Icon}
          text="成绩表"
        />
        <SidebarButton href="#" icon={Chat01Icon} text="讨论" />
      </div>

      <Separator />

      <ContestInfo
        status={<ContestStatus status={status} />}
        rule={<ContestRuleBadge rule={homework.rule} />}
        problemCount={problemCount}
        beginAtText={beginAtText}
        endAtText={endAtText}
        durationText={durationText}
        attend={homework.attend}
        attendedBadge={attendedBadge}
        showOwner={true}
        owner={owner ? <UserSpan user={owner} /> : '-'}
        ownerText={owner?.uname}
      />
    </div>
  );
}
