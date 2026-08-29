'use client';

import ClientApis from '@/api/client/method';
import type { HomeworkDetailTdoc } from '@/api/server/method/homework/detail';
import ContestInfo from '@/features/contest/contest-info';
import ContestRuleBadge from '@/features/contest/contest-rule-badge';
import ContestStatus from '@/features/contest/contest-status';
import {
  getContestDurationParts,
  getContestStatus,
} from '@/features/contest/detail/contest-utils';
import UserSpan from '@/features/user/user-span';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import type { HomeworkStatus } from '@/shared/types/homework';
import type { BaseUser } from '@/shared/types/user';
import dayjs from 'dayjs';
import {
  Award,
  MessageCircle,
  Pencil,
  PlusSquare,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  tid: string;
  homework: HomeworkDetailTdoc;
  homeworkStatus?: HomeworkStatus | null;
  owner?: BaseUser;
  canEdit: boolean;
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

export default function HomeworkSidebar({
  tid,
  homework,
  homeworkStatus,
  owner,
  canEdit,
}: Props) {
  const t = useTranslations('homework');
  const contestT = useTranslations('contest');
  const common = useTranslations('common');
  const format = useFormatter();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const status = getContestStatus(homework);
  const beginAt = dayjs(homework.beginAt);
  const endAt = dayjs(homework.endAt);
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
  const parts = getContestDurationParts(homework.beginAt, homework.endAt);
  const durationText = parts
    ? parts.days > 0
      ? contestT('durationDaysHours', parts)
      : parts.hours > 0
        ? contestT('durationHoursMinutes', parts)
        : contestT('durationMinutes', parts)
    : '-';
  const problemCount = homework.pids?.length ?? 0;
  const isEnded = status === 'ended';
  const isAttended = Boolean(homeworkStatus?.attend);
  const attendedBadge = isAttended ? (
    <Badge
      variant="secondary"
      className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
    >
      <Check data-icon="inline-start" />
      <span data-llm-text={t('registered')}>{t('registered')}</span>
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
            <PlusSquare strokeWidth={2} />
            <span data-llm-text={submitting ? t('registering') : t('register')}>
              {submitting ? t('registering') : t('register')}
            </span>
          </Button>
        )}
        <SidebarButton
          href={`/homework/${tid}/scoreboard`}
          icon={Award}
          text={contestT('scoreboard')}
        />
        <SidebarButton
          href="#"
          icon={MessageCircle}
          text={common('discussion')}
        />
        {canEdit && (
          <SidebarButton
            href={`/homework/${tid}/edit`}
            icon={Pencil}
            text={common('edit')}
          />
        )}
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
