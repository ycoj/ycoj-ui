'use client';

import ContestInfo from '@/features/contest/contest-info';
import ContestRuleBadge from '@/features/contest/contest-rule-badge';
import ContestStatus from '@/features/contest/contest-status';
import { getContestStatus } from '@/features/contest/detail/contest-utils';
import UserSpan from '@/features/user/user-span';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import type { Contest } from '@/shared/types/contest';
import type { BaseUser } from '@/shared/types/user';
import dayjs from 'dayjs';
import {
  ClipboardList,
  Eye,
  FileArchive,
  MessageSquare,
  Pencil,
  Send,
  Users,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = { tid: string; contest: Contest; owner?: BaseUser };

export default function ContestManagementSidebar({
  tid,
  contest,
  owner,
}: Props) {
  const t = useTranslations('contestManagement');
  const format = useFormatter();
  const links = [
    [Eye, t('view'), `/contest/${tid}`],
    [ClipboardList, t('management'), `/contest/${tid}/management`],
    [Pencil, t('edit'), `/contest/${tid}/edit`],
    [Users, t('attendees'), `/contest/${tid}/user`],
    [MessageSquare, t('clarifications'), `/contest/${tid}/clarification`],
    [Send, t('balloons'), `/contest/${tid}/balloon`],
    [FileArchive, t('bulkSubmit'), `/contest/${tid}/bulk-submit`],
  ] as const;
  const date = (value: Date) =>
    format.dateTime(dayjs(value).toDate(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  return (
    <aside className="space-y-4" data-llm-visible="true">
      <nav className="space-y-1">
        {links.map(([Icon, label, href]) => (
          <Button
            key={href}
            asChild
            variant="ghost"
            className="h-9 w-full justify-start gap-2"
          >
            <Link href={href}>
              <Icon className="size-4" />
              <span data-llm-text={label}>{label}</span>
            </Link>
          </Button>
        ))}
      </nav>
      <Separator />
      <ContestInfo
        status={<ContestStatus status={getContestStatus(contest)} />}
        rule={<ContestRuleBadge rule={contest.rule} />}
        problemCount={contest.pids.length}
        beginAtText={date(contest.beginAt)}
        endAtText={date(contest.endAt)}
        durationText={`${contest.duration}h`}
        attend={contest.attend}
        showOwner
        owner={owner ? <UserSpan user={owner} /> : '-'}
        ownerText={owner?.uname}
      />
    </aside>
  );
}
