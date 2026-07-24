import ContestRuleBadge from '@/features/contest/contest-rule-badge';
import TimeDurationBadge from '@/shared/components/time-duration-badge';
import { Badge } from '@/shared/components/ui/badge';
import type { Contest } from '@/shared/types/contest';
import type { Homework } from '@/shared/types/homework';
import { Code2, Star, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  tdoc: Contest | Homework;
};

export default function ContestTitle({ tdoc }: Props) {
  const t = useTranslations('contest');
  const homework = useTranslations('homework');
  const common = useTranslations('common');
  const problemCount = tdoc.pids?.length ?? 0;

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

        <TimeDurationBadge
          startTime={tdoc.beginAt}
          endTime={tdoc.endAt}
          durationLabel={isHomework ? homework('duration') : t('duration')}
          timeRangeLabel={isHomework ? homework('time') : t('time')}
        />

        <Badge variant="secondary" title={t('problemCount')}>
          <Code2 data-icon="inline-start" />
          <span data-llm-text={String(problemCount)} className="tabular-nums">
            {common('problems', { count: problemCount })}
          </span>
        </Badge>
      </div>
    </div>
  );
}
