import AssignSelectAutoComplete from './assign-select-auto-complete';
import messages from '@/messages/en.json';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getGroupsByNames: vi.fn(),
  getUsersByIds: vi.fn(),
  searchGroups: vi.fn(),
  searchUsers: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Domain: {
      getGroupsByNames: mocks.getGroupsByNames,
      searchGroups: mocks.searchGroups,
    },
    User: {
      getUsersByIds: mocks.getUsersByIds,
      searchUsers: mocks.searchUsers,
    },
  },
}));

function methodResult<T>(value: T) {
  return { send: vi.fn().mockResolvedValue(value) };
}

function Harness({ initialValue = [] }: { initialValue?: string[] }) {
  const [value, setValue] = useState(initialValue);

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <AssignSelectAutoComplete
        domainId="system"
        value={value}
        onValueChange={setValue}
        placeholder="Search assignees"
        ariaLabel="Assignments"
      />
      <output data-testid="value">{JSON.stringify(value)}</output>
    </NextIntlClientProvider>
  );
}

async function advanceSearch() {
  await act(async () => {
    vi.advanceTimersByTime(300);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('AssignSelectAutoComplete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.getGroupsByNames.mockReturnValue(methodResult([]));
    mocks.getUsersByIds.mockReturnValue(methodResult([]));
    mocks.searchGroups.mockReturnValue(methodResult([]));
    mocks.searchUsers.mockReturnValue(methodResult([]));
  });

  afterEach(() => {
    vi.useRealTimers();
    for (const mock of Object.values(mocks)) mock.mockReset();
  });

  it('searches groups and users, selects both, and removes a chip', async () => {
    mocks.searchGroups.mockReturnValue(
      methodResult([{ name: 'Class A', uids: [1, 2] }])
    );
    mocks.searchUsers.mockReturnValue(
      methodResult([
        {
          _id: 7,
          uname: 'alice',
          displayName: 'Alice',
          avatarUrl: '',
        },
      ])
    );
    render(<Harness />);

    const input = screen.getByRole('combobox', { name: 'Assignments' });
    fireEvent.change(input, { target: { value: 'a' } });
    await advanceSearch();

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('Class A');
    expect(options[1]).toHaveTextContent('alice (Alice)');
    expect(mocks.searchGroups).toHaveBeenCalledWith('system', 'a');
    expect(mocks.searchUsers).toHaveBeenCalledWith('system', 'a');

    fireEvent.click(screen.getByText('Class A'));
    expect(screen.getByTestId('value')).toHaveTextContent('["Class A"]');

    fireEvent.change(input, { target: { value: 'ali' } });
    await advanceSearch();
    fireEvent.click(screen.getByText('alice (Alice)'));
    expect(screen.getByTestId('value')).toHaveTextContent('["Class A","7"]');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Class A' }));
    expect(screen.getByTestId('value')).toHaveTextContent('["7"]');
  });

  it('supports keyboard selection', async () => {
    mocks.searchGroups.mockReturnValue(
      methodResult([{ name: 'Class A', uids: [] }])
    );
    render(<Harness />);

    const input = screen.getByRole('combobox', { name: 'Assignments' });
    fireEvent.change(input, { target: { value: 'class' } });
    await advanceSearch();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('value')).toHaveTextContent('["Class A"]');
  });

  it('resolves existing values and marks missing groups as invalid', async () => {
    mocks.getUsersByIds.mockReturnValue(
      methodResult([{ _id: 7, uname: 'alice', displayName: 'Alice' }])
    );
    mocks.getGroupsByNames.mockReturnValue(methodResult([]));
    render(<Harness initialValue={['7', 'missing-group']} />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.getUsersByIds).toHaveBeenCalledWith('system', ['7']);
    expect(mocks.getGroupsByNames).toHaveBeenCalledWith('system', [
      'missing-group',
    ]);
    expect(screen.getByText('alice (Alice)')).toBeInTheDocument();
    expect(screen.getByText('missing-group (Invalid)')).toBeInTheDocument();
  });

  it('reports a failed combined search', async () => {
    mocks.searchGroups.mockReturnValue({
      send: vi.fn().mockRejectedValue(new Error('network failure')),
    });
    render(<Harness />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Assignments' }), {
      target: { value: 'class' },
    });
    await advanceSearch();

    expect(screen.getByText('Could not load suggestions')).toBeInTheDocument();
  });
});
