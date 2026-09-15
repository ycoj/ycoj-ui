import SolutionStatus from './solution-status';
import messages from '@/messages/en';
import type { SolutionReviewStatus } from '@/shared/types/problem';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

const localizedLabels: Record<string, string> = messages.solution.status;

function mount(
  status: SolutionReviewStatus | undefined,
  fallbackLabel?: string
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SolutionStatus status={status} fallbackLabel={fallbackLabel} />
    </NextIntlClientProvider>
  );
}

test.each([-1, 0, 1, 2, 3] as const)('localizes status %s', async (status) => {
  await mount(status, 'Backend label');

  const label = page.getByText(localizedLabels[String(status)], {
    exact: true,
  });
  await expect.element(label).toBeVisible();
  expect(label.element().getBoundingClientRect().height).toBeGreaterThan(0);
});

test('uses the backend label for a status this client does not know yet', async () => {
  // The backend can introduce a status before this client learns about it.
  await mount(-2 as SolutionReviewStatus, 'Held for review');

  await expect
    .element(page.getByText('Held for review', { exact: true }))
    .toBeVisible();
});

test('falls back to a generic label without a backend label or a status', async () => {
  await mount(undefined);

  await expect
    .element(page.getByText(localizedLabels.unknown, { exact: true }))
    .toBeVisible();
});
