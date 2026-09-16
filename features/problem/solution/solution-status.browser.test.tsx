import SolutionStatus from './solution-status';
import messages from '@/messages/en';
import type { SolutionReviewStatus } from '@/shared/types/problem';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

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

describe('solution status badge', () => {
  it.each([-1, 0, 1, 2, 3] as const)('localizes status %s', (status) => {
    mount(status, 'Backend label');
    expect(screen.getByText(localizedLabels[String(status)])).toBeVisible();
  });

  it('uses the backend label for a status this client does not know yet', () => {
    // The backend can introduce a status before this client learns about it.
    mount(-2 as SolutionReviewStatus, 'Held for review');
    expect(screen.getByText('Held for review')).toBeVisible();
  });

  it('falls back to a generic label without a backend label or a status', () => {
    mount(undefined);
    expect(screen.getByText(localizedLabels.unknown)).toBeVisible();
  });
});
