import ContestStatus from '@/features/contest/contest-status';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

type Status = 'running' | 'pending' | 'ended';

function renderStatus(status: Status) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContestStatus status={status} />
    </NextIntlClientProvider>
  );
}

const LIGHT_APPEARANCE = [
  [
    'running',
    'Running',
    'oklch(0.525 0.223 3.958)',
    'oklch(0.948 0.028 342.258)',
  ],
  [
    'pending',
    'Upcoming',
    'oklch(0.5 0.134 242.749)',
    'oklch(0.951 0.026 236.824)',
  ],
  ['ended', 'Ended', 'oklch(0.556 0 0)', 'oklch(0.97 0 0)'],
] as const;

test.each(LIGHT_APPEARANCE)(
  'renders the %s badge in its status colors',
  async (status, labelText, textColor, backgroundColor) => {
    await renderStatus(status);

    const label = page.getByText(labelText, { exact: true });
    await expect.element(label).toBeVisible();
    await expect
      .poll(() => getComputedStyle(label.element()).color)
      .toBe(textColor);

    const badge = label.element().closest('[data-slot="badge"]')!;
    await expect
      .poll(() => getComputedStyle(badge).backgroundColor)
      .toBe(backgroundColor);

    const textBounds = label.element().getBoundingClientRect();
    const badgeBounds = badge.getBoundingClientRect();
    expect(textBounds.width).toBeGreaterThan(0);
    expect(badgeBounds.height).toBeGreaterThan(textBounds.height);
    expect(textBounds.left).toBeGreaterThan(badgeBounds.left);
    expect(textBounds.right).toBeLessThan(badgeBounds.right);
  }
);

test('switches the pending badge to its readable dark theme colors', async () => {
  await renderStatus('pending');
  document.documentElement.classList.add('dark');

  const label = page.getByText('Upcoming', { exact: true });
  await expect
    .poll(() => getComputedStyle(label.element()).color)
    .toBe('oklch(0.828 0.111 230.318)');
  const badge = label.element().closest('[data-slot="badge"]')!;
  await expect
    .poll(() => getComputedStyle(badge).backgroundColor)
    .toBe('oklab(0.685 -0.0912435 -0.142252 / 0.2)');
});

test('keeps ended badges readable against the dark surface', async () => {
  await renderStatus('ended');
  document.documentElement.classList.add('dark');

  const label = page.getByText('Ended', { exact: true });
  await expect
    .poll(() => getComputedStyle(label.element()).color)
    .toBe('oklch(0.708 0 0)');
  const badge = label.element().closest('[data-slot="badge"]')!;
  await expect
    .poll(() => getComputedStyle(badge).backgroundColor)
    .toBe('oklch(0.269 0 0)');
});
