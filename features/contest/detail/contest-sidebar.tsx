import {
  formatContestDuration,
  getContestStatus,
  getContestStatusLabel,
} from './contest-utils';
import type { ContestDetailTdoc } from '@/api/server/method/contests/detail';
import UserSpan from '@/features/user/user-span';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { RuleTexts } from '@/shared/types/contest';
import type { BaseUser } from '@/shared/types/user';
import {
  Appointment01Icon,
  Award01Icon,
  Calendar01Icon,
  ChampionIcon,
  Chat01Icon,
  Clock01Icon,
  CodeSquareIcon,
  UserGroupIcon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import dayjs from 'dayjs';
import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  tid: string;
  contest: ContestDetailTdoc;
  owner?: BaseUser;
};

type SidebarButtonProps = {
  href: string;
  icon: IconSvgElement;
  text: string;
};

type InfoItemProps = {
  icon: IconSvgElement;
  label: string;
  value: ReactNode;
  llmText?: string;
};

function SidebarButton({ href, icon, text }: SidebarButtonProps) {
  return (
    <Button
      asChild
      className="h-10 w-full justify-start gap-3 px-4"
      variant={text === '成绩表' ? 'default' : 'ghost'}
    >
      <Link href={href}>
        <HugeiconsIcon icon={icon} strokeWidth={2} />
        <span data-llm-text={text}>{text}</span>
      </Link>
    </Button>
  );
}

function InfoItem({ icon, label, value, llmText }: InfoItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="text-muted-foreground inline-flex items-center gap-1.5 shrink-0">
        <HugeiconsIcon icon={icon} className="size-4" />
        <span>{label}</span>
      </div>
      <div className="text-right" data-llm-text={llmText}>
        {value}
      </div>
    </div>
  );
}

export default function ContestSidebar({ tid, contest, owner }: Props) {
  const statusLabel = getContestStatusLabel(getContestStatus(contest));
  const ruleLabel = RuleTexts[contest.rule];
  const beginAt = dayjs(contest.beginAt);
  const endAt = dayjs(contest.endAt);
  const beginAtText = beginAt.isValid()
    ? beginAt.format('YYYY-MM-DD HH:mm')
    : '-';
  const endAtText = endAt.isValid() ? endAt.format('YYYY-MM-DD HH:mm') : '-';
  const durationText =
    formatContestDuration(contest.beginAt, contest.endAt) || '-';
  const problemCount = contest.pids?.length ?? 0;

  return (
    <div className="w-full space-y-4" data-llm-visible="true">
      <div className="space-y-1">
        <SidebarButton
          href={`/contest/${tid}/scoreboard`}
          icon={Award01Icon}
          text="成绩表"
        />
        <SidebarButton href="#" icon={Chat01Icon} text="讨论" />
      </div>

      <Separator />

      <div className="space-y-3">
        <InfoItem
          icon={Appointment01Icon}
          label="状态"
          value={statusLabel}
          llmText={statusLabel}
        />
        <InfoItem
          icon={ChampionIcon}
          label="比赛规则"
          value={ruleLabel}
          llmText={ruleLabel}
        />
        <InfoItem
          icon={CodeSquareIcon}
          label="题目数量"
          value={`${problemCount} 道题`}
          llmText={String(problemCount)}
        />
        <InfoItem
          icon={Calendar01Icon}
          label="开始时间"
          value={beginAtText}
          llmText={beginAtText}
        />
        <InfoItem
          icon={Calendar01Icon}
          label="结束时间"
          value={endAtText}
          llmText={endAtText}
        />
        <InfoItem
          icon={Clock01Icon}
          label="持续时间"
          value={durationText}
          llmText={durationText}
        />
        <InfoItem
          icon={UserGroupIcon}
          label="参赛人数"
          value={<span className="tabular-nums">{contest.attend}</span>}
          llmText={String(contest.attend)}
        />
        <InfoItem
          icon={UserIcon}
          label="主持人"
          value={owner ? <UserSpan user={owner} /> : '-'}
          llmText={owner?.uname}
        />
      </div>
    </div>
  );
}
