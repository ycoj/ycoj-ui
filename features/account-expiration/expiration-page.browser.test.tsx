import ExpirationPage from './expiration-page';
import messages from '@/messages/en';
import { SudoRedirectError } from '@/shared/lib/sudo-navigation';
import type { AccountExpirationData } from '@/shared/types/account-expiration';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  set: vi.fn(),
  adjust: vi.fn(),
  clear: vi.fn(),
  send: vi.fn(),
  sudo: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    AccountExpiration: {
      setAccountExpiration: mocks.set,
      adjustAccountExpiration: mocks.adjust,
      clearAccountExpiration: mocks.clear,
    },
    Auth: { confirmSudo: mocks.sudo },
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }),
  usePathname: () => '/manage/user-expiration',
  useSearchParams: () => new URLSearchParams('page=2&q=alice'),
}));
vi.mock('@/shared/lib/sudo-navigation', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@/shared/lib/sudo-navigation')>();
  return { ...original, navigateToSudo: mocks.navigate };
});
vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error },
}));
vi.mock('@/features/user/user-span', () => ({
  default: ({ user }: { user: { uname: string } }) => <span>{user.uname}</span>,
}));

const alice = {
  _id: 1,
  uname: 'alice',
  mail: 'alice@example.com',
  avatar: '',
  priv: 4,
  accountExpireDate: '2026-09-01',
  accountExpired: false,
  accountAutoExpired: false,
  accountExpirationProtected: false,
};
const data: AccountExpirationData = {
  udocs: [
    alice,
    {
      ...alice,
      _id: 2,
      uname: 'root',
      priv: -1,
      accountExpirationProtected: true,
    },
    { ...alice, _id: 3, uname: 'bob', accountExpireDate: '' },
  ],
  page: 2,
  numPages: 3,
  count: 203,
  q: 'alice',
};

function renderPage(value: AccountExpirationData = data) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ExpirationPage state={{ kind: 'data', data: value }} query="alice" />
    </NextIntlClientProvider>
  );
}

async function confirmDialog() {
  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.click(dialog.getByRole('button', { name: 'Confirm' }));
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.navigate.mockImplementation(() => {
    throw new SudoRedirectError();
  });
  for (const method of [mocks.set, mocks.adjust, mocks.clear])
    method.mockReturnValue({ send: mocks.send });
  mocks.send.mockResolvedValue({ url: '/manage/user-expiration' });
  mocks.sudo.mockReturnValue({
    send: vi.fn().mockResolvedValue({
      method: 'post',
      redirect: '/manage/user-expiration',
      args: {},
    }),
  });
});

test('pairs action icons with accessible text labels', async () => {
  await renderPage();

  for (const name of [
    'Search',
    'Edit expiration for alice',
    'Set expiration',
    'Adjust days',
    'Set to never expire',
  ]) {
    const button = page.getByRole('button', { name });
    await expect.element(button).toBeVisible();
    const svg = button.element().querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  }

  await userEvent.click(
    page.getByRole('button', { name: 'Edit expiration for alice' })
  );
  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  for (const name of ['Cancel', 'Confirm']) {
    const button = dialog.getByRole('button', { name });
    await expect.element(button).toBeVisible();
    expect(
      button.element().querySelector('svg')?.getAttribute('aria-hidden')
    ).toBe('true');
  }
});

test('shows an icon on the refresh action without changing its behavior', async () => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ExpirationPage
        state={{ kind: 'error', message: 'Could not load accounts' }}
        query=""
      />
    </NextIntlClientProvider>
  );

  const button = page.getByRole('button', { name: 'Refresh' });
  await expect.element(button).toBeVisible();
  expect(
    button.element().querySelector('svg')?.getAttribute('aria-hidden')
  ).toBe('true');
  await userEvent.click(button);
  expect(mocks.refresh).toHaveBeenCalledOnce();
});

test('keeps protected users read-only and selects eligible users only', async () => {
  await renderPage();

  await expect
    .element(page.getByRole('checkbox', { name: 'Select root' }))
    .toBeDisabled();
  await expect
    .element(page.getByRole('button', { name: 'Edit expiration for root' }))
    .not.toBeInTheDocument();

  await userEvent.click(
    page.getByRole('checkbox', {
      name: 'Select all eligible users on this page',
    })
  );

  await expect
    .element(page.getByText('2 selected', { exact: true }))
    .toBeVisible();
  const rootCheckbox = page.getByRole('checkbox', { name: 'Select root' });
  expect(rootCheckbox.element().getAttribute('aria-checked')).not.toBe('true');
});

test('supports shift selection while skipping protected rows', async () => {
  await renderPage();

  await userEvent.click(page.getByRole('checkbox', { name: 'Select alice' }));
  page
    .getByRole('checkbox', { name: 'Select bob' })
    .element()
    .dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));

  await expect
    .element(page.getByText('2 selected', { exact: true }))
    .toBeVisible();
});

test('prefills a single user date and refreshes after saving', async () => {
  await renderPage();

  await userEvent.click(
    page.getByRole('button', { name: 'Edit expiration for alice' })
  );
  const date = page.getByLabelText('Expiration date');
  await expect.element(date).toHaveValue('2026-09-01');
  await userEvent.fill(date, '2020-02-29');
  await confirmDialog();

  await expect.poll(() => mocks.set.mock.calls.length).toBe(1);
  expect(mocks.set).toHaveBeenCalledWith([1], '2020-02-29');
  expect(mocks.success).toHaveBeenCalledOnce();
  expect(mocks.refresh).toHaveBeenCalledOnce();
});

