import ExpirationActionDialog from '@/features/account-expiration/expiration-action-dialog';
import { submitExpiration } from '@/features/account-expiration/submit-expiration';
import messages from '@/messages/en.json';
import type { AccountExpirationAction } from '@/shared/types/account-expiration';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

vi.mock('@/features/account-expiration/submit-expiration', () => ({
  submitExpiration: vi.fn(),
}));

function renderDialog(
  operation: AccountExpirationAction['operation'] = 'adjust'
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ExpirationActionDialog
        target={{ operation, uids: [1, 3] }}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    </NextIntlClientProvider>
  );
}

beforeEach(() => vi.resetAllMocks());

test.each([1, 7, 30, -1, -7, -30])(
  'fills %s days without saving until confirmation',
  async (days) => {
    renderDialog();
    const count = Math.abs(days);
    const label = `${days > 0 ? 'Extend' : 'Shorten'} by ${count} ${
      count === 1 ? 'day' : 'days'
    }`;
    const shortcut = page.getByRole('button', { name: label });
    await expect.element(shortcut).toBeVisible();
    await userEvent.click(shortcut);

    await expect
      .element(page.getByLabelText('Days to adjust'))
      .toHaveValue(days);
    expect(submitExpiration).not.toHaveBeenCalled();

    await userEvent.click(page.getByRole('button', { name: 'Confirm' }));
    await expect
      .poll(() => vi.mocked(submitExpiration).mock.calls.length)
      .toBe(1);
    expect(submitExpiration).toHaveBeenCalledExactlyOnceWith(
      { operation: 'adjust', uids: [1, 3], days },
      messages.accountExpiration.failed
    );
  }
);

test('clears invalid-day errors and allows manual changes after picking a shortcut', async () => {
  renderDialog();

  await userEvent.click(page.getByRole('button', { name: 'Confirm' }));
  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('non-zero whole number');

  await userEvent.click(page.getByRole('button', { name: 'Extend by 7 days' }));
  await expect.element(alert).not.toBeInTheDocument();

  await userEvent.fill(page.getByLabelText('Days to adjust'), '-12');
  await userEvent.click(page.getByRole('button', { name: 'Confirm' }));
  await expect
    .poll(() => vi.mocked(submitExpiration).mock.calls.length)
    .toBe(1);
  expect(submitExpiration).toHaveBeenCalledExactlyOnceWith(
    { operation: 'adjust', uids: [1, 3], days: -12 },
    messages.accountExpiration.failed
  );
});

test('disables shortcuts while saving', async () => {
  vi.mocked(submitExpiration).mockReturnValue(new Promise<'success'>(() => {}));
  renderDialog();

  await userEvent.click(
    page.getByRole('button', { name: 'Extend by 30 days' })
  );
  await userEvent.click(page.getByRole('button', { name: 'Confirm' }));

  const shortcuts = page.getByRole('group', { name: 'Quick day adjustments' });
  await expect.element(shortcuts).toBeVisible();
  await expect
    .poll(() =>
      shortcuts
        .getByRole('button')
        .elements()
        .every((b) => b.hasAttribute('disabled'))
    )
    .toBe(true);

  await expect
    .element(shortcuts.getByRole('button', { name: 'Shorten by 1 day' }))
    .toBeDisabled();
  await expect.element(page.getByLabelText('Days to adjust')).toHaveValue(30);
  expect(submitExpiration).toHaveBeenCalledOnce();
});

test.each(['set', 'clear'] as const)(
  'does not show shortcuts for %s',
  async (operation) => {
    renderDialog(operation);

    await expect
      .element(page.getByRole('group', { name: 'Quick day adjustments' }))
      .not.toBeInTheDocument();
  }
);
