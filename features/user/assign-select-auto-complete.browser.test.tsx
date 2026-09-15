import AssignSelectAutoComplete from './assign-select-auto-complete';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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

function Harness({
  initialValue = [],
  id,
}: {
  initialValue?: string[];
  id?: string;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <AssignSelectAutoComplete
        id={id}
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

function valueOutput() {
  return page.getByTestId('value');
}

beforeEach(() => {
  mocks.getGroupsByNames.mockReset();
  mocks.getUsersByIds.mockReset();
  mocks.searchGroups.mockReset();
  mocks.searchUsers.mockReset();
  mocks.getGroupsByNames.mockReturnValue(methodResult([]));
  mocks.getUsersByIds.mockReturnValue(methodResult([]));
  mocks.searchGroups.mockReturnValue(methodResult([]));
  mocks.searchUsers.mockReturnValue(methodResult([]));
});

test('searches groups and users, selects both, and removes a chip', async () => {
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

  await render(<Harness id="assign" />);

  const input = page.getByRole('combobox', { name: 'Assignments' });
  expect(input.element().getAttribute('id')).toBe('assign');
  await userEvent.type(input, 'cl');

  const groupOption = page.getByRole('option', { name: /Class A/ });
  const userOption = page.getByRole('option', { name: /alice \(Alice\)/ });
  await expect.element(groupOption).toBeVisible();
  await expect.element(userOption).toBeVisible();
  expect(mocks.searchGroups).toHaveBeenCalledWith('system', 'cl');
  expect(mocks.searchUsers).toHaveBeenCalledWith('system', 'cl');

  await userEvent.click(groupOption);
  await expect.element(valueOutput()).toHaveTextContent('["Class A"]');

  await userEvent.type(input, 'ali');
  await expect
    .element(page.getByRole('option', { name: /alice \(Alice\)/ }))
    .toBeVisible();
  await userEvent.click(page.getByRole('option', { name: /alice \(Alice\)/ }));
  await expect.element(valueOutput()).toHaveTextContent('["Class A","7"]');

  await userEvent.click(page.getByRole('button', { name: 'Remove Class A' }));
  await expect.element(valueOutput()).toHaveTextContent('["7"]');
});

test('supports keyboard selection', async () => {
  mocks.searchGroups.mockReturnValue(
    methodResult([{ name: 'Class A', uids: [] }])
  );

  await render(<Harness />);

  const input = page.getByRole('combobox', { name: 'Assignments' });
  await userEvent.type(input, 'class');
  await expect
    .element(page.getByRole('option', { name: /Class A/ }))
    .toBeVisible();
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{Enter}');

  await expect.element(valueOutput()).toHaveTextContent('["Class A"]');
});

test('resolves existing values and marks missing groups as invalid', async () => {
  mocks.getUsersByIds.mockReturnValue(
    methodResult([{ _id: 7, uname: 'alice', displayName: 'Alice' }])
  );

  await render(<Harness initialValue={['7', 'missing-group']} />);

  await expect
    .poll(() => mocks.getUsersByIds.mock.calls.length)
    .toBeGreaterThan(0);
  expect(mocks.getUsersByIds).toHaveBeenCalledWith('system', ['7']);
  expect(mocks.getGroupsByNames).toHaveBeenCalledWith('system', [
    'missing-group',
  ]);
  await expect
    .element(page.getByText('alice (Alice)', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText('missing-group (Invalid)', { exact: true }))
    .toBeVisible();
});

test('reports a failed combined search', async () => {
  mocks.searchGroups.mockReturnValue({
    send: vi.fn().mockRejectedValue(new Error('network failure')),
  });

  await render(<Harness />);

  await userEvent.type(
    page.getByRole('combobox', { name: 'Assignments' }),
    'class'
  );

  await expect
    .element(page.getByText('Could not load suggestions', { exact: true }))
    .toBeVisible();
});
