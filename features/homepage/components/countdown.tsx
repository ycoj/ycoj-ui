import type {
  CountdownConfig,
  CountdownEvent,
} from '@/api/server/method/ui/homepage';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

dayjs.extend(duration);
dayjs.extend(customParseFormat);

function EventCountdown({ event }: { event: CountdownEvent }) {
  const t = useTranslations('homepage');
  const now = dayjs();
  const start = dayjs(event.date);
  const end = start.add(event.duration, 'day');

  let status: 'pending' | 'running' | 'ended' = 'pending';
  let timeText = '';

  if (now.isBefore(start)) {
    status = 'pending';
  } else if (now.isBefore(end)) {
    status = 'running';
  } else {
    status = 'ended';
  }

  if (status !== 'ended') {
    const target = status === 'pending' ? start : end;
    const dur = dayjs.duration(target.diff(now));
    timeText =
      dur.months() > 0
        ? t('monthsDays', { months: dur.months(), days: dur.days() })
        : t('days', { days: Math.max(1, dur.days()) });
  }

  if (status === 'ended') return null;

  if (status === 'running') {
    return (
      <div data-llm-visible="true" className="text-center">
        <span
          data-llm-text={event.name}
          className="text-foreground mx-1 text-sm font-medium"
        >
          {event.name}
        </span>
        <span
          data-llm-text={t('running')}
          className="text-pink-600 ml-1 text-sm font-bold"
        >
          {t('running')}
        </span>
      </div>
    );
  }

  return (
    <div data-llm-visible="true" className="text-center">
      <span className="text-muted-foreground text-sm">
        {t('distancePrefix')}
      </span>
      <span
        data-llm-text={event.name}
        className="text-foreground mx-1 text-sm font-medium"
      >
        {event.name}
      </span>
      <span className="text-muted-foreground text-sm">
        {t('untilStartSuffix')}
      </span>
      <span
        data-llm-text={timeText}
        className="ml-1 text-sm font-bold text-primary"
      >
        {timeText}
      </span>
    </div>
  );
}

export default function Countdown({ config }: { config: CountdownConfig }) {
  const t = useTranslations('homepage');
  const events = config.events.sort(
    (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
  );
  if (!events.length) return null;

  return (
    <Card data-llm-visible="true">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-5" />
          <span data-llm-text={t('countdown')}>{t('countdown')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.map((event, index) => (
            <EventCountdown key={index} event={event} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
