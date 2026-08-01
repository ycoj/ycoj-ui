'use client';

import {
  formatHitokotoSource,
  listCheckinDates,
} from '@/features/checkin/checkin-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import {
  CHECKIN_FORTUNES,
  CHECKIN_FORTUNE_STYLES,
} from '@/shared/configs/checkin';
import { cn } from '@/shared/lib/utils';
import type { CheckinHistory, CheckinRecord } from '@/shared/types/checkin';
import { CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useMemo, useRef, useState } from 'react';

type Props = {
  history: CheckinHistory;
};

function DayDetails({
  date,
  record,
}: {
  date: string;
  record?: CheckinRecord;
}) {
  const t = useTranslations('checkin');
  if (!record) {
    return (
      <div className="space-y-1" data-llm-visible="true">
        <p className="font-medium tabular-nums" data-llm-text={date}>
          {date}
        </p>
        <p
          className="text-muted-foreground"
          data-llm-text={t('dayNotCheckedIn')}
        >
          {t('dayNotCheckedIn')}
        </p>
      </div>
    );
  }

  const source = formatHitokotoSource(record);
  return (
    <div className="max-w-64 space-y-1.5" data-llm-visible="true">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium tabular-nums" data-llm-text={date}>
          {date}
        </p>
        <p
          className={cn(
            'font-medium',
            CHECKIN_FORTUNE_STYLES[record.fortune].text
          )}
          data-llm-text={t(`fortune.${record.fortune}`)}
        >
          {t(`fortune.${record.fortune}`)}
        </p>
      </div>
      <p className="leading-relaxed" data-llm-text={record.hitokoto.text}>
        {record.hitokoto.text}
      </p>
      {source && (
        <p className="text-muted-foreground" data-llm-text={source}>
          {source}
        </p>
      )}
    </div>
  );
}

export default function CheckinHeatmap({ history }: Props) {
  const t = useTranslations('checkin');
  const cellRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusedCellIndex, setFocusedCellIndex] = useState(0);
  const cells = useMemo(() => {
    const recordByDate = new Map(
      history.records.map((record) => [record.date, record])
    );
    return listCheckinDates(history.from, history.to).map((date) => ({
      date,
      record: recordByDate.get(date),
    }));
  }, [history.from, history.records, history.to]);

  const tabStopIndex = Math.min(
    focusedCellIndex,
    Math.max(0, cells.length - 1)
  );

  const handleCellKeyDown = (
    event: KeyboardEvent<HTMLSpanElement>,
    index: number
  ) => {
    const rowCount = 5;
    const row = index % rowCount;
    const column = Math.floor(index / rowCount);
    const columnCount = Math.ceil(cells.length / rowCount);
    let nextIndex = index;

    switch (event.key) {
      case 'ArrowLeft':
        if (column > 0) nextIndex -= rowCount;
        break;
      case 'ArrowRight':
        if (column < columnCount - 1 && index + rowCount < cells.length) {
          nextIndex += rowCount;
        }
        break;
      case 'ArrowUp':
        if (row > 0) nextIndex -= 1;
        break;
      case 'ArrowDown':
        if (row < rowCount - 1 && index + 1 < cells.length) nextIndex += 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    setFocusedCellIndex(nextIndex);
    cellRefs.current[nextIndex]?.focus();
  };

  return (
    <section className="space-y-3" data-llm-visible="true">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-base font-medium">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span data-llm-text={t('historyTitle')}>{t('historyTitle')}</span>
        </h2>
        <p
          className="text-sm text-muted-foreground"
          data-llm-text={t('totalDays', { count: history.total })}
        >
          {t('totalDays', { count: history.total })}
        </p>
      </div>

      <div className="rounded-lg border p-3">
        <div
          className="flex justify-end overflow-hidden"
          aria-label={t('heatmapLabel', {
            from: history.from,
            to: history.to,
          })}
        >
          <TooltipProvider delayDuration={150}>
            <div
              className="grid w-max shrink-0 grid-flow-col auto-cols-[24px] grid-rows-5 gap-1"
              role="grid"
            >
              {cells.map((cell, index) => {
                const ariaLabel = cell.record
                  ? t('checkedDayAria', {
                      date: cell.date,
                      fortune: t(`fortune.${cell.record.fortune}`),
                      hitokoto: cell.record.hitokoto.text,
                    })
                  : t('emptyDayAria', { date: cell.date });
                return (
                  <Tooltip key={cell.date}>
                    <TooltipTrigger asChild>
                      <span
                        ref={(element) => {
                          cellRefs.current[index] = element;
                        }}
                        role="gridcell"
                        tabIndex={tabStopIndex === index ? 0 : -1}
                        aria-label={ariaLabel}
                        onFocus={() => setFocusedCellIndex(index)}
                        onKeyDown={(event) => handleCellKeyDown(event, index)}
                        className={cn(
                          'size-6 rounded-[3px] border border-black/5 transition-shadow hover:ring-2 hover:ring-inset hover:ring-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                          cell.record
                            ? CHECKIN_FORTUNE_STYLES[cell.record.fortune].cell
                            : 'bg-muted dark:bg-muted/70'
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="p-3" sideOffset={6}>
                      <DayDetails date={cell.date} record={cell.record} />
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>

        <div
          className="mt-3 flex flex-wrap items-center justify-end gap-x-3 gap-y-2 border-t pt-3"
          aria-label={t('legend')}
        >
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <span className="size-3 rounded-[3px] border bg-muted" />
            {t('noRecord')}
          </span>
          {CHECKIN_FORTUNES.map((fortune) => (
            <span
              key={fortune}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground"
            >
              <span
                className={cn(
                  'size-3 rounded-[3px] border border-black/5',
                  CHECKIN_FORTUNE_STYLES[fortune].cell
                )}
              />
              <span data-llm-text={t(`fortune.${fortune}`)}>
                {t(`fortune.${fortune}`)}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
