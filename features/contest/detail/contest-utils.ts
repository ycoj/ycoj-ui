import type { ContestDetailTdoc } from '@/api/server/method/contests/detail';
import type { ContestStatus } from '@/features/contest/contest-status';
import dayjs from 'dayjs';

export function getContestStatus(
  contest: ContestDetailTdoc,
  now = dayjs()
): ContestStatus {
  const beginAt = dayjs(contest.beginAt);
  const endAt = dayjs(contest.endAt);

  if (!beginAt.isValid() || !endAt.isValid()) return 'ended';
  if (now.isBefore(beginAt)) return 'pending';
  if (now.isBefore(endAt)) return 'running';
  return 'ended';
}

export function formatContestDuration(
  beginAtValue: Date | string,
  endAtValue: Date | string
) {
  const beginAt = dayjs(beginAtValue);
  const endAt = dayjs(endAtValue);
  if (!beginAt.isValid() || !endAt.isValid()) return '';

  const totalMinutes = endAt.diff(beginAt, 'minute');
  if (totalMinutes <= 0) return '';

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    if (hours > 0) return `${days} 天 ${hours} 小时`;
    return `${days} 天`;
  }

  if (hours > 0) {
    if (minutes > 0) return `${hours} 小时 ${minutes} 分钟`;
    return `${hours} 小时`;
  }

  return `${minutes} 分钟`;
}
