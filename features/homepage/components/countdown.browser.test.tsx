import Countdown from './countdown';
import type { CountdownConfig } from '@/api/server/method/ui/homepage';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

const DAY = 24 * 60 * 60 * 1000;

function isoFromNow(offsetMs: number) {
  return new Date(Date.now() + offsetMs).toISOString();
}

function renderCountdown(config: CountdownConfig) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Countdown config={config} />
    </NextIntlClientProvider>
  );
}

test('shows an empty state when all events have ended', async () => {
  await renderCountdown({
    startDate: '2026-01-01',
    events: [
      {
        name: 'Past event',
        date: isoFromNow(-3 * DAY),
        duration: 1,
      },
    ],
  });

  await expect
    .element(
      page.getByText('No events are currently in progress', { exact: true })
    )
    .toBeVisible();
  await expect
    .element(page.getByText('Past event', { exact: true }))
    .not.toBeInTheDocument();
});

test('renders a countdown for an event that has not ended', async () => {
  await renderCountdown({
    startDate: '2026-01-01',
    events: [
      {
        name: 'Future event',
        date: isoFromNow(2 * DAY + 60 * 60 * 1000),
        duration: 2,
      },
    ],
  });

  await expect
    .element(page.getByText('Future event', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByText('2d', { exact: true })).toBeVisible();
  await expect
    .element(
      page.getByText('No events are currently in progress', { exact: true })
    )
    .not.toBeInTheDocument();
});

test('marks an event that is already running', async () => {
  await renderCountdown({
    startDate: '2026-01-01',
    events: [
      {
        name: 'Ongoing event',
        date: isoFromNow(-DAY),
        duration: 3,
      },
    ],
  });

  const running = page.getByText('In progress', { exact: true });
  await expect.element(running).toBeVisible();
  await expect
    .poll(() => getComputedStyle(running.element()).color)
    .toBe('oklch(0.592 0.249 0.584)');

  const name = page.getByText('Ongoing event', { exact: true });
  const nameBounds = name.element().getBoundingClientRect();
  const runningBounds = running.element().getBoundingClientRect();
  expect(nameBounds.right).toBeLessThanOrEqual(runningBounds.left + 4);
  expect(nameBounds.bottom).toBeGreaterThan(runningBounds.top);
});
