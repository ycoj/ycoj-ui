import ContestTimer from '@/features/contest/contest-timer';
import messages from '@/messages/en.json';
import type { Contest } from '@/shared/types/contest';
import { act, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

const contest = {
  beginAt: '2026-01-01T10:00:00.000Z',
  endAt: '2026-01-01T11:00:00.000Z',
  duration: 0,
} as unknown as Contest;

function renderTimer() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContestTimer contest={contest} />
    </NextIntlClientProvider>
  );
}

describe('ContestTimer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders progress and updates the countdown every second', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
    renderTimer();
    act(() => vi.advanceTimersByTime(0));

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0'
    );
    expect(screen.getByText('01:00:00')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByText('00:59:59')).toBeInTheDocument();
  });

  it('hides after the contest ends', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T11:00:00.000Z'));
    renderTimer();
    act(() => vi.advanceTimersByTime(0));

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
