import ContestTimer from '@/features/contest/contest-timer';
import messages from '@/messages/en.json';
import type { Contest } from '@/shared/types/contest';
import { NextIntlClientProvider } from 'next-intl';
import { act } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

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

afterEach(() => {
  vi.useRealTimers();
});

test('renders progress and updates the countdown every second', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T10:30:00.000Z'));
  await renderTimer();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });

  const progress = document.querySelector<HTMLElement>('[role="progressbar"]')!;
  expect(progress.getAttribute('aria-valuenow')).toBe('50');

  const indicator = progress.querySelector<HTMLElement>('div')!;
  await expect.poll(() => indicator.style.width).toBe('50%');
  expect(document.body.textContent).toContain('00:30:00');

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(document.body.textContent).toContain('00:29:59');
});

test('hides after the contest ends', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T11:00:00.000Z'));
  await renderTimer();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });

  expect(document.querySelector('[role="progressbar"]')).toBeNull();
});

test('hides before the contest starts', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T09:59:00.000Z'));
  await renderTimer();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });

  expect(document.querySelector('[role="progressbar"]')).toBeNull();
});
