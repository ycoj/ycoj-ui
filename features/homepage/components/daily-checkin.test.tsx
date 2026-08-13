import DailyCheckin from './daily-checkin';
import messages from '@/messages/en.json';
import type {
  CheckinRecord,
  CheckinResponse,
  HomepageCheckin,
} from '@/shared/types/checkin';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('DailyCheckin', () => {
  beforeEach(() => {
    mocks.checkin.mockReset();
  });

  it('shows the API date and check-in action before check-in', () => {
    renderCheckin();

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('Aug')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check in' })).toBeEnabled();
    expect(screen.queryByText('Not checked in yet today')).toBeNull();
    expect(screen.queryByText('Refreshes daily at 00:00 (UTC+8)')).toBeNull();
  });

  it('disables immediately, sends only once, and accepts created false', async () => {
    let resolveRequest!: (response: CheckinResponse) => void;
    const send = vi.fn(
      () =>
        new Promise<CheckinResponse>((resolve) => {
          resolveRequest = resolve;
        })
    );
    mocks.checkin.mockReturnValue({ send });
    renderCheckin();

    const button = screen.getByRole('button', { name: 'Check in' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.getByRole('button', { name: 'Checking in…' })).toBeDisabled();
    expect(mocks.checkin).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest({ created: false, record, streak: 1 });
    });

    expect(screen.getByText('Great Fortune')).toBeInTheDocument();
    expect(screen.getByText(`“${record.hitokoto.text}”`)).toBeInTheDocument();
    expect(screen.getByText('Current streak: 1 day')).toBeInTheDocument();
    expect(screen.queryByText('01')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Check in' })).toBeNull();
  });

  it('restores the action and reports an error after failure', async () => {
    mocks.checkin.mockReturnValue({
      send: vi.fn().mockRejectedValue(new Error('network failure')),
    });
    renderCheckin();

    fireEvent.click(screen.getByRole('button', { name: 'Check in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Check-in was not completed. Please try again later.'
    );
    expect(screen.getByRole('button', { name: 'Check in' })).toBeEnabled();
  });

  it('does not offer another action when already checked in', () => {
    renderCheckin({ record, canCheckin: false, streak: 5 });

    expect(screen.getByText('Great Fortune')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check in' })).toBeNull();
    expect(mocks.checkin).not.toHaveBeenCalled();
    expect(screen.getByText('——《A Book》')).toBeInTheDocument();
    expect(screen.getByText('Current streak: 5 days')).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('hides streak when the user has not checked in today', () => {
    renderCheckin({ streak: 0 });

    expect(screen.queryByText(/Current streak/)).toBeNull();
  });

  it('resets the record when the check-in date changes', async () => {
    mocks.checkin.mockReturnValue({
      send: vi.fn().mockResolvedValue({ created: true, record, streak: 1 }),
    });
    const { rerender } = renderCheckin();

    fireEvent.click(screen.getByRole('button', { name: 'Check in' }));
    expect(await screen.findByText('Great Fortune')).toBeInTheDocument();

    rerender(
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

    expect(
      await screen.findByRole('button', { name: 'Check in' })
    ).toBeEnabled();
  });

  it('renders quote text as escaped plain text', async () => {
    const unsafeRecord: CheckinRecord = {
      ...record,
      hitokoto: {
        ...record.hitokoto,
        uuid: '',
        text: '<img src=x onerror=alert(1)>',
      },
    };
    const { container } = renderCheckin({ record: unsafeRecord });

    expect(
      screen.getByText('“<img src=x onerror=alert(1)>”')
    ).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    await waitFor(() => expect(mocks.checkin).not.toHaveBeenCalled());
  });
});
