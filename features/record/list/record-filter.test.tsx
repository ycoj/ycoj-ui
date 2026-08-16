import RecordFilter from './record-filter';
import messages from '@/messages/en.json';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

async function advanceDebounce() {
  await act(async () => {
    vi.advanceTimersByTime(300);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('RecordFilter auto-complete fields', () => {
  beforeEach(() => {
    vi.useFakeTimers();
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

  afterEach(() => vi.useRealTimers());

  it('submits selected keys, preserves other filters, and resets the page', async () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RecordFilter domainId="system" />
      </NextIntlClientProvider>
    );

    const userInput = screen.getByRole('combobox', {
      name: 'Submitter UID / username',
    });
    fireEvent.change(userInput, { target: { value: 'ali' } });
    await advanceDebounce();
    fireEvent.click(screen.getByText('alice (Alice)'));

    const problemInput = screen.getByRole('combobox', {
      name: 'Problem ID',
    });
    fireEvent.change(problemInput, { target: { value: 'tree' } });
    await advanceDebounce();
    fireEvent.click(screen.getByText('P1000 Binary Tree'));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
      await Promise.resolve();
    });

    expect(mocks.searchUsers).toHaveBeenCalledWith('system', 'ali');
    expect(mocks.searchProblems).toHaveBeenCalledWith('system', 'tree');
    expect(mocks.push).toHaveBeenCalledWith(
      '?lang=cc.cc17&uidOrName=alice&pid=1000'
    );
  });
});
