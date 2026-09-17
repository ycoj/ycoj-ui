import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

// Record times are formatted in a fixed time zone so the server-rendered
// markup matches the client render; formatting in each runtime's local time
// zone causes hydration mismatches.
const RECORD_TIME_ZONE = 'Asia/Shanghai';

export function formatRecordTime(
  value: string | number | undefined,
  format = 'MM-DD HH:mm:ss'
): string {
  // dayjs(undefined) is the current time, not an invalid date.
  if (value === undefined) return '-';
  const time = dayjs(value);
  return time.isValid() ? time.tz(RECORD_TIME_ZONE).format(format) : '-';
}
