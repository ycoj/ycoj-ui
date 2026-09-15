import DailyCheckin from './daily-checkin';
import messages from '@/messages/en';
import type {
  CheckinRecord,
  CheckinResponse,
  HomepageCheckin,
} from '@/shared/types/checkin';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  checkin: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: { Checkin: { checkin: mocks.checkin } },
}));

const record: CheckinRecord = {
  date: '2026-08-01',
  fortune: 'da_ji',
  hitokoto: {
    id: 1,
    uuid: 'quote-uuid',
    text: 'Today is worth remembering.',
    type: 'a',
    from: 'A Book',
    fromWho: null,
  },
};

function renderCheckin(
  overrides: Partial<HomepageCheckin> = {},
  username = 'visitor'
) {
  const checkin: HomepageCheckin = {
    timezone: 'UTC+08:00',
    date: '2026-08-01',
    canCheckin: true,
    record: null,
    streak: 0,
    ...overrides,
  };
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DailyCheckin checkin={checkin} username={username} />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  mocks.checkin.mockReset();
});

test('shows the API date and check-in action before check-in', async () => {
  renderCheckin();

  await expect.element(page.getByText('01', { exact: true })).toBeVisible();
  await expect.element(page.getByText('Aug', { exact: true })).toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Check in' }))
    .toBeEnabled();
  await expect
    .element(page.getByText('Not checked in yet today', { exact: true }))
    .not.toBeInTheDocument();
});

test('disables immediately, sends only once, and accepts created false', async () => {
  let resolveRequest!: (response: CheckinResponse) => void;
  const send = vi.fn(
    () =>
      new Promise<CheckinResponse>((resolve) => {
        resolveRequest = resolve;
      })
  );
  mocks.checkin.mockReturnValue({ send });
  renderCheckin();

  await userEvent.click(page.getByRole('button', { name: 'Check in' }));

  const pending = page.getByRole('button', { name: 'Checking in…' });
  await expect.element(pending).toBeDisabled();
  expect(mocks.checkin).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledTimes(1);

  resolveRequest({ created: false, record, streak: 1 });

  await expect
    .element(page.getByText('Great Fortune', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText(`“${record.hitokoto.text}”`, { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText('Current streak: 1 day', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Check in' }))
    .not.toBeInTheDocument();
});

test('restores the action and reports an error after failure', async () => {
  mocks.checkin.mockReturnValue({
    send: vi.fn().mockRejectedValue(new Error('network failure')),
  });
  renderCheckin();

  await userEvent.click(page.getByRole('button', { name: 'Check in' }));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect
    .element(alert)
    .toHaveTextContent('Check-in was not completed. Please try again later.');
  await expect
    .element(page.getByRole('button', { name: 'Check in' }))
    .toBeEnabled();
});

test('does not offer another action when already checked in', async () => {
  renderCheckin({ record, canCheckin: false, streak: 5 });

  await expect
    .element(page.getByText('Great Fortune', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText('——《A Book》', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText('Current streak: 5 days', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Check in' }))
    .not.toBeInTheDocument();
  expect(mocks.checkin).not.toHaveBeenCalled();
});

test('hides streak when the user has not checked in today', async () => {
  renderCheckin({ streak: 0 });

  await expect
    .element(page.getByText(/Current streak/))
    .not.toBeInTheDocument();
});

test('resets the record when the check-in date changes', async () => {
  mocks.checkin.mockReturnValue({
    send: vi.fn().mockResolvedValue({ created: true, record, streak: 1 }),
  });
  const { rerender } = await renderCheckin();

  await userEvent.click(page.getByRole('button', { name: 'Check in' }));
  await expect
    .element(page.getByText('Great Fortune', { exact: true }))
    .toBeVisible();

  await rerender(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DailyCheckin
        checkin={{
          timezone: 'UTC+08:00',
          date: '2026-08-02',
          canCheckin: true,
          record: null,
          streak: 0,
        }}
        username="visitor"
      />
    </NextIntlClientProvider>
  );

  await expect
    .element(page.getByRole('button', { name: 'Check in' }))
    .toBeEnabled();
});

test('renders quote text as escaped plain text', async () => {
  const unsafeRecord: CheckinRecord = {
    ...record,
    hitokoto: {
      ...record.hitokoto,
      uuid: '',
      text: '<img src=x onerror=alert(1)>',
    },
  };
  const { container } = await renderCheckin({ record: unsafeRecord });

  await expect
    .element(page.getByText('“<img src=x onerror=alert(1)>”', { exact: true }))
    .toBeVisible();
  expect(container.querySelector('img')).toBeNull();
  expect(mocks.checkin).not.toHaveBeenCalled();
});
