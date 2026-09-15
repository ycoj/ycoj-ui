import UsernamesDialog from './user-import-usernames-dialog';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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
  return { onApply, onOpenChange };
}

test('fills every row missing a username, even past the append cap', async () => {
  const { onApply, onOpenChange } = setup(1500);

  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  const missingRadio = dialog.getByRole('radio', {
    name: 'Rows missing a username',
  });
  await expect.element(missingRadio).toBeChecked();
  await expect
    .element(dialog.getByLabelText('How many users'))
    .not.toBeInTheDocument();

  await userEvent.type(dialog.getByLabelText('Prefix'), 's');
  await userEvent.click(dialog.getByRole('button', { name: 'Generate' }));

  expect(onApply).toHaveBeenCalledWith(
    { prefix: 's', start: 1, count: 1500, digits: 3 },
    'fill'
  );
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test('keeps the dialog open and its input on invalid applies', async () => {
  const { onApply, onOpenChange } = setup(0);

  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.click(dialog.getByRole('button', { name: 'Generate' }));

  const alert = dialog.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Enter a prefix.');
  expect(onApply).not.toHaveBeenCalled();
  expect(onOpenChange).not.toHaveBeenCalled();

  await userEvent.type(dialog.getByLabelText('Prefix'), 's');
  await userEvent.fill(dialog.getByLabelText('How many users'), '2000');
  await userEvent.click(dialog.getByRole('button', { name: 'Generate' }));

  await expect
    .element(dialog.getByRole('alert'))
    .toHaveTextContent('Enter a count between 1 and 1000.');
  expect(onApply).not.toHaveBeenCalled();
  expect(onOpenChange).not.toHaveBeenCalled();
  await expect.element(page.getByRole('dialog')).toBeVisible();
});
