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

dayjs.extend(duration);
dayjs.extend(customParseFormat);

function EventCountdown({ event }: { event: CountdownEvent }) {
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
    timeText = dur.format(dur.months() > 0 ? 'M [月] D [天]' : 'D [天]');
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
          data-llm-text="正在进行中"
          className="text-pink-600 ml-1 text-sm font-bold"
        >
          正在进行中
        </span>
      </div>
    );
  }

  return (
    <div data-llm-visible="true" className="text-center">
      <span className="text-muted-foreground text-sm">距离 </span>
      <span
        data-llm-text={event.name}
        className="text-foreground mx-1 text-sm font-medium"
      >
        {event.name}
      </span>
      <span className="text-muted-foreground text-sm">开始还剩 </span>
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
  const events = config.events.sort(
    (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
  );
  if (!events.length) return null;

  return (
    <Card data-llm-visible="true">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-5" />
          <span data-llm-text="倒计时">倒计时</span>
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
