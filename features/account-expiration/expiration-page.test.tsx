import ExpirationPage from './expiration-page';
import messages from '@/messages/en.json';
import { SudoRedirectError } from '@/shared/lib/sudo-navigation';
import type { AccountExpirationData } from '@/shared/types/account-expiration';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
const confirm = () =>
  userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Confirm',
    })
  );

describe('ExpirationPage', () => {
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
  it('pairs action icons with accessible text labels', async () => {
    renderPage();
    for (const name of [
      'Search',
      'Edit expiration for alice',
      'Set expiration',
      'Adjust days',
      'Set to never expire',
    ]) {
      expect(
        screen.getByRole('button', { name }).querySelector('svg')
      ).toHaveAttribute('aria-hidden', 'true');
    }
    await userEvent.click(
      screen.getByRole('button', { name: 'Edit expiration for alice' })
    );
    for (const name of ['Cancel', 'Confirm']) {
      expect(
        within(screen.getByRole('dialog'))
          .getByRole('button', { name })
          .querySelector('svg')
      ).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('shows an icon on the refresh action without changing its behavior', async () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ExpirationPage
          state={{ kind: 'error', message: 'Could not load accounts' }}
          query=""
        />
      </NextIntlClientProvider>
    );
    const button = screen.getByRole('button', { name: 'Refresh' });
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await userEvent.click(button);
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('keeps protected users read-only and selects eligible users only', async () => {
    renderPage();
    expect(
      screen.getByRole('checkbox', { name: 'Select root' })
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Edit expiration for root' })
    ).toBeNull();
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'Select all eligible users on this page',
      })
    );
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Select root' })
    ).not.toBeChecked();
  });
  it('supports shift selection while skipping protected rows', async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Select alice' })
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select bob' }), {
      shiftKey: true,
    });
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });
  it('prefills a single user date and refreshes after saving', async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole('button', { name: 'Edit expiration for alice' })
    );
    expect(screen.getByLabelText('Expiration date')).toHaveValue('2026-09-01');
    fireEvent.change(screen.getByLabelText('Expiration date'), {
      target: { value: '2020-02-29' },
    });
    await confirm();
    await waitFor(() =>
      expect(mocks.set).toHaveBeenCalledWith([1], '2020-02-29')
    );
    expect(mocks.success).toHaveBeenCalledOnce();
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
  it('requires a date for bulk setting', async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Select alice' })
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Set expiration' })
    );
    await confirm();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'valid expiration date'
    );
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it('blocks mixed finite/unlimited adjustments', async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'Select all eligible users on this page',
      })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Adjust days' }));
    expect(mocks.error).toHaveBeenCalledWith(
      expect.stringContaining('already have an expiration date')
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it.each(['0', '1.5', ''])('rejects invalid days %s', async (days) => {
    renderPage();
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Select alice' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Adjust days' }));
    fireEvent.change(screen.getByLabelText('Days to adjust'), {
      target: { value: days },
    });
    await confirm();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'non-zero whole number'
    );
    expect(mocks.adjust).not.toHaveBeenCalled();
  });
  it('submits negative adjustments', async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Select alice' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Adjust days' }));
    fireEvent.change(screen.getByLabelText('Days to adjust'), {
      target: { value: '-3' },
    });
    await confirm();
    await waitFor(() => expect(mocks.adjust).toHaveBeenCalledWith([1], -3));
    expect(screen.getByText('0 selected')).toBeInTheDocument();
  });
  it('requires confirmation before clearing', async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Select alice' })
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Set to never expire' })
    );
    expect(mocks.clear).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.clear).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Set to never expire' })
    );
    await confirm();
    expect(mocks.clear).toHaveBeenCalledWith([1]);
  });
  it('navigates to the global sudo page instead of showing inline verification', async () => {
    mocks.send.mockResolvedValue({ url: '/user/sudo' });
    renderPage();
    await userEvent.click(
      screen.getByRole('button', { name: 'Edit expiration for alice' })
    );
    await confirm();
    expect(mocks.navigate).toHaveBeenCalledOnce();
    expect(screen.queryByLabelText('Password')).toBeNull();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.set).toHaveBeenCalledOnce();
  });
  it('blocks duplicate clicks while a mutation is pending', async () => {
    let complete!: (value: unknown) => void;
    mocks.send.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        })
    );
    renderPage();
    await userEvent.click(
      screen.getByRole('button', { name: 'Edit expiration for alice' })
    );
    await confirm();
    const saving = await screen.findByRole('button', { name: 'Saving...' });
    expect(saving).toBeDisabled();
    expect(saving.querySelector('svg')).toHaveClass('animate-spin');
    await userEvent.click(saving);
    expect(mocks.set).toHaveBeenCalledOnce();
    complete({ url: '/manage/user-expiration' });
    await waitFor(() => expect(mocks.success).toHaveBeenCalledOnce());
  });
  it('shows backend failures without losing inputs', async () => {
    mocks.send.mockResolvedValue({
      error: { message: 'User no longer exists' },
    });
    renderPage();
    await userEvent.click(
      screen.getByRole('button', { name: 'Edit expiration for alice' })
    );
    await confirm();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'User no longer exists'
    );
    expect(screen.getByLabelText('Expiration date')).toHaveValue('2026-09-01');
    expect(mocks.success).not.toHaveBeenCalled();
  });
  it('trims searches, resets the page and preserves queries in pagination', async () => {
    renderPage();
    expect(
      screen.getByRole('link', { name: 'Go to next page' })
    ).toHaveAttribute('href', '/manage/user-expiration?page=3&q=alice');
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: ' bob ' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(mocks.push).toHaveBeenCalledWith('/manage/user-expiration?q=bob');
  });
  it('shows a graceful empty state', () => {
    renderPage({ ...data, udocs: [], count: 0, numPages: 0 });
    expect(screen.getByText('No users found')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });
});
