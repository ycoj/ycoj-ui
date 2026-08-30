import ExpirationActionDialog from '@/features/account-expiration/expiration-action-dialog';
import { submitExpiration } from '@/features/account-expiration/submit-expiration';
import messages from '@/messages/en.json';
import type { AccountExpirationAction } from '@/shared/types/account-expiration';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('expiration adjustment shortcuts', () => {
  beforeEach(() => vi.resetAllMocks());

  it.each([1, 7, 30, -1, -7, -30])(
    'fills %s days without saving until confirmation',
    async (days) => {
      renderDialog();
      const count = Math.abs(days);
      const label = `${days > 0 ? 'Extend' : 'Shorten'} by ${count} ${count === 1 ? 'day' : 'days'}`;
      await userEvent.click(screen.getByRole('button', { name: label }));
      expect(screen.getByLabelText('Days to adjust')).toHaveValue(days);
      expect(submitExpiration).not.toHaveBeenCalled();
      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      expect(submitExpiration).toHaveBeenCalledExactlyOnceWith(
        { operation: 'adjust', uids: [1, 3], days },
        messages.accountExpiration.failed
      );
    }
  );

  it('clears invalid-day errors and allows manual changes after picking a shortcut', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'non-zero whole number'
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Extend by 7 days' })
    );
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText('Days to adjust'), {
      target: { value: '-12' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(submitExpiration).toHaveBeenCalledExactlyOnceWith(
      { operation: 'adjust', uids: [1, 3], days: -12 },
      messages.accountExpiration.failed
    );
  });

  it('disables shortcuts while saving', async () => {
    vi.mocked(submitExpiration).mockReturnValue(
      new Promise<'success'>(() => {})
    );
    renderDialog();
    await userEvent.click(
      screen.getByRole('button', { name: 'Extend by 30 days' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    const shortcuts = within(
      screen.getByRole('group', { name: 'Quick day adjustments' })
    );
    for (const button of shortcuts.getAllByRole('button'))
      expect(button).toBeDisabled();
    await userEvent.click(
      shortcuts.getByRole('button', { name: 'Shorten by 1 day' })
    );
    expect(screen.getByLabelText('Days to adjust')).toHaveValue(30);
    expect(submitExpiration).toHaveBeenCalledOnce();
  });

  it.each(['set', 'clear'] as const)(
    'does not show shortcuts for %s',
    (operation) => {
      renderDialog(operation);
      expect(
        screen.queryByRole('group', { name: 'Quick day adjustments' })
      ).not.toBeInTheDocument();
    }
  );
});
