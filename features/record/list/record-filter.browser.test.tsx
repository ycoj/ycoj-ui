import RecordFilter from './record-filter';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchProblems: vi.fn(),
  searchUsers: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams('page=3&lang=cc.cc17'),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Problem: { searchProblems: mocks.searchProblems },
    User: { searchUsers: mocks.searchUsers },
  },
}));

beforeEach(() => {
  mocks.push.mockReset();
  mocks.searchProblems.mockReturnValue({
    send: vi.fn().mockResolvedValue({
      pdocs: [{ docId: 1000, pid: 'P1000', title: 'Binary Tree' }],
    }),
  });
  mocks.searchUsers.mockReturnValue({
    send: vi
      .fn()
      .mockResolvedValue([
        { _id: 2, uname: 'alice', displayName: 'Alice', avatarUrl: '' },
      ]),
  });
});

test('submits selected keys, preserves other filters, and resets the page', async () => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RecordFilter domainId="system" />
    </NextIntlClientProvider>
  );

  const userInput = page.getByRole('combobox', {
    name: 'Submitter UID / username',
  });
  await userEvent.type(userInput, 'ali');
  const userOption = page.getByRole('option', { name: /alice/ });
  await expect.element(userOption).toBeVisible();
  await userEvent.click(userOption);

  const problemInput = page.getByRole('combobox', { name: 'Problem ID' });
  await userEvent.type(problemInput, 'tree');
  const problemOption = page.getByRole('option', { name: /P1000 Binary Tree/ });
  await expect.element(problemOption).toBeVisible();
  await userEvent.click(problemOption);

  await userEvent.click(page.getByRole('button', { name: 'Filter' }));

  expect(mocks.searchUsers).toHaveBeenCalledWith('system', 'ali');
  expect(mocks.searchProblems).toHaveBeenCalledWith('system', 'tree');
  await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
  expect(mocks.push).toHaveBeenCalledWith(
    '?lang=cc.cc17&uidOrName=alice&pid=1000'
  );
});
