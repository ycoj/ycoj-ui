'use client';

import ClientApis from '@/api/client/method';
import CheckinRecordContent from '@/features/checkin/checkin-record-content';
import { parseCheckinDate } from '@/features/checkin/checkin-utils';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import type { HomepageCheckin } from '@/shared/types/checkin';
import { CalendarCheck2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

type Props = {
  checkin: HomepageCheckin;
  username: string;
};

function isHitokotoError(error: unknown): boolean {
  if (
    error instanceof Error &&
    error.message.toLowerCase().includes('hitokoto')
  ) {
    return true;
  }
  if (!error || typeof error !== 'object') return false;
  const values = Object.values(error as Record<string, unknown>);
  return values.some(
    (value) =>
      typeof value === 'string' && value.toLowerCase().includes('hitokoto')
  );
}

export default function DailyCheckin({ checkin, username }: Props) {
  const t = useTranslations('checkin');
  const locale = useLocale();
  const [record, setRecord] = useState(checkin.record);
  const [streak, setStreak] = useState(checkin.streak);
  const previousCheckinDate = useRef(checkin.date);
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<'error' | 'hitokotoError' | null>(
    null
  );
  const requestInFlight = useRef(false);

  useEffect(() => {
    if (previousCheckinDate.current === checkin.date) return;
    previousCheckinDate.current = checkin.date;
    setRecord(checkin.record);
    setStreak(checkin.streak);
  }, [checkin.date, checkin.record, checkin.streak]);

  const date = parseCheckinDate(checkin.date);
  const day = checkin.date.slice(-2);
  const month = date
    ? new Intl.DateTimeFormat(locale, {
        month: locale.startsWith('zh') ? 'long' : 'short',
        timeZone: 'UTC',
      }).format(date)
    : checkin.date.slice(5, 7);
  const weekday = date
    ? new Intl.DateTimeFormat(locale, {
        weekday: locale.startsWith('zh') ? 'long' : 'short',
        timeZone: 'UTC',
      }).format(date)
    : '';

  const handleCheckin = async () => {
    if (requestInFlight.current || record || !checkin.canCheckin) return;
    requestInFlight.current = true;
    setSubmitting(true);
    setErrorKey(null);
    try {
      const response = await ClientApis.Checkin.checkin().send();
      setRecord(response.record);
      setStreak(response.streak);
    } catch (error) {
      setErrorKey(isHitokotoError(error) ? 'hitokotoError' : 'error');
    } finally {
      requestInFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Card
      role="region"
      aria-label={t('title')}
      className="relative"
      data-llm-visible="true"
    >
      <CardContent className="space-y-4 text-center">
        <p className="min-w-0 text-sm">
          {t.rich('welcome', {
            username: () => (
              <span
                className="font-medium text-primary break-all"
                data-llm-text={username}
              >
                {username}
              </span>
            ),
          })}
        </p>

        {!record && (
          <div
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-emerald-700 dark:text-emerald-400"
            aria-label={t('dateAria', { date: checkin.date, weekday })}
          >
            <span className="justify-self-end text-sm font-medium">
              {month}
            </span>
            <span className="text-6xl leading-none font-black tracking-tight tabular-nums">
              {day}
            </span>
            <span className="justify-self-start text-sm font-medium">
              {weekday}
            </span>
          </div>
        )}

        {record && <CheckinRecordContent record={record} streak={streak} />}

        {!record && checkin.canCheckin && (
          <Button
            type="button"
            size="lg"
            onClick={handleCheckin}
            disabled={submitting}
            className="min-w-32 bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-400 dark:bg-orange-500 dark:hover:bg-orange-400"
          >
            <CalendarCheck2 aria-hidden="true" />
            <span data-llm-text={submitting ? t('checkingIn') : t('button')}>
              {submitting ? t('checkingIn') : t('button')}
            </span>
          </Button>
        )}
        {!record && !checkin.canCheckin && (
          <p
            className="text-sm text-muted-foreground"
            data-llm-text={t('unavailable')}
          >
            {t('unavailable')}
          </p>
        )}
        {errorKey && (
          <p
            role="alert"
            className="text-sm text-destructive"
            data-llm-text={t(errorKey)}
          >
            {t(errorKey)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
