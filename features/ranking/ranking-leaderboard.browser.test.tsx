import RankingLeaderboard from './ranking-leaderboard';
import type { RankingUser } from '@/api/server/method/ranking/list';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

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

test('renders RP and accepted problem counts as LLM-visible metrics', async () => {
  const userWithoutAccept = makeUser({ _id: 3, uname: 'bob', rp: 80 });
  delete (userWithoutAccept as Partial<RankingUser>).nAccept;

  const { container } = await renderLeaderboard([
    makeUser(),
    userWithoutAccept,
  ]);

  await expect
    .element(page.getByText('Accepted', { exact: true }))
    .toBeVisible();

  const rpCell = container.querySelector<HTMLElement>(
    '[data-llm-text="123.6"]'
  );
  expect(rpCell).not.toBeNull();
  expect(rpCell!.textContent).toBe('124');
  expect(rpCell!.getBoundingClientRect().height).toBeGreaterThan(0);

  expect(
    container.querySelector<HTMLElement>('[data-llm-text="7"]')?.textContent
  ).toBe('7');
  expect(
    container.querySelector<HTMLElement>('[data-llm-text="0"]')?.textContent
  ).toBe('0');
});

test('links the ranking rows to the user profiles', async () => {
  await renderLeaderboard([makeUser()]);

  const link = page.getByRole('link', { name: 'alice' });
  await expect.element(link).toBeVisible();
  expect(link.element().getAttribute('href')).toBe('/user/2');
});

test('shows an empty state without users', async () => {
  await renderLeaderboard([]);

  await expect
    .element(page.getByText('No users', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByRole('table')).not.toBeInTheDocument();
});
