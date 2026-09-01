import OmnibarProvider, { useOmnibar } from './omnibar-provider';
import en from '@/messages/en.json';
import { STATUS } from '@/shared/configs/status';
import type { ListProjectionProblem } from '@/shared/types/problem';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchOmnibarProblems: vi.fn(),
  searchUsers: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Problem: { searchOmnibarProblems: mocks.searchOmnibarProblems },
    User: { searchUsers: mocks.searchUsers },
  },
}));

function methodResult<T>(value: T) {
  return { send: vi.fn().mockResolvedValue(value) };
}

function methodError(error: Error) {
  return { send: vi.fn().mockRejectedValue(error) };
}

const problem = {
  _id: 'p1',
  domainId: 'system',
  docType: 10,
  docId: 3,
  pid: 'P3',
  owner: 2,
  title: 'Binary Tree',
  nSubmit: 20,
  nAccept: 8,
  tag: [],
} as ListProjectionProblem;

function Launcher() {
  const { open } = useOmnibar();
  return <button onClick={open}>Open search</button>;
}

function renderOmnibar() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <OmnibarProvider>
        <Launcher />
      </OmnibarProvider>
    </NextIntlClientProvider>
  );
}

async function openAndSearch(query: string) {
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
  const input = screen.getByRole('textbox', {
    name: 'Search problems and users',
  });
  fireEvent.change(input, { target: { value: query } });
  await act(async () => {
    vi.advanceTimersByTime(300);
    await Promise.resolve();
    await Promise.resolve();
  });
  return input;
}

describe('OmnibarProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.push.mockReset();
    mocks.searchOmnibarProblems.mockReturnValue(
      methodResult({
        pdocs: [problem],
        psdict: {
          3: {
            _id: 'a'.repeat(24),
            docId: 3,
            docType: 10,
            domainId: 'system',
            rid: 'b'.repeat(24),
            status: STATUS.STATUS_ACCEPTED,
          },
        },
      })
    );
    mocks.searchUsers.mockReturnValue(
      methodResult([
        {
          _id: 7,
          uname: 'alice',
          avatarUrl: '/alice.png',
        },
      ])
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    mocks.searchOmnibarProblems.mockReset();
    mocks.searchUsers.mockReset();
  });

  it('opens with Ctrl-K and Cmd-K, and toggles closed', () => {
    renderOmnibar();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('searches problems and users, then Enter navigates to the highlighted problem', async () => {
    renderOmnibar();
    await openAndSearch('tree');

    expect(mocks.searchOmnibarProblems).toHaveBeenCalledWith('tree');
    expect(mocks.searchUsers).toHaveBeenCalledWith('system', 'tree');
    expect(screen.getByRole('option', { name: /Binary Tree/ })).toHaveAttribute(
      'href',
      '/problem/P3'
    );
    expect(screen.getByRole('option', { name: /alice/ })).toHaveAttribute(
      'href',
      '/user/7'
    );
    expect(screen.getByRole('link', { name: 'Accepted' })).toHaveAttribute(
      'href',
      `/record/${'b'.repeat(24)}`
    );

    fireEvent.keyDown(
      screen.getByRole('textbox', { name: 'Search problems and users' }),
      { key: 'Enter' }
    );
    expect(mocks.push).toHaveBeenCalledWith('/problem/P3');
  });

  it('closes on Escape and keeps the last query', async () => {
    renderOmnibar();
    const input = await openAndSearch('tree');
    expect(input).toHaveValue('tree');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(
      screen.getByRole('textbox', { name: 'Search problems and users' })
    ).toHaveValue('tree');
    expect(screen.getByRole('option', { name: /Binary Tree/ })).toBeVisible();
  });

  it('clears both result lists when the query is emptied', async () => {
    renderOmnibar();
    const input = await openAndSearch('tree');
    expect(screen.getByRole('option', { name: /alice/ })).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '   ' } });
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(mocks.searchOmnibarProblems).toHaveBeenCalledTimes(1);
  });

  it('shows a failure message when search requests fail', async () => {
    mocks.searchOmnibarProblems.mockReturnValue(
      methodError(new Error('network'))
    );
    renderOmnibar();
    await openAndSearch('tree');
    expect(
      screen.getByText('Could not load results. Try again.')
    ).toBeInTheDocument();
  });
});
