import avatarUrl from './avatar-url';
import type { BaseUser } from '@/shared/types/user';
import { bench, describe } from 'vitest';

// Ranking and scoreboard pages render hundreds of users at once. Gravatar
// URLs require an MD5 hash, so avatar generation can accumulate on the list.
const USER_COUNT = 200;

const providers = ['gravatar', 'qq', 'github'] as const;

const users: BaseUser[] = Array.from({ length: USER_COUNT }, (_, index) => {
  const provider = providers[index % providers.length];
  const identity =
    provider === 'gravatar'
      ? `user${index}@example.com`
      : provider === 'qq'
        ? `${100000 + index}`
        : `user-${index}`;

  return {
    _id: index + 1,
    uname: `user${index}`,
    mail: `user${index}@example.com`,
    avatar: `${provider}:${identity}`,
    uojRating: 200 + index * 13,
  } as BaseUser;
});

// Keeps results reachable so the engine cannot drop the calls entirely.
const sink: { value: unknown } = { value: undefined };

describe('user display helpers', () => {
  bench('avatarUrl - mixed providers', () => {
    let length = 0;
    for (const user of users) length += avatarUrl(user.avatar, 64).length;
    sink.value = length;
  });
});
