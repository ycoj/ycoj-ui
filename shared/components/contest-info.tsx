import {
  CalendarCheck,
  Calendar,
  Trophy,
  Clock,
  Code2,
  Check,
  Users,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

type InfoItemProps = {
  icon: LucideIcon;
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

function InfoItem({ icon: Icon, label, value, llmText }: InfoItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="text-muted-foreground inline-flex items-center gap-1.5 shrink-0">
        <Icon className="size-4" />
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
  const t = useTranslations('contest');
  const common = useTranslations('common');
  return (
    <div className="space-y-3 px-2">
      <InfoItem icon={CalendarCheck} label={common('status')} value={status} />
      {attendedBadge && (
        <InfoItem
          icon={Check}
          label={t('registration')}
          value={attendedBadge}
        />
      )}
      <InfoItem
        icon={Trophy}
        label={t('ruleLabel')}
        value={rule}
        llmText={ruleText}
      />
      <InfoItem
        icon={Code2}
        label={t('problemCount')}
        value={common('problems', { count: problemCount })}
        llmText={String(problemCount)}
      />
      <InfoItem
        icon={Calendar}
        label={t('startTime')}
        value={beginAtText}
        llmText={beginAtText}
      />
      <InfoItem
        icon={Calendar}
        label={t('endTime')}
        value={endAtText}
        llmText={endAtText}
      />
      <InfoItem
        icon={Clock}
        label={t('duration')}
        value={durationText}
        llmText={durationText}
      />
      <InfoItem
        icon={Users}
        label={t('participants')}
        value={<span className="tabular-nums">{attend}</span>}
        llmText={String(attend)}
      />
      {showOwner && (
        <InfoItem
          icon={User}
          label={t('host')}
          value={owner ?? '-'}
          llmText={ownerText}
        />
      )}
    </div>
  );
}
