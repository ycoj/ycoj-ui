import UserAutoComplete from './user-auto-complete';
import messages from '@/messages/en.json';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUsersByIds: vi.fn(),
  searchUsers: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    User: {
      getUsersByIds: mocks.getUsersByIds,
      searchUsers: mocks.searchUsers,
    },
  },
}));

function methodResult<T>(value: T) {
  return { send: vi.fn().mockResolvedValue(value) };
}

function Harness({
  onValueChange,
}: {
  onValueChange: (value: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <UserAutoComplete
      domainId="system"
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        onValueChange(nextValue);
      }}
      placeholder="Submitter"
    />
  );
}

function MultipleHarness({ initialValue = [] }: { initialValue?: string[] }) {
  const [value, setValue] = useState(initialValue);

  return (
    <>
      <UserAutoComplete
        multiple
        domainId="system"
        value={value}
        onValueChange={setValue}
        placeholder="Search maintainers"
        ariaLabel="Maintainers"
      />
      <output data-testid="multiple-value">{JSON.stringify(value)}</output>
    </>
  );
}

async function advanceSearch() {
  await act(async () => {
    vi.advanceTimersByTime(300);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('UserAutoComplete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.getUsersByIds.mockReturnValue(methodResult([]));
    mocks.searchUsers.mockReturnValue(methodResult([]));
  });

  afterEach(() => {
    vi.useRealTimers();
    for (const mock of Object.values(mocks)) mock.mockReset();
  });

  it('submits the UID for a numeric username', async () => {
    const onValueChange = vi.fn();
    mocks.searchUsers.mockReturnValue({
      send: vi.fn().mockResolvedValue([
        {
          _id: 7,
          uname: '123',
          displayName: 'Numeric user',
          avatarUrl: '',
        },
      ]),
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Harness onValueChange={onValueChange} />
      </NextIntlClientProvider>
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Submitter' }), {
      target: { value: '123' },
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText('UID = 7')).toBeInTheDocument();
    fireEvent.click(screen.getByText('123 (Numeric user)'));

    expect(mocks.searchUsers).toHaveBeenCalledWith('system', '123');
    expect(onValueChange).toHaveBeenLastCalledWith('7');
  });

  it('selects multiple users by UID and removes a chip', async () => {
    mocks.searchUsers.mockImplementation((_domainId, query: string) =>
      methodResult(
        query === 'ali'
          ? [{ _id: 7, uname: 'alice', displayName: 'Alice' }]
          : [{ _id: 8, uname: 'bob', displayName: 'Bob' }]
      )
    );

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <MultipleHarness />
      </NextIntlClientProvider>
    );

    const input = screen.getByRole('combobox', { name: 'Maintainers' });
    fireEvent.change(input, { target: { value: 'ali' } });
    await advanceSearch();
    fireEvent.click(screen.getByText('alice (Alice)'));

    fireEvent.change(input, { target: { value: 'bob' } });
    await advanceSearch();
    fireEvent.click(screen.getByText('bob (Bob)'));

    expect(mocks.searchUsers).toHaveBeenNthCalledWith(1, 'system', 'ali');
    expect(mocks.searchUsers).toHaveBeenNthCalledWith(2, 'system', 'bob');
    expect(screen.getByTestId('multiple-value')).toHaveTextContent('["7","8"]');
    expect(
      screen
        .getAllByRole('button', { name: /^Remove / })
        .map((button) => button.getAttribute('aria-label'))
    ).toEqual(['Remove alice (Alice)', 'Remove bob (Bob)']);

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove alice (Alice)' })
    );
    expect(screen.getByTestId('multiple-value')).toHaveTextContent('["8"]');
    expect(
      screen
        .getAllByRole('button', { name: /^Remove / })
        .map((button) => button.getAttribute('aria-label'))
    ).toEqual(['Remove bob (Bob)']);
  });

  it('supports keyboard selection in multiple mode', async () => {
    mocks.searchUsers.mockReturnValue(
      methodResult([{ _id: 7, uname: 'alice', displayName: 'Alice' }])
    );

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <MultipleHarness />
      </NextIntlClientProvider>
    );

    const input = screen.getByRole('combobox', { name: 'Maintainers' });
    fireEvent.change(input, { target: { value: 'ali' } });
    await advanceSearch();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(
      screen.getByRole('button', { name: 'Remove alice (Alice)' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('multiple-value')).toHaveTextContent('["7"]');
  });

  it('deduplicates users with the same UID in search results', async () => {
    mocks.searchUsers.mockReturnValue(
      methodResult([
        { _id: 7, uname: 'alice', displayName: 'Alice' },
        { _id: 7, uname: 'alice', displayName: 'Alice' },
      ])
    );

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <MultipleHarness />
      </NextIntlClientProvider>
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Maintainers' }), {
      target: { value: 'ali' },
    });
    await advanceSearch();

    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.click(screen.getByText('alice (Alice)'));
    expect(screen.getByTestId('multiple-value')).toHaveTextContent('["7"]');
  });

  it('resolves existing UID values in order and marks missing users invalid', async () => {
    mocks.getUsersByIds.mockReturnValue(
      methodResult([
        { _id: 12, uname: 'bob', displayName: 'Bob' },
        { _id: 7, uname: 'alice', displayName: 'Alice' },
      ])
    );

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <MultipleHarness initialValue={['7', '99', '12']} />
      </NextIntlClientProvider>
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.getUsersByIds).toHaveBeenCalledWith('system', [
      '7',
      '99',
      '12',
    ]);
    expect(
      screen
        .getAllByRole('button', { name: /^Remove / })
        .map((button) => button.getAttribute('aria-label'))
    ).toEqual(['Remove alice (Alice)', 'Remove 99', 'Remove bob (Bob)']);
    expect(screen.getByText('99 (Invalid)')).toBeInTheDocument();
  });
});
