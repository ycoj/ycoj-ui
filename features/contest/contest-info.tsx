import {
  Appointment01Icon,
  Calendar01Icon,
  ChampionIcon,
  Clock01Icon,
  CodeSquareIcon,
  Tick02Icon,
  UserGroupIcon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import type { ReactNode } from 'react';

type InfoItemProps = {
  icon: IconSvgElement;
  label: string;
  value: ReactNode;
  llmText?: string;
};

type Props = {
  status: ReactNode;
  rule: ReactNode;
  ruleText?: string;
  problemCount: number;
  beginAtText: string;
  endAtText: string;
  durationText: string;
  attend: number;
  attendedBadge?: ReactNode;
  showOwner?: boolean;
  owner?: ReactNode;
  ownerText?: string;
};

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

export default function ContestInfo({
  status,
  rule,
  ruleText,
  problemCount,
  beginAtText,
  endAtText,
  durationText,
  attend,
  attendedBadge,
  showOwner,
  owner,
  ownerText,
}: Props) {
  return (
    <div className="space-y-3 px-2">
      <InfoItem icon={Appointment01Icon} label="状态" value={status} />
      {attendedBadge && (
        <InfoItem icon={Tick02Icon} label="报名" value={attendedBadge} />
      )}
      <InfoItem
        icon={ChampionIcon}
        label="比赛规则"
        value={rule}
        llmText={ruleText}
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
        value={<span className="tabular-nums">{attend}</span>}
        llmText={String(attend)}
      />
      {showOwner && (
        <InfoItem
          icon={UserIcon}
          label="主持人"
          value={owner ?? '-'}
          llmText={ownerText}
        />
      )}
    </div>
  );
}
