import HomeworkCloneDialog from './homework-clone-dialog';
import type { HomeworkCloneValues } from '@/features/homework/form/homework-form-utils';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const prefilled: HomeworkCloneValues = {
  title: 'Week 1 homework',
  beginAtDate: '2026-09-01',
  beginAtTime: '08:00',
  penaltySinceDate: '2026-09-08',
  penaltySinceTime: '23:59',
};

function renderDialog(
  defaultValues: HomeworkCloneValues = prefilled,
  onConfirm = vi.fn().mockResolvedValue(undefined)
) {
  const onClose = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <HomeworkCloneDialog
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

test('prefills the clone settings', async () => {
  renderDialog();

  const dialog = page.getByRole('dialog', { name: 'Clone homework' });
  await expect.element(dialog).toBeVisible();
  const describedBy = dialog.element().getAttribute('aria-describedby');
  expect(document.getElementById(describedBy!)?.textContent).toBe(
    messages.homeworkEdit.cloneDescription
  );

  await expect
    .element(page.getByLabelText('Title'))
    .toHaveValue('Week 1 homework');
  await expect
    .element(page.getByLabelText('Start date'))
    .toHaveValue('2026-09-01');
  await expect.element(page.getByLabelText('Start time')).toHaveValue('08:00');
  await expect
    .element(page.getByLabelText('Deadline date'))
    .toHaveValue('2026-09-08');
  await expect
    .element(page.getByLabelText('Deadline time'))
    .toHaveValue('23:59');
});

test('blocks a deadline before the start time', async () => {
  const { onConfirm } = renderDialog({
    ...prefilled,
    penaltySinceDate: '2026-09-01',
    penaltySinceTime: '07:00',
  });

  await userEvent.click(page.getByRole('button', { name: 'Clone' }));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect
    .element(alert)
    .toHaveTextContent(messages.homeworkEdit.endAfterStart);
  expect(onConfirm).not.toHaveBeenCalled();
});

test('confirms with the edited settings', async () => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  renderDialog(undefined, onConfirm);

  await userEvent.fill(page.getByLabelText('Title'), 'Week 2 homework');
  await userEvent.fill(page.getByLabelText('Deadline date'), '2026-09-15');
  await userEvent.click(page.getByRole('button', { name: 'Clone' }));

  await expect.poll(() => onConfirm.mock.calls.length).toBe(1);
  expect(onConfirm).toHaveBeenCalledExactlyOnceWith({
    title: 'Week 2 homework',
    beginAtDate: '2026-09-01',
    beginAtTime: '08:00',
    penaltySinceDate: '2026-09-15',
    penaltySinceTime: '23:59',
  });
});

test('shows clone failures inside the dialog and stays open', async () => {
  const onConfirm = vi.fn().mockRejectedValue(new Error('Permission denied'));
  renderDialog(undefined, onConfirm);

  await userEvent.click(page.getByRole('button', { name: 'Clone' }));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Permission denied');
  await expect
    .element(page.getByRole('dialog', { name: 'Clone homework' }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Clone' }))
    .toBeEnabled();
});

test('cancels without confirming', async () => {
  const { onConfirm, onClose } = renderDialog();

  await userEvent.click(page.getByRole('button', { name: 'Cancel' }));

  expect(onConfirm).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledExactlyOnceWith();
});
