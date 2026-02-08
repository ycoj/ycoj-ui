import type { ContestDetailTdoc } from '@/api/server/method/contests/detail';
import { cn } from '@/shared/lib/utils';
import dayjs from 'dayjs';

export type ContestRuntimeStatus = 'running' | 'pending' | 'ended';

export function getContestStatus(
  contest: ContestDetailTdoc,
  now = dayjs()
): ContestRuntimeStatus {
  const beginAt = dayjs(contest.beginAt);
  const endAt = dayjs(contest.endAt);

  if (!beginAt.isValid() || !endAt.isValid()) return 'ended';
  if (now.isBefore(beginAt)) return 'pending';
  if (now.isBefore(endAt)) return 'running';
  return 'ended';
}

export function getContestStatusLabel(status: ContestRuntimeStatus) {
  if (status === 'running') return '进行中';
  if (status === 'pending') return '即将开始';
  return '已结束';
}

export function getContestStatusClassName(status: ContestRuntimeStatus) {
  return cn(
    'bg-muted text-muted-foreground',
    status === 'running' && 'bg-pink-100 text-pink-700',
    status === 'pending' && 'bg-blue-100 text-blue-600'
  );
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
