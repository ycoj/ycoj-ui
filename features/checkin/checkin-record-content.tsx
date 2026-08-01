import { formatHitokotoSource } from './checkin-utils';
import { CHECKIN_FORTUNE_STYLES } from '@/shared/configs/checkin';
import { cn } from '@/shared/lib/utils';
import type { CheckinRecord } from '@/shared/types/checkin';
import { useTranslations } from 'next-intl';

type Props = {
  record: CheckinRecord;
  compact?: boolean;
};

export default function CheckinRecordContent({ record, compact }: Props) {
  const t = useTranslations('checkin');
  const source = formatHitokotoSource(record);

  return (
    <div
      className={cn(
        'space-y-3 text-center',
        compact && 'space-y-1.5 text-left'
      )}
      data-llm-visible="true"
    >
      <p
        className={cn(
          'font-semibold tracking-[0.18em]',
          compact ? 'text-base' : 'text-3xl',
          CHECKIN_FORTUNE_STYLES[record.fortune].text
        )}
        data-llm-text={t(`fortune.${record.fortune}`)}
      >
        {t(`fortune.${record.fortune}`)}
      </p>
      <div
        className={cn(
          'text-foreground/85',
          compact ? 'text-xs leading-relaxed' : 'text-sm leading-6'
        )}
      >
        <p data-llm-text={record.hitokoto.text}>“{record.hitokoto.text}”</p>
      </div>
      {source && (
        <p
          className={cn(
            'text-muted-foreground',
            compact ? 'text-[11px]' : 'text-xs'
          )}
          data-llm-text={source}
        >
          {source}
        </p>
      )}
    </div>
  );
}
