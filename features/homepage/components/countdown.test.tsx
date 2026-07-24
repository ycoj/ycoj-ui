import Countdown from './countdown';
import type { CountdownConfig } from '@/api/server/method/ui/homepage';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

function renderCountdown(config: CountdownConfig) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Countdown config={config} />
    </NextIntlClientProvider>
  );
}

describe('Countdown', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows an empty state when all events have ended', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-10T00:00:00.000Z'));

    renderCountdown({
      startDate: '2026-01-01',
      events: [
        {
          name: 'Past event',
          date: '2026-01-01T00:00:00.000Z',
          duration: 2,
        },
      ],
    });

    expect(
      screen.getByText('No events are currently in progress')
    ).toBeInTheDocument();
    expect(screen.queryByText('Past event')).not.toBeInTheDocument();
  });

  it('renders a countdown for an event that has not ended', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    renderCountdown({
      startDate: '2026-01-01',
      events: [
        {
          name: 'Future event',
          date: '2026-01-03T00:00:00.000Z',
          duration: 2,
        },
      ],
    });

    expect(screen.getByText('Future event')).toBeInTheDocument();
    expect(
      screen.queryByText('No events are currently in progress')
    ).not.toBeInTheDocument();
  });
});
