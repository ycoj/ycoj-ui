import RankingLeaderboard from './ranking-leaderboard';
import type { RankingUser } from '@/api/server/method/ranking/list';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

function makeUser(overrides: Partial<RankingUser> = {}): RankingUser {
  return {
    _id: 2,
    uname: 'alice',
    mail: 'alice@example.com',
    avatar: '',
    rp: 123.6,
    rpInfo: { contest: 23.4, problem: 100.2 },
    nAccept: 7,
    bio: null,
    ...overrides,
  };
}

function renderLeaderboard(users: RankingUser[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RankingLeaderboard udocs={users} page={1} pageSize={20} />
    </NextIntlClientProvider>
  );
}

describe('RankingLeaderboard', () => {
  it('renders RP and accepted problem counts as LLM-visible metrics', () => {
    const userWithoutAccept = makeUser({ _id: 3, uname: 'bob', rp: 80 });
    delete (userWithoutAccept as Partial<RankingUser>).nAccept;

    renderLeaderboard([makeUser(), userWithoutAccept]);

    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('124').closest('td')).toHaveAttribute(
      'data-llm-text',
      '123.6'
    );
    expect(screen.getByText('7').closest('td')).toHaveAttribute(
      'data-llm-text',
      '7'
    );
    expect(screen.getByText('0').closest('td')).toHaveAttribute(
      'data-llm-text',
      '0'
    );
  });
});
