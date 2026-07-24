'use client';

import { getContestDurationParts } from '@/features/contest/detail/contest-utils';
import { Badge } from '@/shared/components/ui/badge';
import dayjs from 'dayjs';
import { Calendar, Clock } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

type TimeDurationBadgeProps = {
  startTime: Date | string;
  endTime?: Date | string;
  duration?: number;
  showDuration?: boolean;
  showTimeRange?: boolean;
  dateStyle?: 'medium' | 'short';
  durationLabel?: string;
  timeRangeLabel?: string;
  className?: string;
};

export default function TimeDurationBadge({
  startTime,
  endTime,
  duration: durationHours,
  showDuration = true,
  showTimeRange = true,
  dateStyle = 'medium',
  durationLabel,
  timeRangeLabel,
  className,
}: TimeDurationBadgeProps) {
  const t = useTranslations('contest');
  const format = useFormatter();

  const beginAt = dayjs(startTime);
  if (!beginAt.isValid()) return null;

  const resolvedEndTime =
    endTime != null
      ? dayjs(endTime)
      : durationHours != null
        ? beginAt.add(durationHours, 'hour')
        : null;

  const timeText =
    beginAt.isValid() && resolvedEndTime?.isValid()
      ? `${format.dateTime(beginAt.toDate(), { dateStyle, timeStyle: 'short' })} ~ ${format.dateTime(resolvedEndTime.toDate(), { dateStyle, timeStyle: 'short' })}`
      : '';

  const parts = getContestDurationParts(
    beginAt.toDate(),
    resolvedEndTime?.toDate() ?? beginAt.toDate()
  );
  const durationText = parts
    ? parts.days > 0
      ? t('durationDaysHours', parts)
      : parts.hours > 0
        ? t('durationHoursMinutes', parts)
        : t('durationMinutes', parts)
    : '';

  if (!timeText && !durationText) return null;

  const durationBadge = showDuration && durationText && (
    <Badge
      variant="secondary"
      title={durationLabel ?? t('duration')}
      className={className}
    >
      <Clock data-icon="inline-start" />
      <span data-llm-text={durationText} className="tabular-nums">
        {durationText}
      </span>
    </Badge>
  );

  const timeRangeBadge = showTimeRange && timeText && (
    <Badge
      variant="secondary"
      title={timeRangeLabel ?? t('time')}
      className={className}
    >
      <Calendar data-icon="inline-start" />
      <span data-llm-text={timeText} className="tabular-nums">
        {timeText}
      </span>
    </Badge>
  );

  return (
    <>
      {durationBadge}
      {timeRangeBadge}
    </>
  );
}
