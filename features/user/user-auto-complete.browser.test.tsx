import UserAutoComplete from './user-auto-complete';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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
    <NextIntlClientProvider locale="en" messages={messages}>
      <UserAutoComplete
        multiple
        domainId="system"
        value={value}
        onValueChange={setValue}
        placeholder="Search maintainers"
        ariaLabel="Maintainers"
      />
      <output data-testid="multiple-value">{JSON.stringify(value)}</output>
    </NextIntlClientProvider>
  );
}

function valueOutput() {
  return page.getByTestId('multiple-value');
}

beforeEach(() => {
  mocks.getUsersByIds.mockReset();
  mocks.searchUsers.mockReset();
  mocks.getUsersByIds.mockReturnValue(methodResult([]));
  mocks.searchUsers.mockReturnValue(methodResult([]));
});

test('submits the UID for a numeric username', async () => {
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

  await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Harness onValueChange={onValueChange} />
    </NextIntlClientProvider>
  );

  await userEvent.type(
    page.getByRole('combobox', { name: 'Submitter' }),
    '123'
  );
  const option = page.getByRole('option', { name: /Numeric user/ });
  await expect.element(option).toBeVisible();
  await expect
    .element(page.getByText('UID = 7', { exact: true }))
    .toBeVisible();

  await userEvent.click(option);
  expect(mocks.searchUsers).toHaveBeenCalledWith('system', '123');
  expect(onValueChange).toHaveBeenLastCalledWith('7');
});

test('selects multiple users by UID and removes a chip', async () => {
  mocks.searchUsers.mockImplementation((_domainId: string, query: string) =>
    methodResult(
      query === 'ali'
        ? [{ _id: 7, uname: 'alice', displayName: 'Alice' }]
        : [{ _id: 8, uname: 'bob', displayName: 'Bob' }]
    )
  );

  await render(<MultipleHarness />);

  const input = page.getByRole('combobox', { name: 'Maintainers' });
  await userEvent.type(input, 'ali');
  const alice = page.getByRole('option', { name: /alice \(Alice\)/ });
  await expect.element(alice).toBeVisible();
  await userEvent.click(alice);
  await expect.element(input).toHaveValue('');

  await userEvent.type(input, 'bob');
  const bob = page.getByRole('option', { name: /bob \(Bob\)/ });
  await expect.element(bob).toBeVisible();
  await userEvent.click(bob);

  expect(mocks.searchUsers).toHaveBeenNthCalledWith(1, 'system', 'ali');
  expect(mocks.searchUsers).toHaveBeenNthCalledWith(2, 'system', 'bob');
  await expect.element(valueOutput()).toHaveTextContent('["7","8"]');

  await userEvent.click(
    page.getByRole('button', { name: 'Remove alice (Alice)' })
  );
  await expect.element(valueOutput()).toHaveTextContent('["8"]');
  await expect
    .element(page.getByRole('button', { name: 'Remove bob (Bob)' }))
    .toBeVisible();
});

test('supports keyboard selection in multiple mode', async () => {
  mocks.searchUsers.mockReturnValue(
    methodResult([{ _id: 7, uname: 'alice', displayName: 'Alice' }])
  );

  await render(<MultipleHarness />);

  const input = page.getByRole('combobox', { name: 'Maintainers' });
  await userEvent.type(input, 'ali');
  await expect
    .element(page.getByRole('option', { name: /alice \(Alice\)/ }))
    .toBeVisible();
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{Enter}');

  await expect
    .element(page.getByRole('button', { name: 'Remove alice (Alice)' }))
    .toBeVisible();
  await expect.element(valueOutput()).toHaveTextContent('["7"]');
});

test('deduplicates users with the same UID in search results', async () => {
  mocks.searchUsers.mockReturnValue(
    methodResult([
      { _id: 7, uname: 'alice', displayName: 'Alice' },
      { _id: 7, uname: 'alice', displayName: 'Alice' },
    ])
  );

  await render(<MultipleHarness />);

  await userEvent.type(
    page.getByRole('combobox', { name: 'Maintainers' }),
    'ali'
  );
  await expect.poll(() => page.getByRole('option').elements().length).toBe(1);
  await userEvent.click(page.getByRole('option', { name: /alice \(Alice\)/ }));
  await expect.element(valueOutput()).toHaveTextContent('["7"]');
});

test('resolves existing UID values in order and marks missing users invalid', async () => {
  mocks.getUsersByIds.mockReturnValue(
    methodResult([
      { _id: 12, uname: 'bob', displayName: 'Bob' },
      { _id: 7, uname: 'alice', displayName: 'Alice' },
    ])
  );

  await render(<MultipleHarness initialValue={['7', '99', '12']} />);

  await expect
    .poll(() => mocks.getUsersByIds.mock.calls.length)
    .toBeGreaterThan(0);
  expect(mocks.getUsersByIds).toHaveBeenCalledWith('system', ['7', '99', '12']);

  await expect
    .element(page.getByRole('button', { name: 'Remove alice (Alice)' }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Remove 99' }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Remove bob (Bob)' }))
    .toBeVisible();
  await expect
    .element(page.getByText('99 (Invalid)', { exact: true }))
    .toBeVisible();
});
