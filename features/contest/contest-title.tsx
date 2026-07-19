import ContestRuleBadge from '@/features/contest/contest-rule-badge';
import { getContestDurationParts } from '@/features/contest/detail/contest-utils';
import { Badge } from '@/shared/components/ui/badge';
import type { Contest } from '@/shared/types/contest';
import type { Homework } from '@/shared/types/homework';
import dayjs from 'dayjs';
import { Calendar, Clock, Code2, Star, Users } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

type Props = {
  tdoc: Contest | Homework;
};

export default function ContestTitle({ tdoc }: Props) {
  const t = useTranslations('contest');
  const homework = useTranslations('homework');
  const common = useTranslations('common');
  const format = useFormatter();
  const parts = getContestDurationParts(tdoc.beginAt, tdoc.endAt);
  const durationText = parts
    ? parts.days > 0
      ? t('durationDaysHours', parts)
      : parts.hours > 0
        ? t('durationHoursMinutes', parts)
        : t('durationMinutes', parts)
    : '';
  const problemCount = tdoc.pids?.length ?? 0;
  const beginAt = dayjs(tdoc.beginAt);
  const endAt = dayjs(tdoc.endAt);
  const timeText =
    beginAt.isValid() && endAt.isValid()
      ? `${format.dateTime(beginAt.toDate(), { dateStyle: 'medium', timeStyle: 'short' })} ~ ${format.dateTime(endAt.toDate(), { dateStyle: 'medium', timeStyle: 'short' })}`
      : '';

  const isHomework = tdoc.rule === 'homework';
  const hasRated = 'rated' in tdoc && tdoc.rated;

  return (
    <div
      data-llm-visible="true"
      className="space-y-3"
      data-llm-text={tdoc.title}
    >
      <h1 className="wrap-break-word text-2xl leading-snug font-medium">
        {tdoc.title}
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        {hasRated && (
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
            title={t('rated')}
          >
            <Star data-icon="inline-start" />
            <span data-llm-text={t('rated')}>{t('rated')}</span>
          </Badge>
        )}

        <ContestRuleBadge rule={tdoc.rule} />

        <Badge
          variant="secondary"
          title={isHomework ? homework('participants') : t('participants')}
        >
          <Users data-icon="inline-start" />
          <span data-llm-text={String(tdoc.attend)} className="tabular-nums">
            {tdoc.attend}
          </span>
        </Badge>

        {durationText && (
          <Badge
            variant="secondary"
            title={isHomework ? homework('duration') : t('duration')}
          >
            <Clock data-icon="inline-start" />
            <span data-llm-text={durationText} className="tabular-nums">
              {durationText}
            </span>
          </Badge>
        )}

        <Badge variant="secondary" title={t('problemCount')}>
          <Code2 data-icon="inline-start" />
          <span data-llm-text={String(problemCount)} className="tabular-nums">
            {common('problems', { count: problemCount })}
          </span>
        </Badge>

        {timeText && (
          <div className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
            <Calendar className="size-4" />
            <span data-llm-text={timeText}>{timeText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
