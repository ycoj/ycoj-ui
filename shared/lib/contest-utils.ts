import { hasPerm, PERM } from '@/features/user/lib/priv';
import type { BaseContest, ContestRule } from '@/shared/types/contest';
import type { User } from '@/shared/types/user';
import dayjs from 'dayjs';

export type ContestStatus = 'running' | 'pending' | 'ended';

export type ContestLike = Pick<BaseContest, 'rule' | 'owner'> & {
  // allow both Date and string from serialization
  beginAt: Date | string;
  endAt: Date | string;
};

export function getContestProblemLabel(index: number) {
  if (!Number.isInteger(index) || index < 0) return '';

  let value = index + 1;
  let label = '';
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

export function getContestStatus(
  contest: { beginAt: Date | string; endAt: Date | string },
  now = dayjs()
): ContestStatus {
  const beginAt = dayjs(contest.beginAt);
  const endAt = dayjs(contest.endAt);

  if (!beginAt.isValid() || !endAt.isValid()) return 'ended';
  if (now.isBefore(beginAt)) return 'pending';
  if (now.isBefore(endAt)) return 'running';
  return 'ended';
}

export function getContestDurationParts(
  beginAtValue: Date | string,
  endAtValue: Date | string
) {
  const beginAt = dayjs(beginAtValue);
  const endAt = dayjs(endAtValue);
  if (!beginAt.isValid() || !endAt.isValid()) return null;

  const totalMinutes = endAt.diff(beginAt, 'minute');
  if (totalMinutes <= 0) return null;

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
}

// OI contests keep the scoreboard hidden until they end, so only the owner or
// users with the hidden-scoreboard permission may open it.
export function canShowContestScoreboard(
  contest: Pick<BaseContest, 'rule' | 'owner'> & { rule: ContestRule },
  user: User
) {
  if (contest.rule !== 'oi') return true;
  return (
    user._id === contest.owner ||
    hasPerm(user, PERM.PERM_VIEW_CONTEST_HIDDEN_SCOREBOARD)
  );
}