test('requires a date for bulk setting', async () => {
  await renderPage();

  await userEvent.click(page.getByRole('checkbox', { name: 'Select alice' }));
  await userEvent.click(page.getByRole('button', { name: 'Set expiration' }));
  await confirmDialog();

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('valid expiration date');
  expect(mocks.set).not.toHaveBeenCalled();
});

test('blocks mixed finite/unlimited adjustments', async () => {
  await renderPage();

  await userEvent.click(
    page.getByRole('checkbox', {
      name: 'Select all eligible users on this page',
    })
  );
  await userEvent.click(page.getByRole('button', { name: 'Adjust days' }));

  expect(mocks.error).toHaveBeenCalledWith(
    expect.stringContaining('already have an expiration date')
  );
  await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

test.each(['0', '1.5', ''])('rejects invalid days %s', async (days) => {
  await renderPage();

  await userEvent.click(page.getByRole('checkbox', { name: 'Select alice' }));
  await userEvent.click(page.getByRole('button', { name: 'Adjust days' }));
  await userEvent.fill(page.getByLabelText('Days to adjust'), days);
  await confirmDialog();

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('non-zero whole number');
  expect(mocks.adjust).not.toHaveBeenCalled();
});

test('submits negative adjustments', async () => {
  await renderPage();

  await userEvent.click(page.getByRole('checkbox', { name: 'Select alice' }));
  await userEvent.click(page.getByRole('button', { name: 'Adjust days' }));
  await userEvent.fill(page.getByLabelText('Days to adjust'), '-3');
  await confirmDialog();

  await expect.poll(() => mocks.adjust.mock.calls.length).toBe(1);
  expect(mocks.adjust).toHaveBeenCalledWith([1], -3);
  await expect
    .element(page.getByText('0 selected', { exact: true }))
    .toBeVisible();
});

test('requires confirmation before clearing', async () => {
  await renderPage();

  await userEvent.click(page.getByRole('checkbox', { name: 'Select alice' }));
  await userEvent.click(
    page.getByRole('button', { name: 'Set to never expire' })
  );
  expect(mocks.clear).not.toHaveBeenCalled();

  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  await expect.element(dialog).not.toBeInTheDocument();
  expect(mocks.clear).not.toHaveBeenCalled();

  await userEvent.click(
    page.getByRole('button', { name: 'Set to never expire' })
  );
  await confirmDialog();
  expect(mocks.clear).toHaveBeenCalledWith([1]);
});

test('navigates to the global sudo page instead of showing inline verification', async () => {
  mocks.send.mockResolvedValue({ url: '/user/sudo' });
  await renderPage();

  await userEvent.click(
    page.getByRole('button', { name: 'Edit expiration for alice' })
  );
  await confirmDialog();

  expect(mocks.navigate).toHaveBeenCalledOnce();
  await expect.element(page.getByLabelText('Password')).not.toBeInTheDocument();
  expect(mocks.success).not.toHaveBeenCalled();
  expect(mocks.set).toHaveBeenCalledOnce();
});

test('blocks duplicate clicks while a mutation is pending', async () => {
  let complete!: (value: unknown) => void;
  mocks.send.mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      })
  );
  await renderPage();

  await userEvent.click(
    page.getByRole('button', { name: 'Edit expiration for alice' })
  );
  await confirmDialog();

  const saving = page.getByRole('button', { name: 'Saving...' });
  await expect.element(saving).toBeDisabled();
  const spinner = saving.element().querySelector('svg');
  await expect
    .poll(() => (spinner ? getComputedStyle(spinner).animationName : 'none'))
    .toContain('spin');
  expect(mocks.set).toHaveBeenCalledOnce();

  complete({ url: '/manage/user-expiration' });
  await expect.poll(() => mocks.success.mock.calls.length).toBe(1);
});

test('shows backend failures without losing inputs', async () => {
  mocks.send.mockResolvedValue({
    error: { message: 'User no longer exists' },
  });
  await renderPage();

  await userEvent.click(
    page.getByRole('button', { name: 'Edit expiration for alice' })
  );
  await confirmDialog();

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('User no longer exists');
  await expect
    .element(page.getByLabelText('Expiration date'))
    .toHaveValue('2026-09-01');
  expect(mocks.success).not.toHaveBeenCalled();
});

test('trims searches, resets the page and preserves queries in pagination', async () => {
  await renderPage();

  const next = page.getByRole('link', { name: 'Go to next page' });
  await expect.element(next).toBeVisible();
  expect(next.element().getAttribute('href')).toBe(
    '/manage/user-expiration?page=3&q=alice'
  );

  await userEvent.fill(page.getByRole('searchbox'), ' bob ');
  await userEvent.click(page.getByRole('button', { name: 'Search' }));

  expect(mocks.push).toHaveBeenCalledWith('/manage/user-expiration?q=bob');
});

test('shows a graceful empty state', async () => {
  await renderPage({ ...data, udocs: [], count: 0, numPages: 0 });

  await expect
    .element(page.getByText('No users found', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByRole('table')).not.toBeInTheDocument();
});
