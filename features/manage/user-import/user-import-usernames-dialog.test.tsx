import UsernamesDialog from './user-import-usernames-dialog';
import messages from '@/messages/en.json';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

// Radix checkboxes mount a hidden form input inside the dialog <form>, which
// measures the control with ResizeObserver.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

function setup(missingUsernames: number) {
  const onApply = vi.fn(() => true);
  const onOpenChange = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <UsernamesDialog
        open
        missingUsernames={missingUsernames}
        onOpenChange={onOpenChange}
        onApply={onApply}
      />
    </NextIntlClientProvider>
  );
  return { user: userEvent.setup(), onApply, onOpenChange };
}

describe('usernames dialog', () => {
  it('fills every row missing a username, even past the append cap', async () => {
    const { user, onApply, onOpenChange } = setup(1500);
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('radio', {
        name: 'Rows missing a username',
      })
    ).toBeChecked();
    expect(
      within(dialog).queryByLabelText('How many users')
    ).not.toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('Prefix'), 's');
    await user.click(within(dialog).getByRole('button', { name: 'Generate' }));
    expect(onApply).toHaveBeenCalledWith(
      { prefix: 's', start: 1, count: 1500, digits: 3 },
      'fill'
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the dialog open and its input on invalid applies', async () => {
    const { user, onApply, onOpenChange } = setup(0);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Generate' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Enter a prefix.'
    );
    expect(onApply).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.type(within(dialog).getByLabelText('Prefix'), 's');
    fireEvent.change(within(dialog).getByLabelText('How many users'), {
      target: { value: '2000' },
    });
    await user.click(within(dialog).getByRole('button', { name: 'Generate' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Enter a count between 1 and 1000.'
    );
    expect(onApply).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
