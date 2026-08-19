import dayjs, { type Dayjs } from 'dayjs';

export type ContestTimerContest = {
  beginAt: Date | string;
  endAt: Date | string;
  duration?: number;
};

export type ContestTimerStatus = {
  startAt?: Date | string;
  endAt?: Date | string;
};

export type ContestTimerState = {
  startAt: Dayjs;
  endAt: Dayjs;
  progress: number;
  remainingSeconds: number;
};

export function getContestTimerState(
  contest: ContestTimerContest,
  status: ContestTimerStatus | null | undefined,
  nowValue: Date | string | number = Date.now()
): ContestTimerState | null {
  const startValue =
    contest.duration && status?.startAt ? status.startAt : contest.beginAt;
  const endValue = status?.endAt ?? contest.endAt;
  const startAt = dayjs(startValue);
  const endAt = dayjs(endValue);
  const now = dayjs(nowValue);

  if (!startAt.isValid() || !endAt.isValid() || !now.isValid()) return null;

  const totalMilliseconds = endAt.diff(startAt);
  if (totalMilliseconds <= 0 || now.isBefore(startAt) || !now.isBefore(endAt)) {
    return null;
  }

  return {
    startAt,
    endAt,
    progress: Math.min(1, Math.max(0, now.diff(startAt) / totalMilliseconds)),
    remainingSeconds: Math.max(0, Math.ceil(endAt.diff(now) / 1000)),
  };
}

export function formatContestCountdown(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  const time = [hours, minutes, remaining]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');

  return days > 0 ? `${days}d ${time}` : time;
}
