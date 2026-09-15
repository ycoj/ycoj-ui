import ContestCloneDialog from './contest-clone-dialog';
import type { ContestCloneValues } from '@/features/contest/form/contest-form-utils';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const prefilled: ContestCloneValues = {
  title: 'Weekly contest',
  beginAtDate: '2026-09-01',
  beginAtTime: '10:00',
  duration: '3',
};

function renderDialog(
  defaultValues: ContestCloneValues = prefilled,
  onConfirm = vi.fn().mockResolvedValue(undefined)
) {
  const onClose = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContestCloneDialog
        defaultValues={defaultValues}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </NextIntlClientProvider>
  );
  return { onConfirm, onClose };
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('prefills the clone settings and previews the end time', async () => {
  renderDialog();

  const dialog = page.getByRole('dialog', { name: 'Clone contest' });
  await expect.element(dialog).toBeVisible();
  const describedBy = dialog.element().getAttribute('aria-describedby');
  expect(document.getElementById(describedBy!)?.textContent).toBe(
    messages.contestEdit.cloneDescription
  );

  await expect
    .element(page.getByLabelText('Title'))
    .toHaveValue('Weekly contest');
  await expect
    .element(page.getByLabelText('Start date'))
    .toHaveValue('2026-09-01');
  await expect.element(page.getByLabelText('Start time')).toHaveValue('10:00');
  await expect.element(page.getByLabelText('Duration (hours)')).toHaveValue(3);
  await expect
    .element(page.getByLabelText('End time'))
    .toHaveValue('2026-09-01 13:00');
});

test('updates the end time preview while editing', async () => {
  renderDialog();

  await userEvent.fill(page.getByLabelText('Duration (hours)'), '1.5');

  await expect
    .element(page.getByLabelText('End time'))
    .toHaveValue('2026-09-01 11:30');
});

test('blocks confirmation while the settings are invalid', async () => {
  const { onConfirm } = renderDialog({ ...prefilled, title: '   ' });

  await userEvent.click(page.getByRole('button', { name: 'Clone' }));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect
    .element(alert)
    .toHaveTextContent(messages.contestEdit.titleRequired);
  expect(onConfirm).not.toHaveBeenCalled();
});

test('confirms with the edited settings', async () => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  renderDialog(undefined, onConfirm);

  await userEvent.fill(page.getByLabelText('Title'), 'Night contest');
  await userEvent.fill(page.getByLabelText('Start time'), '20:30');
  await userEvent.click(page.getByRole('button', { name: 'Clone' }));

  await expect.poll(() => onConfirm.mock.calls.length).toBe(1);
  expect(onConfirm).toHaveBeenCalledExactlyOnceWith({
    title: 'Night contest',
    beginAtDate: '2026-09-01',
    beginAtTime: '20:30',
    duration: '3',
  });
});

test('does not submit an outer form when confirming the clone', async () => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  const onOuterSubmit = vi.fn();
  await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <form onSubmit={onOuterSubmit}>
        <ContestCloneDialog
          defaultValues={prefilled}
          onClose={vi.fn()}
          onConfirm={onConfirm}
        />
      </form>
    </NextIntlClientProvider>
  );

  await userEvent.click(page.getByRole('button', { name: 'Clone' }));

  await expect.poll(() => onConfirm.mock.calls.length).toBe(1);
  expect(onConfirm).toHaveBeenCalledExactlyOnceWith(prefilled);
  expect(onOuterSubmit).not.toHaveBeenCalled();
});

test('shows clone failures inside the dialog and stays open', async () => {
  const onConfirm = vi.fn().mockRejectedValue(new Error('Permission denied'));
  renderDialog(undefined, onConfirm);

  await userEvent.click(page.getByRole('button', { name: 'Clone' }));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Permission denied');
  await expect
    .element(page.getByRole('dialog', { name: 'Clone contest' }))
    .toBeVisible();
  const clone = page.getByRole('button', { name: 'Clone' });
  await expect.element(clone).toBeEnabled();
});

test('cancels without confirming', async () => {
  const { onConfirm, onClose } = renderDialog();

  await userEvent.click(page.getByRole('button', { name: 'Cancel' }));

  expect(onConfirm).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledExactlyOnceWith();
});
